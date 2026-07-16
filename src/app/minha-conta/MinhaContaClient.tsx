"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatBRL } from "@/data/products";
import {
  clearCustomerSession,
  getCustomerToken,
  refreshCustomerSession,
  setCustomerSession,
  type CustomerUser,
} from "@/lib/customer-session-client";

type OrderRow = {
  orderId: string;
  status: string;
  statusLabel: string;
  total: number;
  createdAt: string;
  supplierTracking?: string;
  items: { name: string; qty: number; price: number }[];
};

export default function MinhaContaPage() {
  const searchParams = useSearchParams();
  const abaInicial = searchParams.get("aba") === "pedidos" ? "pedidos" : "pedidos";

  const [tab, setTab] = useState<"login" | "register">("login");
  const [panel, setPanel] = useState<"pedidos" | "dados">(abaInicial);
  const [user, setUser] = useState<CustomerUser | null>(null);
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadOrders() {
    const token = getCustomerToken();
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch("/api/account/orders", {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
      });
      if (!res.ok) throw new Error("Falha ao carregar pedidos");
      const data = (await res.json()) as { orders: OrderRow[] };
      setOrders(data.orders);
    } catch {
      setOrders([]);
    } finally {
      setOrdersLoading(false);
    }
  }

  useEffect(() => {
    void refreshCustomerSession().then((u) => {
      setUser(u);
      if (u) void loadOrders();
    });
    const onChange = (e: Event) => {
      const detail = (e as CustomEvent<{ user: CustomerUser | null }>).detail;
      setUser(detail?.user ?? null);
      if (detail?.user) void loadOrders();
      else setOrders([]);
    };
    window.addEventListener("cf-account-changed", onChange);
    return () => window.removeEventListener("cf-account-changed", onChange);
  }, []);

  useEffect(() => {
    if (searchParams.get("aba") === "pedidos") setPanel("pedidos");
  }, [searchParams]);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/account/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: fd.get("email"),
          password: fd.get("password"),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        token?: string;
        user?: CustomerUser;
      };
      if (!res.ok || !data.token || !data.user) {
        throw new Error(data.error || "Login falhou");
      }
      setCustomerSession(data.token, data.user);
      setUser(data.user);
      setPanel("pedidos");
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    try {
      const res = await fetch("/api/account/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: fd.get("name"),
          email: fd.get("email"),
          phone: fd.get("phone"),
          password: fd.get("password"),
        }),
      });
      const data = (await res.json()) as {
        error?: string;
        token?: string;
        user?: CustomerUser;
      };
      if (!res.ok || !data.token || !data.user) {
        throw new Error(data.error || "Cadastro falhou");
      }
      setCustomerSession(data.token, data.user);
      setUser(data.user);
      setPanel("pedidos");
      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    clearCustomerSession();
    setUser(null);
    setOrders([]);
  }

  if (user) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-16">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
              Olá, {user.name.split(" ")[0]}
            </h1>
            <p className="mt-1 text-sm text-muted">Seus pedidos na loja</p>
          </div>
          <button
            type="button"
            onClick={logout}
            className="rounded-md border border-line px-4 py-2 text-sm text-muted hover:border-gold hover:text-gold"
          >
            Sair
          </button>
        </div>

        <div className="mt-6 flex gap-2">
          <button
            type="button"
            onClick={() => setPanel("pedidos")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${panel === "pedidos" ? "bg-gold text-black" : "border border-line text-muted"}`}
          >
            Meus pedidos
          </button>
          <button
            type="button"
            onClick={() => setPanel("dados")}
            className={`rounded-md px-4 py-2 text-sm font-semibold ${panel === "dados" ? "bg-gold text-black" : "border border-line text-muted"}`}
          >
            Meus dados
          </button>
        </div>

        {panel === "pedidos" ? (
          <div className="mt-8 space-y-4">
            {ordersLoading ? (
              <p className="text-muted">Carregando pedidos…</p>
            ) : orders.length === 0 ? (
              <p className="text-muted">
                Nenhum pedido com o e-mail{" "}
                <strong className="text-white">{user.email}</strong>.{" "}
                <Link href="/produtos" className="text-gold hover:underline">
                  Ver produtos
                </Link>
              </p>
            ) : (
              orders.map((o) => (
                <article
                  key={o.orderId}
                  className="rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <strong className="text-gold">{o.orderId}</strong>
                    <span className="text-sm text-muted">{o.statusLabel}</span>
                  </div>
                  <p className="mt-2 text-sm text-white">
                    Total: <strong>{formatBRL(o.total)}</strong>
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    {new Date(o.createdAt).toLocaleString("pt-BR")}
                    {o.supplierTracking ? ` · Rastreio: ${o.supplierTracking}` : ""}
                  </p>
                  <ul className="mt-3 space-y-1 text-sm text-muted">
                    {o.items.map((i, idx) => (
                      <li key={idx}>
                        {i.qty}× {i.name}
                      </li>
                    ))}
                  </ul>
                  <Link
                    href={`/pedido/${encodeURIComponent(o.orderId)}`}
                    className="mt-4 inline-block text-sm font-semibold text-gold hover:underline"
                  >
                    Ver pedido e rastreio →
                  </Link>
                </article>
              ))
            )}
            <p className="text-xs text-muted">
              Troca, devolução ou dúvida?{" "}
              <Link href="/central" className="text-gold hover:underline">
                Central do Capitão
              </Link>
            </p>
          </div>
        ) : (
          <div className="mt-8 rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5 text-sm">
            <p>
              <span className="text-muted">Nome:</span> {user.name}
            </p>
            <p className="mt-2">
              <span className="text-muted">E-mail:</span> {user.email}
            </p>
            {user.phone ? (
              <p className="mt-2">
                <span className="text-muted">WhatsApp:</span> {user.phone}
              </p>
            ) : null}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Minha conta
      </h1>
      <p className="mt-2 text-sm text-muted">
        Crie conta para ver seus pedidos — igual Sensor Tattoo Fix.
      </p>

      <div className="mt-6 flex gap-2">
        <button
          type="button"
          onClick={() => setTab("login")}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === "login" ? "bg-gold text-black" : "border border-line text-muted"}`}
        >
          Entrar
        </button>
        <button
          type="button"
          onClick={() => setTab("register")}
          className={`rounded-md px-4 py-2 text-sm font-semibold ${tab === "register" ? "bg-gold text-black" : "border border-line text-muted"}`}
        >
          Criar conta
        </button>
      </div>

      {tab === "login" ? (
        <form onSubmit={onLogin} className="mt-6 space-y-3">
          <input
            name="email"
            type="email"
            required
            placeholder="E-mail"
            className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Senha"
            className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gold py-3 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Entrando…" : "Entrar"}
          </button>
        </form>
      ) : (
        <form onSubmit={onRegister} className="mt-6 space-y-3">
          <input
            name="name"
            required
            placeholder="Nome completo"
            className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
          />
          <input
            name="email"
            type="email"
            required
            placeholder="E-mail"
            className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
          />
          <input
            name="phone"
            type="tel"
            placeholder="WhatsApp (opcional)"
            className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
          />
          <input
            name="password"
            type="password"
            required
            minLength={6}
            placeholder="Senha (mín. 6)"
            className="w-full rounded-md border border-line bg-card px-3 py-2.5 text-white"
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-md bg-gold py-3 font-bold text-black disabled:opacity-50"
          >
            {loading ? "Criando…" : "Criar conta"}
          </button>
        </form>
      )}

      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
    </div>
  );
}
