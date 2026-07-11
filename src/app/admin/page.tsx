"use client";

import { useCallback, useEffect, useState } from "react";
import { formatBRL } from "@/data/products";
import { FEEDBACK_KINDS } from "@/components/SuggestionForm";
import {
  formatAddress,
  type ClickEvent,
  type Order,
  type StoreProduct,
} from "@/lib/store-types";
import { whatsappUrl } from "@/lib/site-config";

type FeedbackRow = {
  id: string;
  name: string;
  email: string;
  kind: string;
  message: string;
  page: string | null;
  createdAt: string;
};

const kindLabel = (kind: string) =>
  FEEDBACK_KINDS.find((k) => k.value === kind)?.label || kind;

export default function AdminPage() {
  const [password, setPassword] = useState("");
  const [authed, setAuthed] = useState(false);
  const [tab, setTab] = useState<"products" | "orders" | "clicks" | "feedback">(
    "orders",
  );
  const [products, setProducts] = useState<StoreProduct[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [clicks, setClicks] = useState<ClickEvent[]>([]);
  const [feedback, setFeedback] = useState<FeedbackRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

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
      products: StoreProduct[];
      orders: Order[];
      clicks: ClickEvent[];
    };
    setProducts(data.products);
    setOrders(data.orders);
    setClicks(data.clicks);

    const fbRes = await fetch("/api/feedback", {
      headers: { "x-admin-password": password },
    });
    if (fbRes.ok) {
      const fbData = (await fbRes.json()) as { feedback?: FeedbackRow[] };
      setFeedback(fbData.feedback ?? []);
    } else {
      setFeedback([]);
    }

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

  async function saveProduct(product: StoreProduct) {
    setError(null);
    const res = await fetch("/api/admin", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ action: "upsert_product", product }),
    });
    if (!res.ok) {
      setError("Falha ao salvar produto");
      return;
    }
    setMsg(`Salvo: ${product.name}`);
    await load();
  }

  async function patchOrder(orderId: string, patch: Partial<Order>) {
    await fetch("/api/admin", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        "x-admin-password": password,
      },
      body: JSON.stringify({ action: "update_order", orderId, patch }),
    });
    await load();
  }

  if (!authed) {
    return (
      <div className="mx-auto max-w-md px-5 py-20">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Admin
        </h1>
        <p className="mt-2 text-sm text-muted">
          Defina <code className="text-gold">ADMIN_PASSWORD</code> no .env / Vercel.
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
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-10 md:px-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
            Admin · Capitão
          </h1>
          <p className="mt-1 text-sm text-muted">
            Pedidos, produtos, cliques e sugestões dos visitantes
          </p>
        </div>
        <button
          type="button"
          onClick={() => void load()}
          className="rounded-md border border-line px-4 py-2 text-sm text-white hover:border-gold"
        >
          Atualizar
        </button>
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(
          [
            ["orders", "Pedidos"],
            ["products", "Produtos"],
            ["feedback", `Sugestões (${feedback.length})`],
            ["clicks", "Cliques"],
          ] as const
        ).map(([t, label]) => (
          <button
            key={t}
            type="button"
            onClick={() => {
              setMsg(null);
              setError(null);
              setTab(t);
            }}
            className={`rounded-full px-4 py-1.5 text-sm font-semibold ${
              tab === t ? "bg-gold text-black" : "border border-line text-muted"
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {msg ? (
        <p className="mt-4 flex items-center justify-between gap-3 rounded-md border border-gold/30 bg-gold/10 px-3 py-2 text-sm text-gold">
          <span>{msg}</span>
          <button
            type="button"
            onClick={() => setMsg(null)}
            className="shrink-0 text-xs font-semibold text-white/70 hover:text-white"
            aria-label="Fechar"
          >
            ✕
          </button>
        </p>
      ) : null}

      {tab === "orders" ? (
        <div className="mt-8 space-y-4">
          {orders.length === 0 ? (
            <p className="text-muted">Nenhum pedido ainda.</p>
          ) : (
            orders.map((o) => (
              <div key={o.orderId} className="rounded-xl border border-line bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <p className="font-bold text-white">
                      {o.orderId} ·{" "}
                      <span className="text-gold">{o.status}</span>
                      {o.paymentRef ? (
                        <span className="ml-2 text-xs font-normal text-muted">
                          MP #{o.paymentRef}
                        </span>
                      ) : null}
                    </p>
                    <p className="mt-1 text-sm text-muted">
                      {o.nome} · {o.email}
                      {o.telefone ? ` · ${o.telefone}` : ""} · {formatBRL(o.total)}
                    </p>
                    {o.endereco ? (
                      <pre className="mt-2 whitespace-pre-wrap font-sans text-sm text-white/80">
                        {formatAddress(o.endereco)}
                      </pre>
                    ) : (
                      <p className="mt-2 text-sm text-red-400">
                        Sem endereço — pedir no WhatsApp
                      </p>
                    )}
                    <ul className="mt-2 text-sm text-muted">
                      {o.items.map((i) => (
                        <li key={i.productId}>
                          {i.qty}× {i.name} ({formatBRL(i.price)})
                        </li>
                      ))}
                    </ul>
                    {o.supplierTracking ? (
                      <p className="mt-2 text-sm text-gold">
                        Rastreio: {o.supplierTracking}
                      </p>
                    ) : null}
                  </div>
                  <div className="flex flex-col gap-2">
                    {o.status === "pending_payment" ? (
                      <button
                        type="button"
                        onClick={() => void patchOrder(o.orderId, { status: "paid" })}
                        className="rounded-md bg-gold px-3 py-2 text-xs font-bold text-black"
                      >
                        Marcar pago
                      </button>
                    ) : null}
                    {o.status !== "cancelled" && o.status !== "fulfilled" ? (
                      <button
                        type="button"
                        onClick={() => {
                          const code = window.prompt("Código de rastreio do fornecedor");
                          if (code)
                            void patchOrder(o.orderId, {
                              supplierTracking: code,
                              status: "fulfilled",
                            });
                        }}
                        className="rounded-md border border-line px-3 py-2 text-xs text-white"
                      >
                        Rastreio fornecedor
                      </button>
                    ) : null}
                    {o.telefone || o.email ? (
                      <a
                        href={whatsappUrl(
                          `Olá ${o.nome}! Pedido ${o.orderId}${
                            o.supplierTracking
                              ? ` — rastreio: ${o.supplierTracking}`
                              : " — estamos processando seu envio."
                          }`,
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md border border-gold/40 px-3 py-2 text-center text-xs text-gold"
                      >
                        WhatsApp cliente
                      </a>
                    ) : null}
                    {o.status !== "cancelled" && o.status !== "fulfilled" ? (
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm("Cancelar este pedido?"))
                            void patchOrder(o.orderId, { status: "cancelled" });
                        }}
                        className="rounded-md border border-red-500/40 px-3 py-2 text-xs text-red-400"
                      >
                        Cancelar
                      </button>
                    ) : null}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "products" ? (
        <div className="mt-8 space-y-4">
          {products.map((p) => {
            const margin = p.price - (p.cost ?? 0);
            return (
              <div key={p.id} className="rounded-xl border border-line bg-card p-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-white">{p.name}</p>
                    <p className="text-sm text-muted">
                      {p.sku || "sem SKU"}
                      {p.supplierSku ? ` · forn: ${p.supplierSku}` : ""} · venda{" "}
                      {formatBRL(p.price)} · custo {formatBRL(p.cost ?? 0)} · margem{" "}
                      {formatBRL(margin)} · {p.active ? "ativo" : "inativo"}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        const price = Number(
                          window.prompt("Preço de venda", String(p.price)),
                        );
                        if (!Number.isFinite(price)) return;
                        void saveProduct({ ...p, price });
                      }}
                      className="rounded-md border border-line px-3 py-2 text-xs text-white"
                    >
                      Preço
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const cost = Number(
                          window.prompt("Custo fornecedor", String(p.cost ?? 0)),
                        );
                        if (!Number.isFinite(cost)) return;
                        void saveProduct({ ...p, cost });
                      }}
                      className="rounded-md border border-line px-3 py-2 text-xs text-white"
                    >
                      Custo
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const sku = window.prompt("SKU interno", p.sku || "");
                        if (sku === null) return;
                        void saveProduct({ ...p, sku: sku.trim() || undefined });
                      }}
                      className="rounded-md border border-line px-3 py-2 text-xs text-white"
                    >
                      SKU
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const supplierSku = window.prompt(
                          "SKU / link fornecedor",
                          p.supplierSku || "",
                        );
                        if (supplierSku === null) return;
                        void saveProduct({
                          ...p,
                          supplierSku: supplierSku.trim() || undefined,
                        });
                      }}
                      className="rounded-md border border-line px-3 py-2 text-xs text-white"
                    >
                      Fornecedor
                    </button>
                    <button
                      type="button"
                      onClick={() => void saveProduct({ ...p, active: !p.active })}
                      className="rounded-md bg-gold px-3 py-2 text-xs font-bold text-black"
                    >
                      {p.active ? "Desativar" : "Ativar"}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : null}

      {tab === "feedback" ? (
        <div className="mt-8 space-y-4">
          {feedback.length === 0 ? (
            <p className="text-muted">
              Nenhuma sugestão ainda. Link público:{" "}
              <a href="/sugestoes" className="text-gold hover:underline">
                /sugestoes
              </a>
            </p>
          ) : (
            feedback.map((f) => (
              <div key={f.id} className="rounded-xl border border-line bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-bold text-gold">{kindLabel(f.kind)}</p>
                    <p className="mt-1 text-sm text-muted">
                      {f.name} ·{" "}
                      <a className="text-white hover:text-gold" href={`mailto:${f.email}`}>
                        {f.email}
                      </a>
                      {f.page ? ` · página ${f.page}` : ""}
                    </p>
                    <p className="mt-3 whitespace-pre-wrap text-sm text-white/90">
                      {f.message}
                    </p>
                  </div>
                  <p className="text-xs text-muted">
                    {new Date(f.createdAt).toLocaleString("pt-BR")}
                  </p>
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === "clicks" ? (
        <div className="mt-8 overflow-x-auto rounded-xl border border-line bg-card">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-line text-muted">
              <tr>
                <th className="px-4 py-3">Quando</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Rótulo</th>
                <th className="px-4 py-3">Página</th>
              </tr>
            </thead>
            <tbody>
              {clicks.map((c) => (
                <tr key={c.id} className="border-b border-line/60 text-white">
                  <td className="px-4 py-2 text-muted">
                    {new Date(c.createdAt).toLocaleString("pt-BR")}
                  </td>
                  <td className="px-4 py-2">{c.tipo}</td>
                  <td className="px-4 py-2">{c.rotulo || "—"}</td>
                  <td className="px-4 py-2">{c.pagina || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
