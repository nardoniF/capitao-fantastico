import { NextResponse } from "next/server";
import {
  resolveOrder,
  toOrderHubPublic,
  type OrderMessage,
  type ServiceRequestStatus,
} from "@/lib/order-portal";
import { updateOrder } from "@/lib/store-db";
import { siteConfig } from "@/lib/site-config";
import { sendEmail } from "@/lib/email";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const { orderId } = await ctx.params;
  const order = await resolveOrder(decodeURIComponent(orderId));
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }
  return NextResponse.json(toOrderHubPublic(order), {
    headers: { "Cache-Control": "no-store" },
  });
}

/**
 * Ações na página do pedido: mensagem, devolução, garantia.
 * Exige e-mail do pedido para autenticar.
 */
export async function POST(request: Request, ctx: Ctx) {
  const { orderId: rawId } = await ctx.params;
  const order = await resolveOrder(decodeURIComponent(rawId));
  if (!order) {
    return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
  }

  try {
    const body = (await request.json()) as {
      action?: string;
      email?: string;
      text?: string;
    };

    const email = (body.email || "").trim().toLowerCase();
    if (!email || email !== order.email.trim().toLowerCase()) {
      return NextResponse.json(
        { error: "Confirme o e-mail usado na compra." },
        { status: 403 },
      );
    }

    if (body.action === "message") {
      const text = (body.text || "").trim().slice(0, 1200);
      if (text.length < 2) {
        return NextResponse.json({ error: "Escreva uma mensagem." }, { status: 400 });
      }
      const msg: OrderMessage = {
        id: `msg_${Date.now().toString(36)}`,
        at: new Date().toISOString(),
        from: "customer",
        text,
      };
      const messages = [...(order.messages || []), msg].slice(-80);
      await updateOrder(order.orderId, { messages });

      void sendEmail({
        to: siteConfig.email,
        subject: `Conversa no pedido ${order.orderId}`,
        html: `<p>Cliente <strong>${order.nome}</strong> (${order.email}) no pedido <strong>${order.orderId}</strong>:</p><p>${text}</p>`,
        replyTo: order.email,
      });

      return NextResponse.json({ ok: true, hub: toOrderHubPublic({ ...order, messages }) });
    }

    if (body.action === "return" || body.action === "warranty") {
      const field =
        body.action === "return" ? "returnStatus" : "warrantyStatus";
      const current = (order[field] || "none") as ServiceRequestStatus;
      if (current !== "none" && current !== "denied") {
        return NextResponse.json({
          ok: true,
          already: true,
          hub: toOrderHubPublic(order),
        });
      }
      const patch = {
        [field]: "requested" as ServiceRequestStatus,
      };
      const note =
        body.action === "return"
          ? "Solicitação de devolução/troca aberta pelo cliente."
          : "Solicitação de garantia aberta pelo cliente.";
      const msg: OrderMessage = {
        id: `msg_${Date.now().toString(36)}`,
        at: new Date().toISOString(),
        from: "customer",
        text: note + (body.text ? ` ${body.text.trim().slice(0, 500)}` : ""),
      };
      const messages = [...(order.messages || []), msg].slice(-80);
      const updated = await updateOrder(order.orderId, {
        ...patch,
        messages,
      });

      void sendEmail({
        to: siteConfig.email,
        subject: `${body.action === "return" ? "Devolução" : "Garantia"} — ${order.orderId}`,
        html: `<p>${note}</p><p>Pedido ${order.orderId} · ${order.nome} · ${order.email}</p>`,
        replyTo: order.email,
      });

      return NextResponse.json({
        ok: true,
        hub: toOrderHubPublic(updated || { ...order, ...patch, messages }),
      });
    }

    return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha" },
      { status: 500 },
    );
  }
}
