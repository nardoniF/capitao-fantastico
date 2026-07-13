import { NextResponse } from "next/server";
import {
  resolveOrder,
  toOrderHubPublic,
  type OrderMessage,
  type ServiceRequestStatus,
} from "@/lib/order-portal";
import { updateOrder } from "@/lib/store-db";
import { appendTrackingEvent } from "@/lib/order-tracking";
import { siteConfig } from "@/lib/site-config";
import { sendEmail } from "@/lib/email";
import type { Order } from "@/lib/store-types";

export const dynamic = "force-dynamic";

type Ctx = { params: Promise<{ orderId: string }> };

type ServiceAction =
  | "return"
  | "warranty"
  | "exchange"
  | "cancel"
  | "address_change";

const SERVICE_META: Record<
  ServiceAction,
  {
    field: keyof Order;
    note: string;
    subject: string;
    extra?: (text: string) => Partial<Order>;
  }
> = {
  return: {
    field: "returnStatus",
    note: "Solicitação de devolução aberta pelo cliente.",
    subject: "Devolução",
  },
  warranty: {
    field: "warrantyStatus",
    note: "Solicitação de garantia aberta pelo cliente.",
    subject: "Garantia",
  },
  exchange: {
    field: "exchangeStatus",
    note: "Solicitação de troca aberta pelo cliente.",
    subject: "Troca",
  },
  cancel: {
    field: "cancelStatus",
    note: "Solicitação de cancelamento aberta pelo cliente.",
    subject: "Cancelamento",
  },
  address_change: {
    field: "addressChangeStatus",
    note: "Solicitação de alteração de endereço aberta pelo cliente.",
    subject: "Alterar endereço",
    extra: (text) => ({ addressChangeNote: text.slice(0, 800) }),
  },
};

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
 * Ações na página do pedido / Central do Capitão.
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

      return NextResponse.json({
        ok: true,
        hub: toOrderHubPublic({ ...order, messages }),
      });
    }

    const action = body.action as ServiceAction | undefined;
    if (action && action in SERVICE_META) {
      const meta = SERVICE_META[action];
      const current = ((order[meta.field] as ServiceRequestStatus) ||
        "none") as ServiceRequestStatus;

      if (action === "cancel") {
        if (order.status === "cancelled") {
          return NextResponse.json({
            ok: true,
            already: true,
            hub: toOrderHubPublic(order),
          });
        }
        if (order.status === "shipped" || order.status === "fulfilled") {
          return NextResponse.json(
            {
              error:
                "Pedido já enviado ou entregue. Use devolução/troca ou fale com o Capitão.",
            },
            { status: 400 },
          );
        }
      }

      if (action === "address_change") {
        if (order.status === "shipped" || order.status === "fulfilled") {
          return NextResponse.json(
            {
              error:
                "Pedido já saiu para entrega. Não dá para alterar o endereço por aqui — fale com o Capitão.",
            },
            { status: 400 },
          );
        }
        const detail = (body.text || "").trim();
        if (detail.length < 8) {
          return NextResponse.json(
            { error: "Informe o novo endereço completo." },
            { status: 400 },
          );
        }
      }

      if (current !== "none" && current !== "denied") {
        return NextResponse.json({
          ok: true,
          already: true,
          hub: toOrderHubPublic(order),
        });
      }

      const detail = (body.text || "").trim().slice(0, 800);
      const note = meta.note + (detail ? ` ${detail}` : "");
      const msg: OrderMessage = {
        id: `msg_${Date.now().toString(36)}`,
        at: new Date().toISOString(),
        from: "customer",
        text: note,
      };
      const messages = [...(order.messages || []), msg].slice(-80);

      const patch: Partial<Order> = {
        [meta.field]: "requested" as ServiceRequestStatus,
        messages,
        ...(meta.extra && detail ? meta.extra(detail) : {}),
      };

      if (action === "cancel" && ["pending_payment", "paid", "fulfilling"].includes(order.status)) {
        patch.status = "cancelled";
        patch.trackingEvents = appendTrackingEvent(order.trackingEvents, {
          at: new Date().toISOString(),
          label: "Cancelado",
          detail: "Cancelamento solicitado pelo cliente",
        });
        patch.cancelStatus = "done";
      }

      const updated = await updateOrder(order.orderId, patch);

      void sendEmail({
        to: siteConfig.email,
        subject: `${meta.subject} — ${order.orderId}`,
        html: `<p>${note}</p><p>Pedido ${order.orderId} · ${order.nome} · ${order.email}</p>`,
        replyTo: order.email,
      });

      return NextResponse.json({
        ok: true,
        hub: toOrderHubPublic(updated || { ...order, ...patch }),
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
