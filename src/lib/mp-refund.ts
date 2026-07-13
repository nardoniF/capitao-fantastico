/**
 * Reembolso Mercado Pago — só a API que você já usa (sem custo extra de ferramenta).
 */
export async function refundMercadoPagoPayment(paymentId: string): Promise<{
  ok: boolean;
  refundId?: string;
  error?: string;
  raw?: unknown;
}> {
  const token = process.env.MP_ACCESS_TOKEN?.trim();
  if (!token) {
    return { ok: false, error: "MP_ACCESS_TOKEN ausente" };
  }
  const id = paymentId.trim();
  if (!id) return { ok: false, error: "paymentId vazio" };

  try {
    const res = await fetch(
      `https://api.mercadopago.com/v1/payments/${encodeURIComponent(id)}/refunds`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          "X-Idempotency-Key": `cf-refund-${id}-${Date.now()}`,
        },
        body: JSON.stringify({}),
        cache: "no-store",
      },
    );
    const raw = await res.json().catch(() => ({}));
    if (!res.ok) {
      return {
        ok: false,
        error:
          (raw as { message?: string }).message ||
          `MP ${res.status}`,
        raw,
      };
    }
    const refundId = String(
      (raw as { id?: string | number }).id || "",
    );
    return { ok: true, refundId: refundId || undefined, raw };
  } catch (e) {
    return {
      ok: false,
      error: e instanceof Error ? e.message : "falha refund",
    };
  }
}
