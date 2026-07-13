/**
 * Pipeline único do Capitão (qualquer fornecedor → mesma experiência).
 * Fonte: API do CJ (incluída na conta) — sem 17TRACK/AfterShip (custo zero).
 */
export type PipelineStage =
  | "payment_approved"
  | "sent_to_supplier"
  | "picking"
  | "in_transit"
  | "arrived_brazil"
  | "customs"
  | "out_for_delivery"
  | "delivered";

export type TrackingEvent = {
  at: string;
  label: string;
  detail?: string;
  /** Estágio padronizado (quando conhecido) */
  stage?: PipelineStage;
  location?: string;
};

export type OrderTrackStatus =
  | "pending_payment"
  | "paid"
  | "fulfilling"
  | "shipped"
  | "fulfilled"
  | "cancelled"
  | "failed";

export const PIPELINE_STAGES: {
  key: PipelineStage;
  label: string;
  emoji: string;
}[] = [
  { key: "payment_approved", label: "Pagamento aprovado", emoji: "🟢" },
  { key: "sent_to_supplier", label: "Pedido enviado ao fornecedor", emoji: "🟢" },
  { key: "picking", label: "Produto separado", emoji: "🟢" },
  { key: "in_transit", label: "Em transporte", emoji: "🟢" },
  { key: "arrived_brazil", label: "Chegou ao Brasil", emoji: "🟢" },
  { key: "customs", label: "Em fiscalização", emoji: "🟢" },
  { key: "out_for_delivery", label: "Saiu para entrega", emoji: "🟢" },
  { key: "delivered", label: "Entregue", emoji: "🟢" },
];

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

export function pipelineLabel(stage: PipelineStage) {
  return PIPELINE_STAGES.find((s) => s.key === stage)?.label || stage;
}

export function pipelineIndex(stage: PipelineStage | null | undefined): number {
  if (!stage) return -1;
  return PIPELINE_STAGES.findIndex((s) => s.key === stage);
}

/** Converte status bruto (CJ / texto livre) → estágio do Capitão. */
export function mapRawToPipeline(
  raw: string | undefined,
  opts?: { orderStatus?: string; hasCode?: boolean },
): PipelineStage | null {
  const s = (raw || "").toLowerCase();
  const order = (opts?.orderStatus || "").toLowerCase();

  if (
    /deliver|entregue|delivered|signed|completed|complete|pod/.test(s) ||
    order === "fulfilled"
  ) {
    return "delivered";
  }
  if (
    /out for delivery|saiu para entrega|out_for_delivery|em rota de entrega|last mile|courier/.test(
      s,
    )
  ) {
    return "out_for_delivery";
  }
  if (
    /customs|receita|fiscaliza|clearance|alf[aâ]ndega|import|held by customs|anvisa/.test(
      s,
    )
  ) {
    return "customs";
  }
  if (
    /brazil|brasil|arrived.*br|chegou ao brasil|s[aã]o paulo|curitiba|campinas|guarulhos|viracopos|infraero/.test(
      s,
    )
  ) {
    return "arrived_brazil";
  }
  if (
    /airport|aeroporto|flight|voo|departed|left.*origin|international|in transit|em tr[aâ]nsito|shipped|enviado|posted|dispatch|logistics/.test(
      s,
    ) ||
    (opts?.hasCode && order === "shipped")
  ) {
    return "in_transit";
  }
  if (
    /pick|separad|warehouse|estoque|packing|embal|prepar|fulfill|process/.test(s) ||
    order === "fulfilling"
  ) {
    return "picking";
  }
  if (/supplier|fornecedor|purchased|ordered|cj/.test(s)) {
    return "sent_to_supplier";
  }
  if (/paid|aprovad|payment|pago/.test(s) || order === "paid") {
    return "payment_approved";
  }
  if (opts?.hasCode) return "in_transit";
  return null;
}

/** Ordem da loja a partir do estágio. */
export function pipelineToOrderStatus(stage: PipelineStage): OrderTrackStatus {
  switch (stage) {
    case "delivered":
      return "fulfilled";
    case "out_for_delivery":
    case "customs":
    case "arrived_brazil":
    case "in_transit":
      return "shipped";
    case "picking":
    case "sent_to_supplier":
      return "fulfilling";
    case "payment_approved":
      return "paid";
  }
}

/** Estágio atual a partir do status da loja + último evento. */
export function inferPipelineFromOrder(input: {
  status: string;
  trackingCode?: string | null;
  events?: TrackingEvent[];
}): PipelineStage | null {
  const fromEvents = [...(input.events || [])]
    .reverse()
    .find((e) => e.stage)?.stage;
  if (fromEvents) return fromEvents;

  if (input.status === "fulfilled") return "delivered";
  if (input.status === "shipped") {
    return input.trackingCode ? "in_transit" : "picking";
  }
  if (input.status === "fulfilling") return "picking";
  if (input.status === "paid") return "payment_approved";
  return null;
}

export function externalTrackingUrl(code?: string | null, carrier?: string | null) {
  if (!code) return null;
  const c = code.trim();
  if (!c) return null;
  if (/^[A-Z]{2}\d{9}BR$/i.test(c)) {
    return `https://www.linkcorreios.com.br/?id=${encodeURIComponent(c)}`;
  }
  const q = encodeURIComponent(c);
  if (carrier && /correios/i.test(carrier)) {
    return `https://www.linkcorreios.com.br/?id=${q}`;
  }
  // Link público gratuito (não é API — só página para o cliente)
  return `https://t.17track.net/pt#nums=${q}`;
}

/** @deprecated use PIPELINE_STAGES — mantido para telas antigas */
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
  if (
    last &&
    last.label === event.label &&
    last.detail === event.detail &&
    last.stage === event.stage
  ) {
    return prev;
  }
  return [...prev, event].slice(-60);
}

export function mapCjStatusToOrder(
  rawStatus: string | undefined,
  hasTrackingCode: boolean,
): OrderTrackStatus | null {
  const stage = mapRawToPipeline(rawStatus, { hasCode: hasTrackingCode });
  if (!stage) {
    if (hasTrackingCode) return "shipped";
    return null;
  }
  return pipelineToOrderStatus(stage);
}

export type TrackingPublic = {
  orderNumber: string;
  status: OrderTrackStatus;
  trackingCode: string | null;
  trackingCarrier: string | null;
  events: TrackingEvent[];
  updatedAt: string;
  delivered: boolean;
  missionToken: string | null;
  missionResponse: "ok" | "help" | null;
  pipelineStage: PipelineStage | null;
};
