import { NextResponse } from "next/server";
import { findOrderById, listOrders } from "@/lib/store-db";
import {
  statusLabel,
  type TrackingEvent,
  type TrackingPublic,
} from "@/lib/order-tracking";

export const dynamic = "force-dynamic";

/**
 * Dados públicos de rastreio (sem endereço / telefone).
 * GET /api/orders/tracking?pedido=CFXXXX
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const pedido = (searchParams.get("pedido") || "").trim();
  if (!pedido) {
    return NextResponse.json(
      { error: "Informe o número do pedido" },
      { status: 400 },
    );
  }

  let order = await findOrderById(pedido);
  if (!order) {
    const all = await listOrders();
    order =
      all.find(
        (o) =>
          o.orderId.toLowerCase() === pedido.toLowerCase() ||
          o.paymentRef === pedido,
      ) ?? null;
  }

  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  const events: TrackingEvent[] = Array.isArray(order.trackingEvents)
    ? order.trackingEvents
    : [
        {
          at: order.createdAt,
          label: statusLabel("pending_payment"),
          detail: "Pedido criado na loja",
        },
      ];

  const body: TrackingPublic = {
    orderNumber: order.orderId,
    status: order.status as TrackingPublic["status"],
    trackingCode: order.supplierTracking || null,
    trackingCarrier: order.trackingCarrier || null,
    events,
    updatedAt: order.updatedAt || order.createdAt,
    delivered: order.status === "fulfilled",
    missionToken:
      order.status === "fulfilled" &&
      !order.missionResponse &&
      order.missionToken
        ? order.missionToken
        : null,
    missionResponse: order.missionResponse ?? null,
  };

  return NextResponse.json(body, {
    headers: { "Cache-Control": "no-store" },
  });
}
