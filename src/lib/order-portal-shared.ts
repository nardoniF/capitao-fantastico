/**
 * Tipos e helpers do portal do pedido — seguros para Client Components.
 * (Sem store-db / fs.)
 */
import type { Order } from "@/lib/store-types";
import type {
  OrderTrackStatus,
  PipelineStage,
  TrackingEvent,
} from "@/lib/order-tracking";

export function orderPortalPath(orderId: string) {
  return `/pedido/${encodeURIComponent(orderId)}`;
}

export function orderPortalUrl(orderId: string, origin?: string) {
  const base = (
    origin ||
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://www.capitaofantastico.com.br"
  ).replace(/\/$/, "");
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
  pipelineStage: PipelineStage | null;
  returnTicket: Order["returnTicket"] | null;
  missionToken: string | null;
  missionResponse: "ok" | "help" | null;
};

export const SERVICE_STATUS_LABEL: Record<ServiceRequestStatus, string> = {
  none: "Disponível",
  requested: "Solicitado",
  in_progress: "Em andamento",
  done: "Concluído",
  denied: "Não aplicável",
};
