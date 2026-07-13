/** Analytics de clique (admin monitora — não precisa mover nada). */
export async function trackClick(input: {
  tipo: string;
  rotulo?: string;
  pagina?: string;
  href?: string;
  secao?: string;
}) {
  try {
    await fetch("/api/analytics/click", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        tipo: input.tipo,
        rotulo: input.rotulo,
        pagina: input.pagina || (typeof window !== "undefined" ? window.location.pathname : undefined),
        href: input.href,
        secao: input.secao,
      }),
      keepalive: true,
    });
  } catch {
    /* silencioso */
  }
}
