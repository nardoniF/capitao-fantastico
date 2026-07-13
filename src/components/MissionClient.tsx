"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { CaptainStrip } from "@/components/CaptainStrip";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

type State =
  | { kind: "idle" }
  | { kind: "loading" }
  | { kind: "done"; response: "ok" | "help"; already?: boolean; orderId: string }
  | { kind: "ask"; orderId: string; token: string }
  | { kind: "error"; message: string };

function MissionInner() {
  const params = useSearchParams();
  const [state, setState] = useState<State>({ kind: "idle" });

  const pedido = (params.get("pedido") || "").trim();
  const token = (params.get("t") || "").trim();
  const r = params.get("r");
  const done = params.get("done");
  const ja = params.get("ja") === "1";
  const erro = params.get("erro");

  useEffect(() => {
    if (erro) {
      setState({
        kind: "error",
        message: erro === "1" ? "Link incompleto." : erro,
      });
      return;
    }

    if (done === "ok" || done === "help") {
      setState({
        kind: "done",
        response: done,
        already: ja,
        orderId: pedido || "",
      });
      return;
    }

    if (pedido && token && (r === "ok" || r === "help")) {
      setState({ kind: "loading" });
      void fetch("/api/missao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pedido, t: token, r }),
      })
        .then(async (res) => {
          const data = (await res.json()) as {
            ok?: boolean;
            error?: string;
            response?: "ok" | "help";
            already?: boolean;
            orderId?: string;
          };
          if (!res.ok || !data.ok || !data.response) {
            setState({
              kind: "error",
              message: data.error || "Não foi possível registrar.",
            });
            return;
          }
          setState({
            kind: "done",
            response: data.response,
            already: data.already,
            orderId: data.orderId || pedido,
          });
        })
        .catch(() =>
          setState({ kind: "error", message: "Falha de rede. Tente de novo." }),
        );
      return;
    }

    if (pedido && token) {
      setState({ kind: "ask", orderId: pedido, token });
      return;
    }

    setState({ kind: "idle" });
  }, [pedido, token, r, done, ja, erro]);

  async function vote(response: "ok" | "help") {
    if (state.kind !== "ask") return;
    setState({ kind: "loading" });
    try {
      const res = await fetch("/api/missao", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          pedido: state.orderId,
          t: state.token,
          r: response,
        }),
      });
      const data = (await res.json()) as {
        ok?: boolean;
        error?: string;
        response?: "ok" | "help";
        already?: boolean;
        orderId?: string;
      };
      if (!res.ok || !data.ok || !data.response) {
        setState({
          kind: "error",
          message: data.error || "Não foi possível registrar.",
        });
        return;
      }
      setState({
        kind: "done",
        response: data.response,
        already: data.already,
        orderId: data.orderId || state.orderId,
      });
    } catch {
      setState({ kind: "error", message: "Falha de rede. Tente de novo." });
    }
  }

  return (
    <div className="bg-bg py-14 md:py-20">
      <div className="mx-auto max-w-lg px-5 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Índice de Missão
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
          Missão concluída?
        </h1>
        <div className="mt-6">
          <CaptainStrip message="Resposta rápida — o Capitão acompanha cada entrega." />
        </div>

        {state.kind === "loading" ? (
          <p className="mt-10 text-muted">Registrando sua resposta…</p>
        ) : null}

        {state.kind === "idle" ? (
          <p className="mt-10 text-sm leading-relaxed text-muted">
            Use o link do e-mail do pedido, ou abra o rastreio quando a entrega
            for confirmada. Assim o Capitão sabe se a missão deu certo.
          </p>
        ) : null}

        {state.kind === "error" ? (
          <div className="mt-10 rounded-[14px] border border-red-500/40 bg-red-950/30 p-5">
            <p className="text-sm text-red-200">{state.message}</p>
            <Link
              href="/contato"
              className="mt-4 inline-block text-sm font-semibold text-gold hover:underline"
            >
              Falar com o suporte
            </Link>
          </div>
        ) : null}

        {state.kind === "ask" ? (
          <div className="mt-10 space-y-4">
            <p className="text-sm text-muted">
              Pedido <span className="font-mono text-white">{state.orderId}</span>
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <button
                type="button"
                onClick={() => void vote("ok")}
                className="rounded-md bg-gold px-5 py-4 text-sm font-bold text-black hover:bg-gold-deep"
              >
                👍 Sim, deu tudo certo
              </button>
              <button
                type="button"
                onClick={() => void vote("help")}
                className="rounded-md border border-white/25 px-5 py-4 text-sm font-semibold text-white hover:border-gold hover:text-gold"
              >
                👎 Não, preciso de ajuda
              </button>
            </div>
          </div>
        ) : null}

        {state.kind === "done" && state.response === "ok" ? (
          <div className="mt-10 rounded-[14px] border border-gold/40 bg-card p-6">
            <p className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              Missão concluída 👍
            </p>
            <p className="mt-2 text-sm text-muted">
              {state.already
                ? "Você já tinha respondido — obrigado de novo."
                : "Obrigado. O Capitão anota no Índice de Missão."}
              {state.orderId ? (
                <>
                  {" "}
                  Pedido <span className="font-mono text-white">{state.orderId}</span>.
                </>
              ) : null}
            </p>
            <Link
              href="/produtos"
              className="mt-6 inline-block rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep"
            >
              Descobrir mais produtos
            </Link>
          </div>
        ) : null}

        {state.kind === "done" && state.response === "help" ? (
          <div className="mt-10 rounded-[14px] border border-line bg-card p-6">
            <p className="font-[family-name:var(--font-syne)] text-xl font-bold text-white">
              O Capitão vai ajudar 👎
            </p>
            <p className="mt-2 text-sm text-muted">
              {state.already
                ? "Já registramos sua necessidade de ajuda."
                : "Registramos no Índice de Missão. Fale conosco agora — suporte em português."}
            </p>
            <a
              href={whatsappUrl(
                `Olá! Pedido ${state.orderId || ""} — preciso de ajuda após a entrega na ${siteConfig.brand}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-6 inline-block rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep"
            >
              Abrir WhatsApp
            </a>
          </div>
        ) : null}
      </div>
    </div>
  );
}

export function MissionClient() {
  return (
    <Suspense
      fallback={
        <div className="bg-bg py-20 text-center text-muted">Carregando…</div>
      }
    >
      <MissionInner />
    </Suspense>
  );
}
