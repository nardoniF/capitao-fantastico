"use client";

import {
  PIPELINE_STAGES,
  pipelineIndex,
  type PipelineStage,
  type TrackingEvent,
} from "@/lib/order-tracking";

export function DeliveryTimeline({
  orderId,
  currentStage,
  events,
  trackingCode,
}: {
  orderId: string;
  currentStage: PipelineStage | null;
  events: TrackingEvent[];
  trackingCode?: string | null;
}) {
  const active = pipelineIndex(currentStage);

  return (
    <div>
      <p className="font-[family-name:var(--font-syne)] text-lg font-bold text-white">
        Pedido #{orderId}
      </p>
      <p className="mt-1 text-xs text-muted">
        Atualização automática · sem consultar site dos Correios
        {trackingCode ? (
          <>
            {" "}
            · <span className="font-mono text-gold">{trackingCode}</span>
          </>
        ) : null}
      </p>

      <ul className="mt-8 space-y-2">
        {PIPELINE_STAGES.map((step, idx) => {
          const done = active >= 0 && idx <= active;
          const current = idx === active;
          return (
            <li
              key={step.key}
              className={`flex items-center gap-3 text-sm ${
                done ? "text-white" : "text-muted/50"
              }`}
            >
              <span className={done ? "opacity-100" : "opacity-30"}>
                {done ? "🟢" : "⚪"}
              </span>
              <span className={current ? "font-semibold text-gold" : ""}>
                {step.label}
              </span>
              {done ? (
                <span className="text-xs text-emerald-400">✔</span>
              ) : null}
            </li>
          );
        })}
      </ul>

      {events.length > 0 ? (
        <div className="mt-10 space-y-0 border-t border-line pt-8">
          <p className="mb-4 text-xs font-semibold uppercase tracking-wider text-gold">
            Histórico
          </p>
          {[...events].reverse().map((ev, idx) => (
            <div key={`${ev.at}-${idx}`}>
              <div className="flex gap-4 py-3">
                <div className="w-16 shrink-0 text-xs text-muted">
                  {formatDay(ev.at)}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-white">
                    {ev.label}{" "}
                    <span className="text-emerald-400">✔</span>
                  </p>
                  {ev.detail ? (
                    <p className="text-xs text-muted">{ev.detail}</p>
                  ) : null}
                  {ev.location ? (
                    <p className="text-xs text-muted">{ev.location}</p>
                  ) : null}
                </div>
              </div>
              {idx < events.length - 1 ? (
                <div className="ml-20 border-t border-dashed border-line/80" />
              ) : null}
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}

function formatDay(iso: string) {
  try {
    return new Date(iso).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "2-digit",
    });
  } catch {
    return "—";
  }
}
