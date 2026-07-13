/**
 * Status / timeline de rastreio (sensor ao vivo no site).
 * Fonte dos pedidos: store-db (Redis/JSON), alinhado ao checkout.
 */
export type TrackingEvent = {
  at: string; // ISO
  label: string;
  detail?: string;
};

export type OrderTrackStatus =
  | "pending_payment"
  | "paid"
  | "fulfilling"
  | "shipped"
  | "fulfilled"
  | "cancelled"
  | "failed";

export type TrackingPublic = {
  orderNumber: string;
  status: OrderTrackStatus;
  trackingCode: string | null;
  trackingCarrier: string | null;
  events: TrackingEvent[];
  updatedAt: string;
  delivered: boolean;
};

const STATUS_LABEL: Record<OrderTrackStatus, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pagamento confirmado",
  fulfilling: "Preparando envio",
  shipped: "Enviado",
  fulfilled: "Entregue",
  cancelled: "Cancelado",
  failed: "Falhou",
};

export function statusLabel(status: string) {
  return STATUS_LABEL[status as OrderTrackStatus] || status;
}

/** Link público Correios / 17track quando o código parece BR. */
export function externalTrackingUrl(code?: string | null, carrier?: string | null) {
  if (!code) return null;
  const c = code.trim();
  if (!c) return null;
  // Padrão Correios BR: AA123456789BR
  if (/^[A-Z]{2}\d{9}BR$/i.test(c)) {
    return `https://www.linkcorreios.com.br/?id=${encodeURIComponent(c)}`;
  }
  const q = encodeURIComponent(c);
  if (carrier && /correios/i.test(carrier)) {
    return `https://www.linkcorreios.com.br/?id=${q}`;
  }
  return `https://t.17track.net/en#nums=${q}`;
}

/** Passos do “sensor” de status na UI. */
export const TRACKING_STEPS: {
  key: OrderTrackStatus | "transit";
  label: string;
}[] = [
  { key: "pending_payment", label: "Pagamento" },
  { key: "paid", label: "Confirmado" },
  { key: "fulfilling", label: "Preparação" },
  { key: "shipped", label: "Enviado" },
  { key: "transit", label: "Em trânsito" },
  { key: "fulfilled", label: "Entregue" },
];

export function stepIndex(status: string, hasCode: boolean): number {
  switch (status) {
    case "pending_payment":
      return 0;
    case "paid":
      return 1;
    case "fulfilling":
      return 2;
    case "shipped":
      return hasCode ? 4 : 3;
    case "fulfilled":
      return 5;
    default:
      return 0;
  }
}

export function appendTrackingEvent(
  current: TrackingEvent[] | undefined,
  event: TrackingEvent,
): TrackingEvent[] {
  const prev = Array.isArray(current) ? current : [];
  const last = prev[prev.length - 1];
  if (last && last.label === event.label && last.detail === event.detail) {
    return prev;
  }
  return [...prev, event].slice(-40);
}

/** Mapeia status bruto da CJ para status da loja. */
export function mapCjStatusToOrder(
  rawStatus: string | undefined,
  hasTrackingCode: boolean,
): OrderTrackStatus | null {
  const s = (rawStatus || "").toLowerCase();
  if (/deliver|entregue|completed|complete|signed/.test(s)) return "fulfilled";
  if (/ship|transit|dispatch|enviado|posted|logistics/.test(s)) return "shipped";
  if (/fulfill|process|prepar|warehouse|picking/.test(s)) return "fulfilling";
  if (hasTrackingCode) return "shipped";
  return null;
}
