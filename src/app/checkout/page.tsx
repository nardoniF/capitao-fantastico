"use client";

import Link from "next/link";
import { useState } from "react";
import { formatBRL } from "@/data/products";
import { useCart } from "@/components/CartProvider";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

export default function CheckoutPage() {
  const { lines, subtotal, clear } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-ink">
          Nada para pagar
        </h1>
        <Link
          href="/produtos"
          className="mt-8 inline-flex rounded-md bg-ink px-6 py-3.5 text-sm font-bold text-white"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  async function payWithMercadoPago() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          items: lines.map((l) => ({
            id: l.product.id,
            title: l.product.name,
            quantity: l.qty,
            unit_price: l.product.price,
          })),
        }),
      });
      const data = (await res.json()) as {
        init_point?: string;
        sandbox_init_point?: string;
        demo?: boolean;
        error?: string;
      };

      if (!res.ok) {
        throw new Error(data.error || "Falha ao criar pagamento");
      }

      if (data.demo) {
        clear();
        window.location.href = "/pedido/sucesso?demo=1";
        return;
      }

      const url = data.init_point || data.sandbox_init_point;
      if (!url) throw new Error("Link de pagamento não retornado");
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no checkout");
      setLoading(false);
    }
  }

  const orderText = lines
    .map((l) => `${l.qty}x ${l.product.name} — ${formatBRL(l.lineTotal)}`)
    .join("\n");

  return (
    <div className="bg-paper py-12 md:py-16">
      <div className="mx-auto grid max-w-5xl gap-10 px-5 md:grid-cols-5 md:px-8">
        <div className="md:col-span-3">
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-ink">
            Checkout
          </h1>
          <p className="mt-2 text-ink-soft/90">
            Pix e cartão via Mercado Pago. Sem token configurado, usamos modo demo.
          </p>
          <form
            className="mt-8 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void payWithMercadoPago();
            }}
          >
            <label className="block text-sm font-medium text-ink">
              Nome
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2.5"
              />
            </label>
            <label className="block text-sm font-medium text-ink">
              E-mail
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-ink/20 bg-white px-3 py-2.5"
              />
            </label>
            {error ? <p className="text-sm text-signal-deep">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-signal px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-signal-deep disabled:opacity-60"
            >
              {loading ? "Abrindo pagamento…" : "Pagar com Mercado Pago"}
            </button>
          </form>
          <a
            href={whatsappUrl(
              `Pedido ${siteConfig.brand}\n${orderText}\nTotal: ${formatBRL(subtotal)}\nNome: ${name || "—"}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full justify-center rounded-md border border-ink/20 px-6 py-3.5 text-sm font-semibold text-ink hover:bg-mist/50"
          >
            Ou finalizar no WhatsApp
          </a>
        </div>
        <aside className="md:col-span-2">
          <div className="rounded-sm bg-mist/70 p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-ink">
              Resumo
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-ink-soft">
              {lines.map((l) => (
                <li key={l.product.id} className="flex justify-between gap-3">
                  <span>
                    {l.qty}× {l.product.name}
                  </span>
                  <span className="font-medium text-ink">{formatBRL(l.lineTotal)}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex justify-between border-t border-ink/10 pt-4 text-base font-bold text-ink">
              <span>Total</span>
              <span>{formatBRL(subtotal)}</span>
            </p>
          </div>
        </aside>
      </div>
    </div>
  );
}
