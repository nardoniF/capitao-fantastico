"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type User = { id: string; name: string; email: string; phone?: string | null };

const TOKEN_KEY = "cf-customer-token";

export default function MinhaContaPage() {
  const [tab, setTab] = useState<"login" | "register">("login");
  const [user, setUser] = useState<User | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const token = sessionStorage.getItem(TOKEN_KEY);
    if (!token) return;
    void fetch("/api/account/session", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(async (r) => {
        if (!r.ok) throw new Error("sessão");
        return r.json() as Promise<{ user: User }>;
      })
      .then((d) => setUser(d.user))
      .catch(() => sessionStorage.removeItem(TOKEN_KEY));
  }, []);

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
      const data = (await res.json()) as { error?: string; token?: string; user?: User };
      if (!res.ok || !data.token || !data.user) {
        throw new Error(data.error || "Login falhou");
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
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
      const data = (await res.json()) as { error?: string; token?: string; user?: User };
      if (!res.ok || !data.token || !data.user) {
        throw new Error(data.error || "Cadastro falhou");
      }
      sessionStorage.setItem(TOKEN_KEY, data.token);
      setUser(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro");
    } finally {
      setLoading(false);
    }
  }

  function logout() {
    sessionStorage.removeItem(TOKEN_KEY);
    setUser(null);
  }

  if (user) {
    return (
      <div className="mx-auto max-w-lg px-5 py-16">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Olá, {user.name.split(" ")[0]}
        </h1>
        <p className="mt-2 text-muted">{user.email}</p>
        <p className="mt-6 text-sm text-muted">
          Seus pedidos aparecem em{" "}
          <Link href="/central" className="text-gold hover:underline">
            Central do pedido
          </Link>{" "}
          com o e-mail da compra.
        </p>
        <button
          type="button"
          onClick={logout}
          className="mt-8 rounded-md border border-line px-5 py-2.5 text-sm font-semibold text-white hover:border-gold hover:text-gold"
        >
          Sair
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Minha conta
      </h1>
      <p className="mt-2 text-sm text-muted">
        Crie conta para comprar mais rápido — igual Sensor Tattoo Fix.
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
