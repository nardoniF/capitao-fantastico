"use client";

import { useCallback, useEffect, useState } from "react";
import { formatBRL } from "@/data/products";
import { FEEDBACK_KINDS } from "@/components/SuggestionForm";
import { whatsappUrl } from "@/lib/site-config";

type Pricing = { markup: number; fxBrl: number; feePct: number; ruleId?: string };

type ProductRow = {
  id: string;
  slug: string;
  name: string;
  category: string;
  active: boolean;
  costUsd: number;
  shippingUsd: number;
  costBrl: number;
  salePrice: number;
  marginBrl: number;
  marginPct: number;
  mpFeeBrl: number;
  netAfterMpBrl: number;
};

type OrderRow = {
  orderId: string;
  createdAt: string;
  status: string;
  nome: string;
  email: string;
  charged: number;
  costPaid: number;
  mpFee: number;
  commission: number;
  items: { name: string; qty: number; unitPrice: number; unitCostBrl: number }[];
  paymentRef?: string;
  supplierTracking?: string;
};

type ClickRow = {
  id: string;
  createdAt: string;
  tipo: string;
  rotulo?: string;
  pagina?: string;
};

type FeedbackRow = {
  id: string;
  name: string;
  email: string;
  kind: string;
  message: string;
  page: string | null;
  createdAt: string;
};

type ApiCheck = { name: string; ok: boolean; detail: string };

type Tab = "vendas" | "produtos" | "markup" | "cliques" | "sugestoes" | "api";

