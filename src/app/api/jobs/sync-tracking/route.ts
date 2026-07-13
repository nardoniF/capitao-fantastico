import { NextResponse } from "next/server";
import { emailShipped, emailTrackingUpdate } from "@/lib/email";
import { askMissionOnDelivery } from "@/lib/mission";
import { listOrders, updateOrder } from "@/lib/store-db";
import {
  appendTrackingEvent,
  mapRawToPipeline,
  pipelineLabel,
  pipelineToOrderStatus,
  type PipelineStage,
} from "@/lib/order-tracking";
import { getCJSupplier } from "@/lib/suppliers/cj";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

/**
 * Job gratuito: só API CJ (conta já existente).
 * Não consulta Correios (CAPTCHA) nem APIs pagas (17TRACK/AfterShip).
 * Roda a cada 30 min → atualiza store → e-mail se mudou.
 * Para de consultar quando entregue.
 */
async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cj = getCJSupplier();
  const orders = (await listOrders()).filter(
    (o) =>
      o.supplierOrderId &&
      (o.status === "paid" ||
        o.status === "fulfilling" ||
        o.status === "shipped"),
  );

  let updated = 0;
  const errors: string[] = [];

  for (const order of orders.slice(0, 100)) {
    if (!order.supplierOrderId) continue;
    try {
      const track = await cj.getTracking(order.supplierOrderId);
      if (!track) continue;

      const code =
        (track.code || "").trim() || order.supplierTracking || undefined;
      const carrier = track.carrier || order.trackingCarrier || undefined;

      const rawBits = [
        track.status,
        ...(track.events || []).map((e) => e.description),
      ]
        .filter(Boolean)
        .join(" · ");

      const stage: PipelineStage | null =
        mapRawToPipeline(rawBits, {
          orderStatus: order.status,
          hasCode: Boolean(code),
        }) ||
        (code ? "in_transit" : null);

      const prevStatus = order.status;
      const prevStage = order.pipelineStage;
      let nextStatus = order.status;
      if (stage) {
        const mapped = pipelineToOrderStatus(stage);
        if (mapped === "fulfilled") nextStatus = "fulfilled";
        else if (mapped === "shipped" && order.status !== "fulfilled") {
          nextStatus = "shipped";
        } else if (
          mapped === "fulfilling" &&
          (order.status === "paid" || order.status === "fulfilling")
        ) {
          nextStatus = "fulfilling";
        } else if (
          code &&
          (order.status === "paid" || order.status === "fulfilling")
        ) {
          nextStatus = "shipped";
        }
      } else if (code && (order.status === "paid" || order.status === "fulfilling")) {
        nextStatus = "shipped";
      }

      let events = order.trackingEvents || [];
      const now = new Date().toISOString();

      if (track.events?.length) {
        for (const ev of track.events) {
          const st =
            mapRawToPipeline(ev.description, { hasCode: Boolean(code) }) ||
            stage ||
            undefined;
          events = appendTrackingEvent(events, {
            at: ev.at || now,
            label: st ? pipelineLabel(st) : ev.description.slice(0, 80),
            detail: ev.location || undefined,
            stage: st || undefined,
            location: ev.location,
          });
        }
      } else if (stage && stage !== prevStage) {
        events = appendTrackingEvent(events, {
          at: now,
          label: pipelineLabel(stage),
          detail: [
            code ? `Rastreio ${code}` : null,
            carrier,
            track.status ? `CJ: ${track.status}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
          stage,
        });
      } else if (nextStatus !== prevStatus) {
        events = appendTrackingEvent(events, {
          at: now,
          label: pipelineLabel(stage || (code ? "in_transit" : "picking")),
          detail: track.status || undefined,
          stage: stage || undefined,
        });
      }

      const changed =
        nextStatus !== order.status ||
        code !== order.supplierTracking ||
        carrier !== order.trackingCarrier ||
        stage !== prevStage ||
        events.length !== (order.trackingEvents?.length || 0);

      if (!changed) continue;

      const saved = await updateOrder(order.orderId, {
        status: nextStatus,
        supplierTracking: code,
        trackingCarrier: carrier,
        trackingEvents: events,
        pipelineStage: stage || order.pipelineStage,
      });
      updated += 1;

      const stageChanged = Boolean(stage && stage !== prevStage);
      const statusRose = nextStatus !== prevStatus;

      if (nextStatus === "shipped" && prevStatus !== "shipped") {
        await emailShipped({
          orderId: order.orderId,
          email: order.email,
          nome: order.nome,
          trackingCode: code,
          carrier,
        });
      } else if (nextStatus === "fulfilled" && prevStatus !== "fulfilled") {
        if (saved) await askMissionOnDelivery(saved);
      } else if (stageChanged || statusRose) {
        await emailTrackingUpdate({
          orderId: order.orderId,
          email: order.email,
          nome: order.nome,
          label: stage ? pipelineLabel(stage) : "Atualização do pedido",
          detail: [
            code ? `Código ${code}` : null,
            carrier,
            "Atualização automática · página do pedido",
          ]
            .filter(Boolean)
            .join(" · "),
        });
      }
    } catch (e) {
      errors.push(
        `${order.orderId}: ${e instanceof Error ? e.message : "erro"}`,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    provider: "cj",
    cost: 0,
    checked: orders.length,
    updated,
    errors,
  });
}
