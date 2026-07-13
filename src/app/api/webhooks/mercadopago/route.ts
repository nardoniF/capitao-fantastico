import { NextResponse } from "next/server";
import { findOrderById, updateOrder } from "@/lib/store-db";
import { afterPaymentApproved } from "@/lib/fulfill-order";
import {
  appendTrackingEvent,
} from "@/lib/order-tracking";

/**
 * Webhook Mercado Pago — marca pago, e-mail, fulfill CJ automático.
 */
export async function POST(request: Request) {
  try {
    const token = process.env.MP_ACCESS_TOKEN?.trim();
    if (!token) {
      return NextResponse.json({ ok: true, skipped: "no token" });
    }

    const url = new URL(request.url);
    let topic = url.searchParams.get("topic") || url.searchParams.get("type");
    let id = url.searchParams.get("id") || url.searchParams.get("data.id");

    try {
      const body = (await request.json()) as {
        type?: string;
        action?: string;
        data?: { id?: string };
      };
      topic = topic || body.type || body.action || null;
      id = id || body.data?.id || null;
    } catch {
      /* query-only */
    }

    if (!id) {
      return NextResponse.json({ ok: true, skipped: "no id" });
    }

    const isPayment =
      !topic || topic === "payment" || topic.includes("payment");
    if (!isPayment) {
      return NextResponse.json({ ok: true, skipped: topic });
    }

    const payRes = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    });

    if (!payRes.ok) {
      console.error("MP payment fetch failed", payRes.status);
      return NextResponse.json({ error: "payment fetch" }, { status: 502 });
    }

    const payment = (await payRes.json()) as {
      id: number;
      status?: string;
      external_reference?: string;
    };

    const orderId = payment.external_reference?.trim();
    if (!orderId) {
      return NextResponse.json({ ok: true, skipped: "no external_reference" });
    }

    const order = await findOrderById(orderId);
    if (!order) {
      return NextResponse.json({ ok: true, skipped: "order not found" });
    }

    if (payment.status === "approved") {
      if (order.status === "pending_payment" || order.status === "cancelled") {
        await updateOrder(orderId, {
          status: "paid",
          paymentRef: String(payment.id),
          pipelineStage: "payment_approved",
          trackingEvents: appendTrackingEvent(order.trackingEvents, {
            at: new Date().toISOString(),
            label: "Pagamento aprovado",
            detail: "Pagamento aprovado via Mercado Pago",
            stage: "payment_approved",
          }),
        });
        const refreshed = await findOrderById(orderId);
        if (refreshed) {
          // fire-and-forget safe: await so Vercel doesn't kill
          await afterPaymentApproved(refreshed);
        }
      } else if (!order.paymentRef) {
        await updateOrder(orderId, { paymentRef: String(payment.id) });
        if (!order.supplierOrderId && order.status === "paid") {
          await afterPaymentApproved(order);
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("webhook mp", error);
    return NextResponse.json({ error: "webhook" }, { status: 500 });
  }
}

export async function GET(request: Request) {
  return POST(request);
}
