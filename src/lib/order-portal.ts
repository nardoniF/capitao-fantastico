import type { Order, OrderItem, ShippingAddress } from "@/lib/store-types";
import { findOrderById, listOrders } from "@/lib/store-db";
import {
  externalTrackingUrl,
  inferPipelineFromOrder,
  statusLabel,
  type OrderTrackStatus,
  type TrackingEvent,
} from "@/lib/order-tracking";

export function orderPortalPath(orderId: string) {
  return `/pedido/${encodeURIComponent(orderId)}`;
}

export function orderPortalUrl(orderId: string, origin?: string) {
  const base =
    (origin || process.env.NEXT_PUBLIC_SITE_URL || "https://www.capitaofantastico.com.br").replace(
      /\/$/,
      "",
    );
  return `${base}${orderPortalPath(orderId)}`;
}

export type OrderMessage = {
  id: string;
  at: string;
  from: "customer" | "captain";
  text: string;
};

export type OrderDocument = {
  id: string;
  title: string;
  url: string;
  kind: "invoice" | "receipt" | "warranty" | "other";
  at: string;
};

export type ServiceRequestStatus =
  | "none"
  | "requested"
  | "in_progress"
  | "done"
  | "denied";

export type OrderHubPublic = {
  orderId: string;
  createdAt: string;
  updatedAt: string;
  status: OrderTrackStatus;
  statusLabel: string;
  delivered: boolean;
  nome: string;
  emailMasked: string;
  items: { name: string; qty: number; price: number; size?: string }[];
  subtotal: number;
  total: number;
  trackingCode: string | null;
  trackingCarrier: string | null;
  trackingExternalUrl: string | null;
  events: TrackingEvent[];
  addressSummary: string | null;
  invoiceNumber: string | null;
  invoiceUrl: string | null;
  invoiceReady: boolean;
  documents: OrderDocument[];
  messages: OrderMessage[];
  returnStatus: ServiceRequestStatus;
  warrantyStatus: ServiceRequestStatus;
  exchangeStatus: ServiceRequestStatus;
  cancelStatus: ServiceRequestStatus;
  addressChangeStatus: ServiceRequestStatus;
  pipelineStage: import("@/lib/order-tracking").PipelineStage | null;
  returnTicket: Order["returnTicket"] | null;
  missionToken: string | null;
  missionResponse: "ok" | "help" | null;
};

function maskEmail(email: string) {
  const [user, domain] = email.split("@");
  if (!user || !domain) return "***";
  const visible = user.slice(0, Math.min(2, user.length));
  return `${visible}***@${domain}`;
}

function addressSummary(addr?: ShippingAddress) {
  if (!addr) return null;
  return `${addr.cidade}/${addr.uf} · CEP ${addr.cep}`;
}

export async function resolveOrder(pedido: string): Promise<Order | null> {
  const key = pedido.trim();
  if (!key) return null;
  let order = await findOrderById(key);
  if (order) return order;
  const all = await listOrders();
  return (
    all.find(
      (o) =>
        o.orderId.toLowerCase() === key.toLowerCase() ||
        o.paymentRef === key,
    ) ?? null
  );
}

export function toOrderHubPublic(order: Order): OrderHubPublic {
  const events: TrackingEvent[] = Array.isArray(order.trackingEvents)
    ? order.trackingEvents
    : [
        {
          at: order.createdAt,
          label: statusLabel("pending_payment"),
          detail: "Pedido criado na loja",
        },
      ];

  const docs: OrderDocument[] = [...(order.documents || [])];
  if (order.invoiceUrl) {
    const already = docs.some((d) => d.url === order.invoiceUrl);
    if (!already) {
      docs.unshift({
        id: "invoice",
        title: order.invoiceNumber
          ? `Nota fiscal ${order.invoiceNumber}`
          : "Nota fiscal",
        url: order.invoiceUrl,
        kind: "invoice",
        at: order.updatedAt || order.createdAt,
      });
    }
  }

  return {
    orderId: order.orderId,
    createdAt: order.createdAt,
    updatedAt: order.updatedAt || order.createdAt,
    status: order.status as OrderTrackStatus,
    statusLabel: statusLabel(order.status),
    delivered: order.status === "fulfilled",
    nome: order.nome.split(" ")[0] || order.nome,
    emailMasked: maskEmail(order.email),
    items: order.items.map((it: OrderItem) => ({
      name: it.name,
      qty: it.qty,
      price: it.price,
      size: it.size,
    })),
    subtotal: order.subtotal,
    total: order.total,
    trackingCode: order.supplierTracking || null,
    trackingCarrier: order.trackingCarrier || null,
    trackingExternalUrl: externalTrackingUrl(
      order.supplierTracking,
      order.trackingCarrier,
    ),
    events,
    addressSummary: addressSummary(order.endereco),
    invoiceNumber: order.invoiceNumber || null,
    invoiceUrl: order.invoiceUrl || null,
    invoiceReady: Boolean(order.invoiceUrl),
    documents: docs,
    messages: order.messages || [],
    returnStatus: order.returnStatus || "none",
    warrantyStatus: order.warrantyStatus || "none",
    exchangeStatus: order.exchangeStatus || "none",
    cancelStatus: order.cancelStatus || "none",
    addressChangeStatus: order.addressChangeStatus || "none",
    pipelineStage:
      order.pipelineStage ||
      inferPipelineFromOrder({
        status: order.status,
        trackingCode: order.supplierTracking,
        events: order.trackingEvents,
      }),
    returnTicket: order.returnTicket || null,
    missionToken:
      order.status === "fulfilled" &&
      !order.missionResponse &&
      order.missionToken
        ? order.missionToken
        : null,
    missionResponse: order.missionResponse ?? null,
  };
}

export const SERVICE_STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  none: "Disponível",
  requested: "Solicitado",
  in_progress: "Em andamento",
  done: "Concluído",
  denied: "Não aplicável",
};
