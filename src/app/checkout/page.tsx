"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { formatBRL, type Product } from "@/data/products";
import { useCart } from "@/components/CartProvider";
import { ProductImage } from "@/components/ProductImage";
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

function maskPhone(value: string) {
  const d = value.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 7) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
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
        <p className="mt-3 text-muted">Seu carrinho está vazio.</p>
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
            size: l.size,
            supplierVariantId: l.supplierVariantId,
            unitPrice: l.unitPrice,
            sku: l.sku,
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
            title: l.size ? `${l.product.name} (${l.size})` : l.product.name,
            quantity: l.qty,
            unit_price: l.unitPrice,
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
      window.location.href = url;
    } catch (e) {
      setError(e instanceof Error ? e.message : "Erro no checkout");
      setLoading(false);
    }
  }

  const orderText = lines
    .map(
      (l) =>
        `${l.qty}x ${l.product.name}${l.size ? ` (${l.size})` : ""} — ${formatBRL(l.lineTotal)}`,
    )
    .join("\n");

  return (
    <div className="bg-bg py-10 md:py-14">
      <div className="mx-auto grid max-w-[1100px] gap-8 px-5 md:grid-cols-[1fr_360px] md:px-6 lg:gap-10">
        <section>
          <div className="mb-6 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-2 rounded-full bg-gold px-3.5 py-1.5 font-semibold text-black">
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black/15 text-xs">
                1
              </span>
              Dados
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-muted">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-xs">
                2
              </span>
              Pagamento
            </span>
            <span className="inline-flex items-center gap-2 rounded-full border border-line px-3.5 py-1.5 text-muted">
              <span className="flex h-5 w-5 items-center justify-center rounded-full border border-line text-xs">
                3
              </span>
              Confirmação
            </span>
          </div>

          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
            Finalizar pedido
          </h1>
          <p className="mt-2 text-muted">
            Preencha seus dados e o endereço. Pagamento seguro no Mercado Pago.
          </p>

          <form
            className="mt-8 space-y-5 rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5 md:p-7"
            onSubmit={(e) => {
              e.preventDefault();
              void payWithMercadoPago();
            }}
          >
            <div>
              <h2 className="text-lg font-bold text-gold">Seus dados</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-2">
                <label className="block text-sm font-medium text-white sm:col-span-2">
                  Nome completo
                  <input
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    autoComplete="name"
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-white">
                  E-mail
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    autoComplete="email"
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-white">
                  WhatsApp
                  <input
                    required
                    value={phone}
                    onChange={(e) => setPhone(maskPhone(e.target.value))}
                    placeholder="(11) 9xxxx-xxxx"
                    autoComplete="tel"
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
              </div>
            </div>

            <div className="border-t border-[#333] pt-5">
              <h2 className="text-lg font-bold text-gold">Endereço de entrega</h2>
              <div className="mt-4 grid gap-4 sm:grid-cols-6">
                <label className="block text-sm font-medium text-white sm:col-span-2">
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
                    autoComplete="postal-code"
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-white sm:col-span-4">
                  Rua
                  <input
                    required
                    value={rua}
                    onChange={(e) => setRua(e.target.value)}
                    autoComplete="address-line1"
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-white sm:col-span-2">
                  Número
                  <input
                    required
                    value={numero}
                    onChange={(e) => setNumero(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-white sm:col-span-4">
                  Complemento
                  <input
                    value={complemento}
                    onChange={(e) => setComplemento(e.target.value)}
                    placeholder="Apto, bloco…"
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-white sm:col-span-2">
                  Bairro
                  <input
                    required
                    value={bairro}
                    onChange={(e) => setBairro(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-white sm:col-span-3">
                  Cidade
                  <input
                    required
                    value={cidade}
                    onChange={(e) => setCidade(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  />
                </label>
                <label className="block text-sm font-medium text-white sm:col-span-1">
                  UF
                  <select
                    required
                    value={uf}
                    onChange={(e) => setUf(e.target.value)}
                    className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-3 text-white outline-none focus:border-gold"
                  >
                    {UF_LIST.map((u) => (
                      <option key={u} value={u}>
                        {u}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </div>

            {error ? (
              <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
                {error}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-md bg-gold px-6 py-4 text-sm font-bold text-black transition hover:bg-gold-deep disabled:opacity-60"
            >
              {loading ? "Abrindo pagamento…" : "Pagar com Mercado Pago"}
            </button>

            <a
              href={whatsappUrl(
                `Pedido ${siteConfig.brand}\n${orderText}\nTotal: ${formatBRL(subtotal)}\nNome: ${name || "—"}\nCEP: ${cep || "—"}`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full justify-center rounded-md border border-[#333] px-6 py-3.5 text-sm font-semibold text-white hover:border-gold hover:text-gold"
            >
              Ou finalizar no WhatsApp
            </a>
          </form>
        </section>

        <aside className="space-y-4 md:sticky md:top-24 md:self-start">
          <div className="rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5">
            <h2 className="text-lg font-bold text-gold">Seu carrinho</h2>
            <ul className="mt-4 space-y-3">
              {lines.map((l) => (
                <li key={l.key} className="flex gap-3">
                  <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-[#333] bg-[#111]">
                    <ProductImage
                      src={l.product.image}
                      alt={l.product.name}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="line-clamp-2 text-sm font-semibold text-white">
                      {l.qty}× {l.product.name}
                      {l.size ? ` · ${l.size}` : ""}
                    </p>
                    <p className="mt-1 text-sm font-bold text-gold">
                      {formatBRL(l.lineTotal)}
                    </p>
                  </div>
                </li>
              ))}
            </ul>

            <div className="mt-5 space-y-2 border-t border-[#333] pt-4 text-sm">
              <div className="flex justify-between text-muted">
                <span>Subtotal</span>
                <span className="text-white">{formatBRL(subtotal)}</span>
              </div>
              <div className="flex justify-between text-muted">
                <span>Frete</span>
                <span className="text-white">Calculado após o pedido</span>
              </div>
              <div className="flex justify-between border-t border-[#333] pt-3 text-base font-bold text-white">
                <span>Total</span>
                <span className="text-gold">{formatBRL(subtotal)}</span>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2 text-[11px] text-muted">
              <span className="rounded-md border border-[#333] px-2 py-2 text-center">
                PIX
              </span>
              <span className="rounded-md border border-[#333] px-2 py-2 text-center">
                Cartão
              </span>
              <span className="rounded-md border border-[#333] px-2 py-2 text-center">
                Mercado Pago
              </span>
              <span className="rounded-md border border-[#333] px-2 py-2 text-center">
                E-mail de confirmação
              </span>
            </div>

            <Link
              href="/produtos"
              className="mt-4 inline-flex w-full justify-center text-sm font-semibold text-gold hover:underline"
            >
              + Adicionar mais produtos
            </Link>
          </div>

          {upsells.length > 0 ? (
            <div className="rounded-[14px] border border-gold/35 bg-gradient-to-b from-gold/10 to-[#1a1a1a] p-5">
              <h2 className="text-base font-bold text-gold">Complete seu pedido</h2>
              <p className="mt-1 text-xs text-muted">
                Combina com o que você escolheu
              </p>
              <ul className="mt-4 space-y-3">
                {upsells.map((p) => (
                  <li key={p.id} className="flex items-center gap-3">
                    <div className="h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-[#333] bg-[#111]">
                      <ProductImage
                        src={p.image}
                        alt={p.name}
                        className="h-full w-full object-cover"
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="line-clamp-2 text-sm font-semibold text-white">
                        {p.name}
                      </p>
                      <p className="text-xs font-bold text-gold">
                        {formatBRL(p.price)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => add(p.id)}
                      className="shrink-0 rounded-md bg-gold px-3 py-2 text-xs font-bold text-black"
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
