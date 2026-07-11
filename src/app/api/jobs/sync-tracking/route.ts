import { NextResponse } from "next/server";
import { listOrders, updateOrder } from "@/lib/store-db";
import {
  appendTrackingEvent,
  mapCjStatusToOrder,
  statusLabel,
} from "@/lib/order-tracking";
import { getCJSupplier } from "@/lib/suppliers/cj";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Cron: puxa rastreio/status da CJ e atualiza o sensor do pedido no site.
 * GET/POST /api/jobs/sync-tracking
 */
export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

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

  for (const order of orders.slice(0, 80)) {
    if (!order.supplierOrderId) continue;
    try {
      const track = await cj.getTracking(order.supplierOrderId);
      if (!track) continue;

      const code =
        (track.code || "").trim() || order.supplierTracking || undefined;
      const carrier = track.carrier || order.trackingCarrier || undefined;
      const mapped = mapCjStatusToOrder(track.status, Boolean(code));

      let nextStatus = order.status;
      if (mapped === "fulfilled") nextStatus = "fulfilled";
      else if (mapped === "shipped" && order.status !== "fulfilled") {
        nextStatus = "shipped";
      } else if (
        mapped === "fulfilling" &&
        (order.status === "paid" || order.status === "fulfilling")
      ) {
        nextStatus = "fulfilling";
      } else if (code && order.status === "paid") {
        nextStatus = "shipped";
      }

      const events = appendTrackingEvent(order.trackingEvents, {
        at: new Date().toISOString(),
        label: statusLabel(nextStatus),
        detail:
          [
            code ? `Rastreio ${code}` : null,
            carrier,
            track.status ? `CJ: ${track.status}` : null,
          ]
            .filter(Boolean)
            .join(" · ") || undefined,
      });

      const changed =
        nextStatus !== order.status ||
        code !== order.supplierTracking ||
        carrier !== order.trackingCarrier ||
        events.length !== (order.trackingEvents?.length || 0);

      if (changed) {
        await updateOrder(order.orderId, {
          status: nextStatus,
          supplierTracking: code,
          trackingCarrier: carrier,
          trackingEvents: events,
        });
        updated += 1;
      }
    } catch (e) {
      errors.push(
        `${order.orderId}: ${e instanceof Error ? e.message : "erro"}`,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    checked: orders.length,
    updated,
    errors,
  });
}
