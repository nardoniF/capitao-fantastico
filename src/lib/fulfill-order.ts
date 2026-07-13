/**
 * Envio automático ao fornecedor (CJ) após pagamento.
 * Capitão = intermediário; o sistema despacha sozinho.
 */
import {
  emailFulfilling,
  emailPaymentConfirmed,
} from "@/lib/email";
import {
  appendTrackingEvent,
  statusLabel,
} from "@/lib/order-tracking";
import { findOrderById, updateOrder } from "@/lib/store-db";
import type { Order } from "@/lib/store-types";
import { getCJSupplier } from "@/lib/suppliers/cj";

export type FulfillResult = {
  orderId: string;
  ok: boolean;
  supplierOrderId?: string;
  error?: string;
  skipped?: boolean;
};

export async function fulfillPaidOrder(orderId: string): Promise<FulfillResult> {
  const order = await findOrderById(orderId);
  if (!order) return { orderId, ok: false, error: "pedido não encontrado" };

  if (order.supplierOrderId) {
    return {
      orderId,
      ok: true,
      skipped: true,
      supplierOrderId: order.supplierOrderId,
    };
  }

  if (order.status !== "paid" && order.status !== "fulfilling") {
    return { orderId, ok: false, skipped: true, error: `status ${order.status}` };
  }

  const addr = order.endereco;
  if (!addr) {
    return { orderId, ok: false, error: "pedido sem endereço" };
  }

  const lines = order.items
    .map((it) => ({
      variantId: it.supplierVariantId || "",
      sku: it.supplierSku,
      quantity: it.qty,
    }))
    .filter((l) => l.variantId);

  if (!lines.length) {
    return {
      orderId,
      ok: false,
      error: "itens sem supplierVariantId — não dá para enviar à CJ",
    };
  }

  try {
    const cj = getCJSupplier();
    const result = await cj.createOrder({
      orderNumber: order.orderId,
      shipTo: {
        name: order.nome,
        email: order.email,
        phone: order.telefone,
        cep: addr.cep,
        street: addr.rua,
        number: addr.numero,
        complement: addr.complemento,
        neighborhood: addr.bairro,
        city: addr.cidade,
        state: addr.uf,
        countryCode: "BR",
      },
      lines,
    });

    const events = appendTrackingEvent(order.trackingEvents, {
      at: new Date().toISOString(),
      label: statusLabel("fulfilling"),
      detail: `Pedido enviado ao fornecedor (${result.supplierOrderId})`,
    });

    await updateOrder(order.orderId, {
      status: "fulfilling",
      supplierOrderId: result.supplierOrderId,
      trackingEvents: events,
      notes: [order.notes, `CJ ${result.supplierOrderId}`]
        .filter(Boolean)
        .join(" · "),
    });

    await emailFulfilling({
      orderId: order.orderId,
      email: order.email,
      nome: order.nome,
    });

    return {
      orderId,
      ok: true,
      supplierOrderId: result.supplierOrderId,
    };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "erro CJ";
    await updateOrder(order.orderId, {
      notes: [order.notes, `Fulfill falhou: ${msg}`].filter(Boolean).join(" · "),
    });
    return { orderId, ok: false, error: msg };
  }
}

/** Após marcar pago: e-mail + tenta fulfill. */
export async function afterPaymentApproved(order: Order) {
  await emailPaymentConfirmed({
    orderId: order.orderId,
    email: order.email,
    nome: order.nome,
  });
  return fulfillPaidOrder(order.orderId);
}
