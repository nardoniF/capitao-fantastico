"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

/**
 * Rastreamento de cliques no estilo Sensor Tattoo Fix:
 * - pageview na entrada
 * - links (a[href]) e botões
 * - data-evento / data-rotulo / data-secao
 * Envia para /api/analytics/click (admin → aba Cliques).
 */
const DEDUP_MS = 1200;
const QUEUE_KEY = "cf_click_queue";
const QUEUE_MAX = 40;

type LogBody = {
  tipo: string;
  rotulo?: string;
  pagina?: string;
  href?: string;
  secao?: string;
};

function normalizar(s: string) {
  return String(s || "")
    .trim()
    .replace(/\s+/g, " ")
    .slice(0, 100);
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

function classificarDestino(href: string | null, el: Element): string {
  const evento = el.getAttribute("data-evento");
  if (evento) {
    return evento.replace(/^clique_/, "").replace(/_/g, " ");
  }
  if (!href || href === "#") return "ancora";
  const h = href.toLowerCase();
  if (h.includes("wa.me") || h.includes("whatsapp")) return "whatsapp";
  if (h.includes("/carrinho")) return "carrinho";
  if (h.includes("/checkout")) return "checkout";
  if (h.includes("/produtos")) return "produtos";
  if (h.includes("/contato")) return "contato";
  if (h.includes("/central")) return "central";
  if (h.includes("/faq")) return "faq";
  if (h.includes("/pedido")) return "pedido";
  if (h.includes("/sugestoes")) return "sugestoes";
  if (h.startsWith("mailto:")) return "email";
  if (h.startsWith("tel:")) return "telefone";
  try {
    const url = new URL(href, location.href);
    if (url.origin !== location.origin) return "externo";
    return url.pathname.replace(/^\//, "").replace(/\//g, "_") || "home";
  } catch {
    return "link";
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

function montarBody(
  el: Element,
  extra: Partial<LogBody> & { tipo?: string },
): LogBody {
  const evento = el.getAttribute("data-evento");
  const tipo =
    extra.tipo ||
    (evento ? evento.replace(/^clique_/, "") : "clique");
  const rotulo =
    el.getAttribute("data-rotulo") ||
    extra.rotulo ||
    normalizar(el.textContent || "") ||
    tipo;
  return {
    tipo: String(tipo).slice(0, 64),
    rotulo: normalizar(rotulo).slice(0, 200),
    pagina: (extra.pagina || location.pathname).slice(0, 200),
    href: (extra.href || "").slice(0, 500),
    secao: (
      el.getAttribute("data-secao") ||
      extra.secao ||
      detectarSecao(el)
    ).slice(0, 80),
  };
}

export function SiteClickAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname?.startsWith("/admin")) return;

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

      const destino = classificarDestino(href, link);
      registrar(
        montarBody(link, {
          tipo: link.getAttribute("data-evento")?.replace(/^clique_/, "") || destino,
          href: abs,
          rotulo:
            link.getAttribute("data-rotulo") ||
            normalizar(link.getAttribute("aria-label") || link.textContent || "") ||
            destino,
          secao: detectarSecao(link),
        }),
        link.target === "_blank" ||
          (() => {
            try {
              const u = new URL(abs);
              return u.origin !== location.origin;
            } catch {
              return false;
            }
          })(),
      );
    }

    function trackButton(btn: HTMLButtonElement) {
      if (btn.closest("[data-no-track]")) return;
      const destino = classificarDestino("", btn);
      registrar(
        montarBody(btn, {
          tipo: btn.getAttribute("data-evento")?.replace(/^clique_/, "") || "botao",
          rotulo:
            btn.getAttribute("data-rotulo") ||
            normalizar(btn.textContent || "") ||
            destino,
          secao: detectarSecao(btn),
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

    // Pageview (1× por path na sessão)
    try {
      const key = `cf_pv:${pathname}`;
      if (!sessionStorage.getItem(key)) {
        sessionStorage.setItem(key, "1");
        registrar({
          tipo: "pageview",
          rotulo: `Entrada — ${pathname || "/"}`,
          pagina: pathname || "/",
          secao: "entrada",
          href: location.href,
        });
      }
    } catch {
      /* ignore */
    }

    void flushFila();

    document.addEventListener("pointerdown", onPointerDown, true);
    document.addEventListener("click", onClick, true);
    window.addEventListener("pagehide", () => {
      void flushFila();
    });

    const interval = window.setInterval(() => {
      void flushFila();
    }, 8000);

    return () => {
      document.removeEventListener("pointerdown", onPointerDown, true);
      document.removeEventListener("click", onClick, true);
      window.clearInterval(interval);
    };
  }, [pathname]);

  return null;
}
