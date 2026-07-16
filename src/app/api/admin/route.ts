import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import {
  deleteNeonProduct,
  getAdminBundle,
  updateNeonProduct,
  updatePricingRule,
} from "@/lib/admin-data";
import { updateOrder } from "@/lib/store-db";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorized();
  try {
    const data = await getAdminBundle();
    return NextResponse.json(data);
  } catch (e) {
    console.error("admin GET", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no admin" },
      { status: 500 },
    );
  }
}

export async function PUT(request: Request) {
  if (!(await isAdminAuthorized(request))) return unauthorized();

  try {
    const body = (await request.json()) as {
      action?: string;
      orderId?: string;
      patch?: Record<string, unknown>;
      pricing?: { markup?: number; fxBrl?: number; feePct?: number };
      productId?: string;
      productPatch?: {
        salePrice?: number;
        active?: boolean;
        name?: string;
        blurb?: string;
      };
      hard?: boolean;
    };

    if (body.action === "update_pricing" && body.pricing) {
      const rule = await updatePricingRule(body.pricing);
      return NextResponse.json({
        ok: true,
        pricing: {
          markup: Number(rule.markup),
          fxBrl: Number(rule.fxBrl),
          feePct: Number(rule.feePct),
        },
      });
    }

    if (
      body.action === "update_neon_product" &&
      body.productId &&
      body.productPatch
    ) {
      const product = await updateNeonProduct(body.productId, body.productPatch);
      return NextResponse.json({ product });
    }

    if (body.action === "delete_product" && body.productId) {
      await deleteNeonProduct(body.productId, { hard: body.hard === true });
      return NextResponse.json({ ok: true });
    }

    if (body.action === "deactivate_product" && body.productId) {
      const product = await updateNeonProduct(body.productId, {
        active: false,
      });
      return NextResponse.json({ product });
    }

    if (body.action === "refund_order" && body.orderId) {
      const { findOrderById } = await import("@/lib/store-db");
      const order = await findOrderById(body.orderId);
      if (!order) {
        return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
      }
      if (!order.paymentRef) {
        return NextResponse.json(
          { error: "Pedido sem paymentRef do Mercado Pago" },
          { status: 400 },
        );
      }
      const { refundMercadoPagoPayment } = await import("@/lib/mp-refund");
      const result = await refundMercadoPagoPayment(order.paymentRef);
      if (!result.ok) {
        await updateOrder(order.orderId, {
          refundStatus: "failed",
          notes: [order.notes, `Refund falhou: ${result.error}`]
            .filter(Boolean)
            .join(" · "),
        });
        return NextResponse.json({ error: result.error }, { status: 502 });
      }
      const ticket = order.returnTicket
        ? {
            ...order.returnTicket,
            status: "refund" as const,
            updatedAt: new Date().toISOString(),
          }
        : undefined;
      const updated = await updateOrder(order.orderId, {
        refundStatus: "done",
        refundId: result.refundId,
        refundAt: new Date().toISOString(),
        returnStatus: "done",
        ...(ticket ? { returnTicket: ticket } : {}),
        notes: [order.notes, `Reembolso MP ${result.refundId || "ok"}`]
          .filter(Boolean)
          .join(" · "),
      });
      return NextResponse.json({ ok: true, order: updated, refundId: result.refundId });
    }

    if (
      body.action === "update_return_ticket" &&
      body.orderId &&
      body.patch &&
      typeof (body.patch as { ticketStatus?: string }).ticketStatus === "string"
    ) {
      const { findOrderById } = await import("@/lib/store-db");
      const order = await findOrderById(body.orderId);
      if (!order?.returnTicket) {
        return NextResponse.json({ error: "Sem ticket" }, { status: 404 });
      }
      const ticketStatus = (body.patch as { ticketStatus: string }).ticketStatus as
        | "analysis"
        | "approved"
        | "refund"
        | "exchange"
        | "coupon"
        | "denied";
      const ticket = {
        ...order.returnTicket,
        status: ticketStatus,
        updatedAt: new Date().toISOString(),
      };
      const updated = await updateOrder(order.orderId, {
        returnTicket: ticket,
        returnStatus:
          ticketStatus === "denied"
            ? "denied"
            : ticketStatus === "analysis"
              ? "requested"
              : "in_progress",
      });
      return NextResponse.json({ ok: true, order: updated });
    }

    if (body.action === "update_order" && body.orderId && body.patch) {
      const { findOrderById } = await import("@/lib/store-db");
      const current = await findOrderById(body.orderId);
      const patch = { ...body.patch } as Record<string, unknown>;
      const wasFulfilled = current?.status === "fulfilled";

      const captainReply =
        typeof patch._captainReply === "string" ? patch._captainReply.trim() : "";
      delete patch._captainReply;

      if (current && captainReply) {
        const messages = [
          ...(current.messages || []),
          {
            id: `msg_${Date.now().toString(36)}`,
            at: new Date().toISOString(),
            from: "captain" as const,
            text: captainReply.slice(0, 1200),
          },
        ].slice(-80);
        patch.messages = messages;
      }

      if (current && typeof patch.supplierTracking === "string") {
        const { appendTrackingEvent, statusLabel } = await import(
          "@/lib/order-tracking"
        );
        const nextStatus =
          patch.status === "fulfilled" ? "fulfilled" : "shipped";
        patch.status = nextStatus;
        patch.trackingEvents = appendTrackingEvent(current.trackingEvents, {
          at: new Date().toISOString(),
          label: statusLabel(String(nextStatus)),
          detail: `Rastreio ${patch.supplierTracking}`,
        });
      } else if (
        current &&
        patch.status === "fulfilled" &&
        current.status !== "fulfilled"
      ) {
        const { appendTrackingEvent, statusLabel } = await import(
          "@/lib/order-tracking"
        );
        patch.trackingEvents = appendTrackingEvent(current.trackingEvents, {
          at: new Date().toISOString(),
          label: statusLabel("fulfilled"),
          detail: "Entrega confirmada",
        });
      }
      const order = await updateOrder(
        body.orderId,
        patch as Parameters<typeof updateOrder>[1],
      );
      if (!order) {
        return NextResponse.json(
          { error: "Pedido não encontrado" },
          { status: 404 },
        );
      }
      if (order.status === "fulfilled" && !wasFulfilled) {
        const { askMissionOnDelivery } = await import("@/lib/mission");
        await askMissionOnDelivery(order);
      }
      return NextResponse.json({ order });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e) {
    console.error("admin PUT", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha" },
      { status: 500 },
    );
  }
}
