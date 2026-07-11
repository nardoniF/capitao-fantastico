"use client";

import { useState } from "react";
import { whatsappUrl } from "@/lib/site-config";

export function ContactForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "ok" | "err">("idle");
  const [info, setInfo] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setStatus("loading");
    setInfo(null);
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, message }),
      });
      const data = (await res.json()) as { error?: string; message?: string };
      if (!res.ok) throw new Error(data.error || "Falha");
      setStatus("ok");
      setInfo(data.message || "Mensagem enviada.");
      setName("");
      setEmail("");
      setMessage("");
    } catch (err) {
      setStatus("err");
      setInfo(err instanceof Error ? err.message : "Falha no envio");
    }
  }

  return (
    <form
      onSubmit={(e) => void onSubmit(e)}
      className="mt-10 space-y-4 rounded-xl border border-line bg-card p-6"
    >
      <p className="text-sm text-muted">
        Mensagem vai direto para a equipe Capitão Fantástico — suporte em
        português.
      </p>
      <label className="block text-sm text-white">
        Nome
        <input
          required
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white"
        />
      </label>
      <label className="block text-sm text-white">
        Seu e-mail
        <input
          required
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoComplete="email"
          className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white"
        />
      </label>
      <label className="block text-sm text-white">
        Mensagem
        <textarea
          required
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          rows={4}
          className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white"
        />
      </label>
      {info ? (
        <p
          className={`text-sm ${
            status === "err" ? "text-red-400" : "text-gold"
          }`}
        >
          {info}
        </p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={status === "loading"}
          className="rounded-md bg-gold px-6 py-3 text-sm font-bold text-black hover:bg-gold-deep disabled:opacity-50"
        >
          {status === "loading" ? "Enviando…" : "Enviar"}
        </button>
        <a
          href={whatsappUrl("Olá! Quero falar com o suporte do Capitão Fantástico.")}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md border border-line px-6 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
        >
          Preferir WhatsApp
        </a>
      </div>
    </form>
  );
}
