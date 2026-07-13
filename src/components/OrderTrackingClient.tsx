"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import {
  TRACKING_STEPS,
  externalTrackingUrl,
  stepIndex,
  statusLabel,
  type TrackingPublic,
} from "@/lib/order-tracking";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

export function OrderTrackingClient({
  initialPedido,
}: {
  initialPedido?: string;
}) {
  const [pedido, setPedido] = useState(initialPedido || "");
  const [query, setQuery] = useState(initialPedido || "");
  const [data, setData] = useState<TrackingPublic | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [pulse, setPulse] = useState(false);

  const load = useCallback(async (num: string, silent = false) => {
    if (!num.trim()) return;
    if (!silent) setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/orders/tracking?pedido=${encodeURIComponent(num.trim())}`,
        { cache: "no-store" },
      );
      const json = await res.json();
      if (!res.ok) {
        setData(null);
        setError(json.error || "Não encontrado");
        return;
      }
      setData(json as TrackingPublic);
      setPulse(true);
      setTimeout(() => setPulse(false), 900);
    } catch {
      setError("Falha ao consultar. Tente de novo.");
    } finally {
      if (!silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (initialPedido) void load(initialPedido);
  }, [initialPedido, load]);

  useEffect(() => {
    if (!data || data.delivered) return;
    const id = setInterval(() => void load(data.orderNumber, true), 60_000);
    return () => clearInterval(id);
  }, [data, load]);

  const active = data
    ? stepIndex(data.status, Boolean(data.trackingCode))
    : -1;

  return (
    <div className="mx-auto max-w-2xl px-5 py-12 md:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
        Rastreio
      </p>
      <h1 className="mt-2 font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
        Acompanhe seu pedido
      </h1>
      <p className="mt-3 text-muted">
        Suporte em português até chegar. O status atualiza sozinho quando o
        envio avança — como um sensor ao vivo do seu pedido.
      </p>

      <form
        className="mt-8 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          setQuery(pedido);
          void load(pedido);
          const url = new URL(window.location.href);
          url.searchParams.set("pedido", pedido.trim());
          window.history.replaceState({}, "", url.toString());
        }}
      >
        <input
          value={pedido}
          onChange={(e) => setPedido(e.target.value)}
          placeholder="Número do pedido"
          className="min-w-[200px] flex-1 rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
        />
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep disabled:opacity-50"
        >
          {loading ? "Buscando…" : "Consultar"}
        </button>
      </form>

      {error ? <p className="mt-4 text-sm text-red-400">{error}</p> : null}

      {data ? (
        <div className="mt-10">
          <div
            className={`rounded-[14px] border border-[#333] bg-[#141414] p-5 transition ${
              pulse ? "ring-2 ring-gold/60" : ""
            }`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="font-mono text-sm text-gold">{data.orderNumber}</p>
              <p className="text-sm font-semibold text-white">
                {statusLabel(data.status)}
              </p>
            </div>
            {data.trackingCode ? (
              <p className="mt-2 text-sm text-muted">
                Código:{" "}
                <span className="font-mono text-white">{data.trackingCode}</span>
                {data.trackingCarrier
                  ? ` · ${data.trackingCarrier}`
                  : null}
                {externalTrackingUrl(
                  data.trackingCode,
                  data.trackingCarrier,
                ) ? (
                  <>
                    {" · "}
                    <a
                      href={
                        externalTrackingUrl(
                          data.trackingCode,
                          data.trackingCarrier,
                        )!
                      }
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-gold hover:underline"
                    >
                      Abrir rastreio externo
                    </a>
                  </>
                ) : null}
              </p>
            ) : (
              <p className="mt-2 text-sm text-muted">
                Rastreio aparece aqui assim que o pedido for despachado.
              </p>
            )}
            <p className="mt-1 text-xs text-muted">
              Atualizado{" "}
              {new Date(data.updatedAt).toLocaleString("pt-BR")}
            </p>
          </div>

          {/* Sensor / timeline */}
          <ol className="mt-8 space-y-0">
            {TRACKING_STEPS.map((step, i) => {
              const done = i <= active;
              const current = i === active;
              return (
                <li key={step.key} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <span
                      className={`flex h-3.5 w-3.5 rounded-full ${
                        current
                          ? "bg-gold shadow-[0_0_12px_rgba(255,193,7,0.8)]"
                          : done
                            ? "bg-gold/70"
                            : "bg-[#333]"
                      } ${current ? "animate-pulse" : ""}`}
                    />
                    {i < TRACKING_STEPS.length - 1 ? (
                      <span
                        className={`my-1 w-px flex-1 min-h-6 ${
                          i < active ? "bg-gold/50" : "bg-[#333]"
                        }`}
                      />
                    ) : null}
                  </div>
                  <p
                    className={`pb-5 text-sm ${
                      current
                        ? "font-semibold text-gold"
                        : done
                          ? "text-white"
                          : "text-muted"
                    }`}
                  >
                    {step.label}
                  </p>
                </li>
              );
            })}
          </ol>

          {data.events.length ? (
            <div className="mt-4 rounded-[14px] border border-[#333] bg-black/40 p-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-gold">
                Histórico
              </p>
              <ul className="mt-3 space-y-3">
                {[...data.events].reverse().map((ev, idx) => (
                  <li key={`${ev.at}-${idx}`} className="text-sm">
                    <p className="font-medium text-white">{ev.label}</p>
                    {ev.detail ? (
                      <p className="text-muted">{ev.detail}</p>
                    ) : null}
                    <p className="text-xs text-muted/80">
                      {new Date(ev.at).toLocaleString("pt-BR")}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={whatsappUrl(
                `Olá! Quero suporte sobre o pedido ${data.orderNumber} na ${siteConfig.brand}.`,
              )}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep"
            >
              Suporte em português
            </a>
            <Link
              href="/produtos"
              className="rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
            >
              Continuar comprando
            </Link>
          </div>
        </div>
      ) : query && !loading && !error ? null : null}
    </div>
  );
}
