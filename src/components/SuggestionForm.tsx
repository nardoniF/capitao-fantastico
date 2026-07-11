"use client";

import { useState, type FormEvent } from "react";

export const FEEDBACK_KINDS = [
  {
    value: "product_idea",
    label: "Produto para vender",
    hint: "Sugira um produto que o Capitão deveria trazer",
  },
  {
    value: "missing_feature",
    label: "O que faltou no site",
    hint: "Algo que você procurou e não achou",
  },
  {
    value: "product_issue",
    label: "Sobre um produto da loja",
    hint: "Dúvida, melhoria ou problema em um item",
  },
  {
    value: "complaint",
    label: "Reclamação",
    hint: "Conte o que deu errado — a gente lê",
  },
  {
    value: "other",
    label: "Outra sugestão",
    hint: "Ideia geral para melhorar a loja",
  },
] as const;

type Props = {
  defaultKind?: string;
  page?: string;
  compact?: boolean;
  onDone?: () => void;
};

export function SuggestionForm({
  defaultKind = "product_idea",
  page,
  compact = false,
  onDone,
}: Props) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [kind, setKind] = useState(defaultKind);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          kind,
          message,
          page:
            page ||
            (typeof window !== "undefined" ? window.location.pathname : ""),
        }),
      });
      const data = (await res.json()) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Falha ao enviar");
      setOk(true);
      setName("");
      setEmail("");
      setMessage("");
      onDone?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Falha ao enviar");
    } finally {
      setLoading(false);
    }
  }

  if (ok) {
    return (
      <div className="rounded-[14px] border border-gold/40 bg-gold/10 p-5 text-center">
        <p className="font-bold text-gold">Obrigado, Capitão anotou!</p>
        <p className="mt-2 text-sm text-muted">
          Lemos todas as sugestões. Se precisar de resposta, usamos o e-mail
          informado.
        </p>
        <button
          type="button"
          onClick={() => setOk(false)}
          className="mt-4 text-sm font-semibold text-white hover:text-gold"
        >
          Enviar outra
        </button>
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className={
        compact
          ? "space-y-3"
          : "space-y-4 rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5 md:p-7"
      }
    >
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-sm font-medium text-white">
          Nome
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5 text-white outline-none focus:border-gold"
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
            className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5 text-white outline-none focus:border-gold"
          />
        </label>
      </div>

      <fieldset>
        <legend className="text-sm font-medium text-white">Tipo</legend>
        <div className="mt-2 grid gap-2">
          {FEEDBACK_KINDS.map((k) => (
            <label
              key={k.value}
              className={`flex cursor-pointer items-start gap-3 rounded-md border px-3 py-2.5 transition ${
                kind === k.value
                  ? "border-gold bg-gold/10"
                  : "border-[#333] hover:border-gold/50"
              }`}
            >
              <input
                type="radio"
                name="kind"
                value={k.value}
                checked={kind === k.value}
                onChange={() => setKind(k.value)}
                className="mt-1 accent-[#ffc107]"
              />
              <span>
                <span className="block text-sm font-semibold text-white">
                  {k.label}
                </span>
                <span className="block text-xs text-muted">{k.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </fieldset>

      <label className="block text-sm font-medium text-white">
        Sua sugestão ou reclamação
        <textarea
          required
          minLength={8}
          maxLength={2000}
          rows={compact ? 4 : 5}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Ex.: quero um organizador de cabos com LED, faltou filtro por preço, o massageador veio sem manual…"
          className="mt-1.5 w-full rounded-md border border-[#333] bg-[#111] px-3 py-2.5 text-white outline-none focus:border-gold"
        />
      </label>

      {error ? (
        <p className="rounded-md border border-red-500/40 bg-red-500/10 px-3 py-2 text-sm text-red-300">
          {error}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black hover:bg-gold-deep disabled:opacity-60"
      >
        {loading ? "Enviando…" : "Enviar sugestão"}
      </button>
    </form>
  );
}
