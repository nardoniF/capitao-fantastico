"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Rastreamento estruturado (estilo Sensor Tattoo Fix):
 * visitante, sessão, geo, destino categorizado, UTM.
 */
const DEDUP_MS = 1200;
const QUEUE_KEY = "cf_click_queue";
const QUEUE_MAX = 40;
const VISITOR_KEY = "cf_visitante_id";
const SESSION_KEY = "cf_sessao_visita";
const SEQ_KEY = "cf_click_seq";
const UTM_KEY = "cf_utm_capture";

type LogBody = Record<string, string | number | undefined>;

function normalizar(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);
}

function uuid() {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `v_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

function visitanteId() {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = `v_${uuid()}`;
      localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return `v_${Date.now()}`;
  }
}

function sessaoVisita() {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) {
      id = `s_${uuid()}`;
      sessionStorage.setItem(SESSION_KEY, id);
    }
    return id;
  } catch {
    return `s_${Date.now()}`;
  }
}

function nextSequencia() {
  try {
    const n = parseInt(sessionStorage.getItem(SEQ_KEY) || "0", 10) + 1;
    sessionStorage.setItem(SEQ_KEY, String(n));
    return n;
  } catch {
    return 1;
  }
}

function captureUtm() {
  try {
    if (sessionStorage.getItem(UTM_KEY)) return;
    const sp = new URLSearchParams(window.location.search);
    const utm = {
      utm_source: sp.get("utm_source") || "",
      utm_medium: sp.get("utm_medium") || "",
      utm_campaign: sp.get("utm_campaign") || "",
    };
    if (utm.utm_source || utm.utm_medium || utm.utm_campaign) {
      sessionStorage.setItem(UTM_KEY, JSON.stringify(utm));
    }
  } catch {
    /* ignore */
  }
}

function utmFields(): Record<string, string> {
  try {
    const raw = sessionStorage.getItem(UTM_KEY);
    if (!raw) return {};
    const u = JSON.parse(raw) as Record<string, string>;
    return {
      utm_source: u.utm_source || "",
      utm_medium: u.utm_medium || "",
      utm_campaign: u.utm_campaign || "",
    };
  } catch {
    return {};
  }
}

function classificarOrigem(referrer: string) {
  const r = referrer.toLowerCase();
  if (!r) return { origem_trafego: "direto", origem_trafego_label: "Acesso direto" };
  if (r.includes("instagram")) return { origem_trafego: "instagram", origem_trafego_label: "Instagram" };
  if (r.includes("facebook") || r.includes("fb.")) return { origem_trafego: "facebook", origem_trafego_label: "Facebook" };
  if (r.includes("google.")) return { origem_trafego: "google", origem_trafego_label: "Google" };
  if (r.includes("tiktok")) return { origem_trafego: "tiktok", origem_trafego_label: "TikTok" };
  try {
    return { origem_trafego: "referral", origem_trafego_label: new URL(referrer).hostname.replace(/^www\./, "") };
  } catch {
    return { origem_trafego: "referral", origem_trafego_label: "Referência" };
  }
}

function hrefAbsoluto(href: string | null) {
  if (!href) return "";
  try {
    return new URL(href, location.href).href;
  } catch {
    return href;
  }
}

function detectarSecao(el: Element): string {
  const wrap = el.closest("[data-secao]");
  if (wrap) return wrap.getAttribute("data-secao") || "pagina";
  const section = el.closest("section[id]");
  if (section?.id) return section.id;
  if (el.closest("header")) return "header";
  if (el.closest("footer")) return "footer";
  if (el.closest("[aria-label='WhatsApp'], a[href*='wa.me']")) return "whatsapp_flutuante";
  if (el.closest("main")) return "main";
  return "pagina";
}

function classificarDestino(href: string | null, el: Element): { destino: string; label: string } {
  const evento = el.getAttribute("data-evento");
  if (evento) {
    const d = evento.replace(/^clique_/, "");
    return { destino: d, label: d.replace(/_/g, " ") };
  }
  if (!href || href === "#") return { destino: "ancora", label: "Âncora" };
  const h = href.toLowerCase();
  if (h.includes("wa.me") || h.includes("whatsapp")) return { destino: "whatsapp", label: "WhatsApp" };
  if (h.includes("/carrinho")) return { destino: "carrinho", label: "Carrinho" };
  if (h.includes("/checkout")) return { destino: "checkout", label: "Checkout" };
  if (h.includes("/produtos")) return { destino: "produtos", label: "Produtos" };
  if (h.includes("/contato")) return { destino: "contato", label: "Contato" };
  if (h.includes("/pedido")) return { destino: "pedido", label: "Pedido" };
  if (h.startsWith("mailto:")) return { destino: "email", label: "E-mail" };
  try {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return { destino: "externo", label: "Link externo" };
    const path = url.pathname.replace(/^\//, "").replace(/\//g, "_") || "home";
    return { destino: path, label: path.replace(/_/g, " ") };
  } catch {
    return { destino: "link", label: "Link" };
  }
}

function basePayload(extra: LogBody = {}): LogBody {
  const ref = document.referrer || "";
  const origem = classificarOrigem(ref);
  return {
    visitante_id: visitanteId(),
    sessao_visita: sessaoVisita(),
    sequencia: nextSequencia(),
    client_ts: Date.now(),
    client_event_id: uuid(),
    pagina: location.pathname,
    titulo_pagina: document.title?.slice(0, 120),
    referrer: ref.slice(0, 200),
    dispositivo: navigator.userAgent?.slice(0, 80),
    fuso: Intl.DateTimeFormat().resolvedOptions().timeZone,
    idioma: navigator.language?.slice(0, 24),
    ...utmFields(),
    ...origem,
    ...extra,
  };
}

async function postClick(body: LogBody, keepalive = false) {
  try {
    const res = await fetch("/api/analytics/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
      keepalive,
    });
    return res.ok;
  } catch {
    return false;
  }
}

function lerFila(): LogBody[] {
  try {
    const raw = sessionStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as LogBody[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function salvarFila(q: LogBody[]) {
  try {
    sessionStorage.setItem(QUEUE_KEY, JSON.stringify(q.slice(-QUEUE_MAX)));
  } catch {
    /* ignore */
  }
}

function enfileirar(body: LogBody) {
  const q = lerFila();
  q.push(body);
  salvarFila(q);
}

async function flushFila() {
  const q = lerFila();
  if (!q.length) return;
  salvarFila([]);
  for (const body of q) {
    const ok = await postClick(body, true);
    if (!ok) enfileirar(body);
  }
}

function montarBody(el: Element, extra: Partial<LogBody> = {}): LogBody {
  const href = extra.href as string | undefined;
  const { destino, label } = classificarDestino(href || null, el);
  const tipo = String(extra.tipo || destino).slice(0, 64);
  return basePayload({
    tipo,
    destino,
    destino_label: label,
    rotulo: normalizar(String(extra.rotulo || el.textContent || label)).slice(0, 120),
    href: href?.slice(0, 500),
    secao: String(extra.secao || detectarSecao(el)).slice(0, 60),
    elemento: el.tagName?.toLowerCase().slice(0, 24),
    ...extra,
  });
}

export function SiteClickAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

    captureUtm();
    let ultimo = { href: "", ts: 0 };

    function registrar(body: LogBody, urgente = false) {
      void (async () => {
        const ok = await postClick(body, urgente);
        if (!ok) enfileirar(body);
      })();
    }

    function trackLink(link: HTMLAnchorElement) {
      const href = link.getAttribute("href");
      const abs = hrefAbsoluto(href);
      const now = Date.now();
      if (ultimo.href === abs && now - ultimo.ts < DEDUP_MS) return;
      ultimo = { href: abs, ts: now };

      registrar(
        montarBody(link, {
          tipo: link.getAttribute("data-evento")?.replace(/^clique_/, "") || undefined,
          href: abs,
          rotulo:
            link.getAttribute("data-rotulo") ||
            normalizar(link.getAttribute("aria-label") || link.textContent || ""),
        }),
        true,
      );
    }

    function trackButton(btn: HTMLButtonElement) {
      if (btn.closest("[data-no-track]")) return;
      registrar(
        montarBody(btn, {
          tipo: btn.getAttribute("data-evento")?.replace(/^clique_/, "") || "botao",
          rotulo: btn.getAttribute("data-rotulo") || normalizar(btn.textContent || ""),
        }),
      );
    }

    function onPointerDown(e: PointerEvent) {
      if (e.button !== 0) return;
      const link = (e.target as Element | null)?.closest?.("a[href]");
      if (link instanceof HTMLAnchorElement) trackLink(link);
    }

    function onClick(e: MouseEvent) {
      if (e.button !== 0 || e.defaultPrevented) return;
      const t = e.target as Element | null;
      if (!t?.closest) return;
      if (t.closest("a[href]")) return;
      const btn = t.closest("button");
      if (btn instanceof HTMLButtonElement) trackButton(btn);
    }

    try {
      const key = `cf_pv:${pathname}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        registrar(
          basePayload({
            tipo: "pageview",
            destino: "entrada",
            destino_label: "Entrada",
            rotulo: `Entrada — ${pathname || "/"}`,
            secao: "entrada",
            href: location.href,
          }),
        );
      }
    } catch {
      /* ignore */
    }

    void flushFila();
    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("pagehide", () => void flushFila());
    const interval = window.setInterval(() => void flushFila(), 8000);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
      window.clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