const kindLabel = (kind: string) =>
  FEEDBACK_KINDS.find((k) => k.value === kind)?.label || kind;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<Tab>("vendas");
  const [pricing, setPricing] = useState<Pricing | null>(null);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [clicks, setClicks] = useState<ClickRow[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [api, setApi] = useState<ApiCheck[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [markupDraft, setMarkupDraft] = useState("2.3");
  const [fxDraft, setFxDraft] = useState("5.6");
  const [feeDraft, setFeeDraft] = useState("5");

  const load = useCallback(async () => {
    setError(null);
    const res = await fetch("/api/admin", {
      headers: { "x-admin-password": password },
    });
    if (!res.ok) {
      setAuthed(false);
      setError("Senha inválida ou ADMIN_PASSWORD não configurada");
      return;
    }
    const data = (await res.json()) as {
      pricing: Pricing;
      products: ProductRow[];
      orders: OrderRow[];
      clicks: ClickRow[];
      feedback: FeedbackRow[];
      api: ApiCheck[];
    };
    setPricing(data.pricing);
    setProducts(data.products);
    setOrders(data.orders);
    setClicks(data.clicks);
    setFeedback(data.feedback);
    setApi(data.api);
    setMarkupDraft(String(data.pricing.markup));
    setFxDraft(String(data.pricing.fxBrl));
    setFeeDraft(String(Number((data.pricing.feePct * 100).toFixed(2))));
    setAuthed(true);
  }, [password]);

  useEffect(() => {
    const saved = sessionStorage.getItem("cf-admin-pass");
    if (saved) setPassword(saved);
  }, []);

  useEffect(() => {
    if (!msg) return;
    const t = window.setTimeout(() => setMsg(null), 2500);
    return () => window.clearTimeout(t);
  }, [msg]);

  async function put(body: unknown) {
    const res = await fetch("/api/admin", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const d = (await res.json()) as { error?: string };
      throw new Error(d.error || "Falha");
    }
    return res.json();
  }

  async function savePricing() {
    try {
      await put({
        action: "update_pricing",
        pricing: {
          markup: Number(markupDraft),
          fxBrl: Number(fxDraft),
          feePct: Number(feeDraft) / 100,
        },
      });
      setMsg("Markup salvo. Novos imports/sync usam essa regra.");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha ao salvar markup");
    }
  }

  async function patchProduct(
    productId: string,
    productPatch: { salePrice?: number; active?: boolean },
  ) {
    try {
      await put({ action: "update_neon_product", productId, productPatch });
      setMsg("Produto atualizado");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Falha no produto");
    }
  }

  async function patchOrder(orderId: string, patch: Record<string, unknown>) {
    await put({ action: "update_order", orderId, patch });
    await load();
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Admin · Capitão
        </h1>
        <p className="mt-2 text-sm text-muted">
          Senha = <code className="text-gold">ADMIN_PASSWORD</code> no Vercel.
        </p>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Senha"
          className="mt-6 w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
        />
        {error ? <p className="mt-2 text-sm text-red-400">{error}</p> : null}
        <button
          type="button"
          onClick={() => {
            sessionStorage.setItem("cf-admin-pass", password);
            void load();
          }}
          className="mt-4 w-full rounded-md bg-gold py-3 font-bold text-black"
        >
          Entrar
        </button>
        <p className="mt-6 text-xs text-muted">
          Catálogo CJ:{" "}
          <a
            href="https://cjdropshipping.com"
            target="_blank"
            rel="noopener noreferrer"
            className="text-gold hover:underline"
          >
            cjdropshipping.com
          </a>
        </p>
      </div>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "vendas", label: `Vendas (${orders.length})` },
    { id: "produtos", label: `Produtos (${products.length})` },
    { id: "markup", label: "Markup" },
    { id: "cliques", label: `Cliques (${clicks.length})` },
    { id: "sugestoes", label: `Sugestões (${feedback.length})` },
    { id: "api", label: "API" },
  ];

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Admin · Capitão Fantástico
          </h1>
          <p className="mt-1 text-sm text-muted">
            Custo · venda · taxa MP · comissão líquida
            {pricing
              ? ` · markup ${pricing.markup}× · FX ${pricing.fxBrl} · MP ${(pricing.feePct * 100).toFixed(0)}%`
              : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <a
            href="https://cjdropshipping.com"
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-line px-4 py-2 text-sm text-gold hover:border-gold"
          >
            Abrir CJ
          </a>
          <button
            type="button"
            onClick={() => void load()}
            className="rounded-md border border-line px-4 py-2 text-sm text-white hover:border-gold"
          >
            Atualizar
          </button>
        </div>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setError(null);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t.id ? "bg-gold text-black" : "border border-line text-muted"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {msg ? (
        <p className="mt-4 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
          {msg}
        </p>
      ) : null}
      {error ? (
        <p className="mt-4 rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      {tab === "vendas" ? (
        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <p className="text-muted">Nenhuma venda ainda.</p>
          ) : (
            <div className="overflow-x-auto rounded-[14px] border border-[#333]">
              <table className="min-w-full text-left text-sm">
                <thead className="border-b border-[#333] bg-[#141414] text-muted">
                  <tr>
                    <th className="px-3 py-3">Pedido</th>
                    <th className="px-3 py-3">Cliente</th>
                    <th className="px-3 py-3">Custo (paguei)</th>
                    <th className="px-3 py-3">Cobrado</th>
                    <th className="px-3 py-3">Taxa MP</th>
                    <th className="px-3 py-3">Comissão</th>
                    <th className="px-3 py-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.orderId} className="border-b border-[#2a2a2a] text-white">
                      <td className="px-3 py-3 align-top">
                        <p className="font-semibold">{o.orderId}</p>
                        <p className="text-xs text-muted">
                          {new Date(o.createdAt).toLocaleString("pt-BR")}
                        </p>
                        <p className="text-xs text-gold">{o.status}</p>
                        <ul className="mt-1 text-xs text-muted">
                          {o.items.map((it, i) => (
                            <li key={`${o.orderId}-${i}`}>
                              {it.qty}× {it.name}
                            </li>
                          ))}
                        </ul>
                      </td>
                      <td className="px-3 py-3 align-top text-muted">
                        {o.nome}
                        <br />
                        {o.email}
                      </td>
                      <td className="px-3 py-3 align-top">{formatBRL(o.costPaid)}</td>
                      <td className="px-3 py-3 align-top font-semibold">
                        {formatBRL(o.charged)}
                      </td>
                      <td className="px-3 py-3 align-top text-red-300">
                        −{formatBRL(o.mpFee)}
                      </td>
                      <td className="px-3 py-3 align-top font-bold text-gold">
                        {formatBRL(o.commission)}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex flex-col gap-1">
                          {o.status === "pending_payment" ? (
                            <button
                              type="button"
                              onClick={() =>
                                void patchOrder(o.orderId, { status: "paid" })
                              }
                              className="rounded bg-gold px-2 py-1 text-xs font-bold text-black"
                            >
                              Marcar pago
                            </button>
                          ) : null}
                          <button
                            type="button"
                            onClick={() => {
                              const code = window.prompt("Rastreio fornecedor");
                              if (code)
                                void patchOrder(o.orderId, {
                                  supplierTracking: code,
                                  status: "fulfilled",
                                });
                            }}
                            className="rounded border border-line px-2 py-1 text-xs"
                          >
                            Rastreio
                          </button>
                          <a
                            href={whatsappUrl(
                              `Olá ${o.nome}! Pedido ${o.orderId}${
                                o.supplierTracking
                                  ? ` — rastreio: ${o.supplierTracking}`
                                  : ""
                              }`,
                            )}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="rounded border border-gold/40 px-2 py-1 text-center text-xs text-gold"
                          >
                            WhatsApp
                          </a>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="text-xs text-muted">
            Comissão = cobrado − custo fornecedor (BRL) − taxa MP estimada (
            {pricing ? `${(pricing.feePct * 100).toFixed(0)}%` : "5%"}). Frete CJ
            ainda pode estar zerado em alguns itens.
          </p>
        </div>
      ) : null}

      {tab === "produtos" ? (
        <div className="mt-8 overflow-x-auto rounded-[14px] border border-[#333]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#333] bg-[#141414] text-muted">
              <tr>
                <th className="px-3 py-3">Produto</th>
                <th className="px-3 py-3">Custo CJ</th>
                <th className="px-3 py-3">Custo BRL</th>
                <th className="px-3 py-3">Venda</th>
                <th className="px-3 py-3">Taxa MP</th>
                <th className="px-3 py-3">Comissão líq.</th>
                <th className="px-3 py-3">Ações</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p.id} className="border-b border-[#2a2a2a] text-white">
                  <td className="px-3 py-3">
                    <p className="font-semibold">{p.name}</p>
                    <p className="text-xs text-muted">
                      {p.category} · {p.active ? "ativo" : "inativo"}
                    </p>
                  </td>
                  <td className="px-3 py-3 text-muted">
                    US$ {p.costUsd.toFixed(2)}
                    {p.shippingUsd > 0 ? ` + frete ${p.shippingUsd.toFixed(2)}` : ""}
                  </td>
                  <td className="px-3 py-3">{formatBRL(p.costBrl)}</td>
                  <td className="px-3 py-3 font-semibold">{formatBRL(p.salePrice)}</td>
                  <td className="px-3 py-3 text-red-300">−{formatBRL(p.mpFeeBrl)}</td>
                  <td className="px-3 py-3 font-bold text-gold">
                    {formatBRL(p.netAfterMpBrl)}
                    <span className="ml-1 text-xs font-normal text-muted">
                      ({p.marginPct}%)
                    </span>
                  </td>
                  <td className="px-3 py-3">
                    <div className="flex flex-wrap gap-1">
                      <button
                        type="button"
                        onClick={() => {
                          const salePrice = Number(
                            window.prompt("Preço de venda BRL", String(p.salePrice)),
                          );
                          if (!Number.isFinite(salePrice)) return;
                          void patchProduct(p.id, { salePrice });
                        }}
                        className="rounded border border-line px-2 py-1 text-xs"
                      >
                        Preço
                      </button>
                      <button
                        type="button"
                        onClick={() =>
                          void patchProduct(p.id, { active: !p.active })
                        }
                        className="rounded bg-gold px-2 py-1 text-xs font-bold text-black"
                      >
                        {p.active ? "Off" : "On"}
                      </button>
                      <a
                        href={`/produtos/${p.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded border border-gold/40 px-2 py-1 text-xs text-gold"
                      >
                        Ver
                      </a>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "markup" ? (
        <div className="mt-8 max-w-lg space-y-4 rounded-[14px] border border-[#333] bg-[#1a1a1a] p-6">
          <h2 className="text-lg font-bold text-gold">Regra de preço global</h2>
          <p className="text-sm text-muted">
            venda ≈ (custo USD + frete) × câmbio × (1 + taxa) × markup → arredonda
            .90
          </p>
          <label className="block text-sm text-white">
            Markup (ex. 2.3 = 130% sobre custo+taxa)
            <input
              value={markupDraft}
              onChange={(e) => setMarkupDraft(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5"
            />
          </label>
          <label className="block text-sm text-white">
            Câmbio USD → BRL
            <input
              value={fxDraft}
              onChange={(e) => setFxDraft(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5"
            />
          </label>
          <label className="block text-sm text-white">
            Taxa Mercado Pago (%)
            <input
              value={feeDraft}
              onChange={(e) => setFeeDraft(e.target.value)}
              className="mt-1 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5"
            />
          </label>
          <button
            type="button"
            onClick={() => void savePricing()}
            className="w-full rounded-md bg-gold py-3 font-bold text-black"
          >
            Salvar markup
          </button>
          <p className="text-xs text-muted">
            Produtos já importados não recalculam sozinhos — rode o sync ou ajuste
            o preço na aba Produtos. Novos imports usam a regra nova.
          </p>
        </div>
      ) : null}

      {tab === "cliques" ? (
        <div className="mt-8 overflow-x-auto rounded-[14px] border border-[#333]">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-[#333] bg-[#141414] text-muted">
              <tr>
                <th className="px-3 py-3">Quando</th>
                <th className="px-3 py-3">Tipo</th>
                <th className="px-3 py-3">Rótulo</th>
                <th className="px-3 py-3">Página</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((c) => (
                <tr key={c.id} className="border-b border-[#2a2a2a] text-white">
                  <td className="px-3 py-2 text-muted">
                    {new Date(c.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-3 py-2">{c.tipo}</td>
                  <td className="px-3 py-2">{c.rotulo || "—"}</td>
                  <td className="px-3 py-2">{c.pagina || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {tab === "sugestoes" ? (
        <div className="mt-8 space-y-4">
          {feedback.length === 0 ? (
            <p className="text-muted">Nenhuma sugestão ainda.</p>
          ) : (
            feedback.map((f) => (
              <div key={f.id} className="rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5">
                <p className="font-bold text-gold">{kindLabel(f.kind)}</p>
                <p className="mt-1 text-sm text-muted">
                  {f.name} ·{" "}
                  <a href={`mailto:${f.email}`} className="text-white hover:text-gold">
                    {f.email}
                  </a>
                </p>
                <p className="mt-3 whitespace-pre-wrap text-sm text-white/90">
                  {f.message}
                </p>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "api" ? (
        <div className="mt-8 space-y-3">
          {api.map((c) => (
            <div
              key={c.name}
              className="flex flex-wrap items-center justify-between gap-3 rounded-[14px] border border-[#333] bg-[#1a1a1a] px-4 py-3"
            >
              <div>
                <p className="font-semibold text-white">{c.name}</p>
                <p className="text-sm text-muted">{c.detail}</p>
              </div>
              <span
                className={`rounded-full px-3 py-1 text-xs font-bold ${
                  c.ok ? "bg-emerald-500/20 text-emerald-300" : "bg-red-500/20 text-red-300"
                }`}
              >
                {c.ok ? "OK" : "FALTA"}
              </span>
            </div>
          ))}
          <p className="pt-2 text-sm text-muted">
            Fornecedor:{" "}
            <a
              href="https://cjdropshipping.com"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gold hover:underline"
            >
              https://cjdropshipping.com
            </a>
          </p>
        </div>
      ) : null}
    </div>
  );
}
