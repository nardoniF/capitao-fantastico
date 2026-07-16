import type { ClickEventInput } from "@/lib/store-types";
import { clientIp, geoFromRequest, ipPrefix } from "@/lib/click-geo";

function field(data: Record<string, unknown>, key: string, max: number, fb = "") {
  const v = data[key];
  if (v == null) return fb;
  return String(v).trim().slice(0, max);
}

/** Monta evento enriquecido no servidor (estilo STF buildClickEntry). */
export function buildClickEntry(
  data: Record<string, unknown>,
  request: Request,
): ClickEventInput {
  const ip = clientIp(request);
  const geo = geoFromRequest(request);
  const clientTsRaw = Number(data.client_ts);
  const clientTs =
    Number.isFinite(clientTsRaw) && clientTsRaw > 0
      ? new Date(clientTsRaw)
      : undefined;

  return {
    tipo: field(data, "tipo", 24, "clique"),
    destino: field(data, "destino", 48) || undefined,
    destinoLabel: field(data, "destino_label", 80) || undefined,
    rotulo: field(data, "rotulo", 120) || undefined,
    pagina: field(data, "pagina", 200) || undefined,
    tituloPagina: field(data, "titulo_pagina", 120) || undefined,
    href: field(data, "href", 500) || undefined,
    secao: field(data, "secao", 60) || undefined,
    secaoLabel: field(data, "secao_label", 80) || undefined,
    elemento: field(data, "elemento", 24) || undefined,
    visitanteId: field(data, "visitante_id", 64) || undefined,
    sessaoVisita: field(data, "sessao_visita", 64) || undefined,
    sequencia: Math.max(
      0,
      Math.min(9999, parseInt(String(data.sequencia ?? ""), 10) || 0),
    ) || undefined,
    pais: field(data, "pais", 12, geo.pais) || geo.pais || undefined,
    estado: field(data, "estado", 80, geo.estado) || geo.estado || undefined,
    cidade: field(data, "cidade", 80, geo.cidade) || geo.cidade || undefined,
    ipPrefix: ipPrefix(ip) || undefined,
    referrer: field(data, "referrer", 200) || undefined,
    dispositivo: field(data, "dispositivo", 80) || undefined,
    fuso: field(data, "fuso", 60) || undefined,
    idioma: field(data, "idioma", 24) || undefined,
    utmSource: field(data, "utm_source", 48) || undefined,
    utmMedium: field(data, "utm_medium", 32) || undefined,
    utmCampaign: field(data, "utm_campaign", 64) || undefined,
    origemTrafego: field(data, "origem_trafego", 32) || undefined,
    origemTrafegoLabel:
      field(data, "origem_trafego_label", 80) || undefined,
    clientEventId: field(data, "client_event_id", 64) || undefined,
    clientTs,
  };
}

const ADMIN_PATH = /^\/admin(\/|$)/;

/** Ignora tráfego de teste / painel admin. */
export function isRealClick(input: ClickEventInput, pagina?: string) {
  const pag = String(pagina || input.pagina || "").toLowerCase();
  if (ADMIN_PATH.test(pag)) return false;
  const vid = String(input.visitanteId || "");
  if (/^v_(test|admin|fix)/i.test(vid)) return false;
  return true;
}
