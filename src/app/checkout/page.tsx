"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBRL, type Product } from "@/data/products";
import { useCart } from "@/components/CartProvider";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

type UpsellProduct = Product & { complementaryIds?: string[] };

const UF_LIST = [
  "AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB",
  "PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO",
];

function maskCep(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export default function CheckoutPage() {
  const { lines, subtotal, clear, add } = useCart();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [cep, setCep] = useState("");
  const [rua, setRua] = useState("");
  const [numero, setNumero] = useState("");
  const [complemento, setComplemento] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [uf, setUf] = useState("SP");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [upsells, setUpsells] = useState<UpsellProduct[]>([]);

  useEffect(() => {
    const cart = lines.map((l) => l.product.id).join(",");
    if (!cart) {
      setUpsells([]);
      return;
    }
    void fetch(`/api/products?cart=${encodeURIComponent(cart)}`)
      .then((r) => r.json())
      .then((d: { products?: UpsellProduct[] }) => setUpsells(d.products ?? []))
      .catch(() => setUpsells([]));
  }, [lines]);

  async function lookupCep(raw: string) {
    const digits = raw.replace(/\D/g, "");
    if (digits.length !== 8) return;
    try {
      const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
      const data = (await res.json()) as {
        erro?: boolean;
        logradouro?: string;
        bairro?: string;
        localidade?: string;
        uf?: string;
      };
      if (data.erro) return;
      if (data.logradouro) setRua(data.logradouro);
      if (data.bairro) setBairro(data.bairro);
      if (data.localidade) setCidade(data.localidade);
      if (data.uf) setUf(data.uf);
    } catch {
      /* manual fill */
    }
  }

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
      const orderRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: name,
          email,
          telefone: phone,
          endereco: { cep, rua, numero, complemento, bairro, cidade, uf },
          items: lines.map((l) => ({
            productId: l.product.id,
            qty: l.qty,
          })),
        }),
      });
      const orderData = (await orderRes.json()) as {
        order?: { orderId: string };
        error?: string;
      };
      if (!orderRes.ok) throw new Error(orderData.error || "Falha no pedido");

      const orderId = orderData.order?.orderId;
      if (!orderId) throw new Error("Pedido sem ID");

      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          orderId,
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
        window.location.href = `/pedido/sucesso?demo=1&pedido=${orderId}`;
        return;
      }

      const url = data.init_point || data.sandbox_init_point;
      if (!url) throw new Error("Link de pagamento não retornado");
      // Carrinho limpa na página de sucesso após retorno do MP
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
          <div className="mb-6 flex flex-wrap gap-2 text-sm">
            <span className="rounded-full bg-gold px-3 py-1 font-semibold text-black">
              1 Dados + endereço
            </span>
            <span className="rounded-full border border-line px-3 py-1 text-muted">
              2 Pagamento MP
            </span>
            <span className="rounded-full border border-line px-3 py-1 text-muted">
              3 Fornecedor envia
            </span>
          </div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Checkout
          </h1>
          <p className="mt-2 text-muted">
            Endereço completo para o fornecedor enviar. Pagamento no Mercado Pago.
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
            <label className="block text-sm font-medium text-white">
              WhatsApp
              <input
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="(11) 9xxxx-xxxx"
                className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
              />
            </label>

            <div className="border-t border-line pt-4">
              <p className="text-sm font-semibold text-gold">Endereço de entrega</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium text-white sm:col-span-1">
                CEP
                <input
                  required
                  value={cep}
                  onChange={(e) => {
                    const v = maskCep(e.target.value);
                    setCep(v);
                    if (v.replace(/\D/g, "").length === 8) void lookupCep(v);
                  }}
                  placeholder="00000-000"
                  className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
                />
              </label>
              <label className="block text-sm font-medium text-white sm:col-span-2">
                Rua
                <input
                  required
                  value={rua}
                  onChange={(e) => setRua(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium text-white">
                Número
                <input
                  required
                  value={numero}
                  onChange={(e) => setNumero(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
                />
              </label>
              <label className="block text-sm font-medium text-white sm:col-span-2">
                Complemento
                <input
                  value={complemento}
                  onChange={(e) => setComplemento(e.target.value)}
                  placeholder="Apto, bloco…"
                  className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <label className="block text-sm font-medium text-white sm:col-span-1">
                Bairro
                <input
                  required
                  value={bairro}
                  onChange={(e) => setBairro(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
                />
              </label>
              <label className="block text-sm font-medium text-white sm:col-span-1">
                Cidade
                <input
                  required
                  value={cidade}
                  onChange={(e) => setCidade(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
                />
              </label>
              <label className="block text-sm font-medium text-white">
                UF
                <select
                  required
                  value={uf}
                  onChange={(e) => setUf(e.target.value)}
                  className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white outline-none focus:border-gold"
                >
                  {UF_LIST.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
            </div>

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
              `Pedido ${siteConfig.brand}\n${orderText}\nTotal: ${formatBRL(subtotal)}\nNome: ${name || "—"}\nCEP: ${cep || "—"}`,
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-4 inline-flex w-full justify-center rounded-md border border-line px-6 py-3.5 text-sm font-semibold text-white hover:border-gold hover:text-gold"
          >
            Ou finalizar no WhatsApp
          </a>
        </div>
        <aside className="md:col-span-2 space-y-4">
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
          </div>

          {upsells.length > 0 ? (
            <div className="rounded-xl border border-gold/30 bg-card p-6">
              <h2 className="font-[family-name:var(--font-syne)] text-lg font-bold text-gold">
                Complete seu pedido
              </h2>
              <p className="mt-1 text-xs text-muted">
                Produtos que combinam com o que você escolheu
              </p>
              <ul className="mt-4 space-y-3">
                {upsells.map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 border-b border-line pb-3 last:border-0"
                  >
                    <div>
                      <p className="text-sm font-semibold text-white">{p.name}</p>
                      <p className="text-xs text-gold">{formatBRL(p.price)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => add(p.id)}
                      className="rounded-md bg-gold px-3 py-1.5 text-xs font-bold text-black"
                    >
                      + Add
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </aside>
      </div>
    </div>
  );
}
