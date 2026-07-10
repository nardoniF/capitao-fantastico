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
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Nada para pagar
        </h1>
        <Link
          href="/produtos"
          className="mt-8 inline-flex rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black"
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

      if (!res.ok) throw new Error(data.error || "Falha ao criar pagamento");

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
    <div className="bg-bg py-12 md:py-16">
      <div className="mx-auto grid max-w-5xl gap-8 px-5 md:grid-cols-5 md:px-8">
        <div className="md:col-span-3">
          <div className="mb-6 flex gap-2 text-sm">
            <span className="rounded-full bg-gold px-3 py-1 font-semibold text-black">
              1 Dados
            </span>
            <span className="rounded-full border border-line px-3 py-1 text-muted">
              2 Pagamento
            </span>
            <span className="rounded-full border border-line px-3 py-1 text-muted">
              3 Confirmação
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Checkout
          </h1>
          <p className="mt-2 text-muted">
            Pix e cartão via Mercado Pago. Sem token: modo demo.
          </p>
          <form
            className="mt-8 space-y-4 rounded-xl border border-line bg-card p-6"
            onSubmit={(e) => {
              e.preventDefault();
              void payWithMercadoPago();
            }}
          >
            <label className="block text-sm font-medium text-white">
              Nome
              <input
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
              />
            </label>
            <label className="block text-sm font-medium text-white">
              E-mail
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
              />
            </label>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black transition hover:bg-gold-deep disabled:opacity-60"
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
            className="mt-4 inline-flex w-full justify-center rounded-md border border-line px-6 py-3.5 text-sm font-semibold text-white hover:border-gold hover:text-gold"
          >
            Ou finalizar no WhatsApp
          </a>
        </div>
        <aside className="md:col-span-2">
          <div className="rounded-xl border border-line bg-card p-6">
            <h2 className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              Seu carrinho
            </h2>
            <ul className="mt-4 space-y-3 text-sm text-muted">
              {lines.map((l) => (
                <li key={l.product.id} className="flex justify-between gap-3">
                  <span>
                    {l.qty}× {l.product.name}
                  </span>
                  <span className="font-medium text-white">
                    {formatBRL(l.lineTotal)}
                  </span>
                </li>
              ))}
            </ul>
            <p className="mt-6 flex justify-between border-t border-line pt-4 text-base font-bold text-white">
              <span>Total</span>
              <span className="text-gold">{formatBRL(subtotal)}</span>
            </p>
            <div className="mt-4 flex flex-wrap gap-2 text-xs text-muted">
              <span className="rounded border border-line px-2 py-1">PIX</span>
              <span className="rounded border border-line px-2 py-1">Cartão</span>
              <span className="rounded border border-line px-2 py-1">Mercado Pago</span>
            </div>
            <Link
              href="/produtos"
              className="mt-5 inline-block text-sm text-gold hover:underline"
            >
              + Adicionar mais produtos
            </Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
