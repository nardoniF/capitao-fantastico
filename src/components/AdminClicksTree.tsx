"use client";

import type { ClickTree } from "@/lib/clicks-tree";
import { stepLabel } from "@/lib/clicks-tree";
import type { ClickEvent } from "@/lib/store-types";

function geoPill(c: ClickEvent) {
  const parts = [c.cidade, c.estado, c.pais].filter(Boolean);
  if (parts.length) return parts.join(", ");
  if (c.pais) return c.pais;
  if (c.ipPrefix) return c.ipPrefix;
  return "—";
}

function destinoBadge(c: ClickEvent) {
  const d = c.destino || c.tipo;
  const colors: Record<string, string> = {
    pageview: "bg-blue-500/20 text-blue-300",
    whatsapp: "bg-emerald-500/20 text-emerald-300",
    checkout: "bg-gold/20 text-gold",
    produtos: "bg-violet-500/20 text-violet-300",
  };
  const cls = colors[d] || "bg-[#333] text-[#ccc]";
  return (
    <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${cls}`}>
      {c.destinoLabel || d}
    </span>
  );
}

type Props = {
  tree: ClickTree;
  todayCount?: number;
  total?: number;
  byDestino?: Record<string, number>;
};

export function AdminClicksTree({ tree, todayCount, total, byDestino }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 text-sm">
        <span className="rounded-md border border-[#333] bg-[#141414] px-3 py-2 text-muted">
          Hoje: <strong className="text-white">{todayCount ?? 0}</strong>
        </span>
        <span className="rounded-md border border-[#333] bg-[#141414] px-3 py-2 text-muted">
          Amostra: <strong className="text-white">{tree.total}</strong>
          {total != null ? ` / ${total} no banco` : ""}
        </span>
        {byDestino
          ? Object.entries(byDestino)
              .slice(0, 6)
              .map(([k, n]) => (
                <span
                  key={k}
                  className="rounded-md border border-[#333] bg-[#141414] px-3 py-2 text-xs text-muted"
                >
                  {k}: <strong className="text-gold">{n}</strong>
                </span>
              ))
          : null}
      </div>

      <div className="clicks-tree max-h-[70vh] overflow-auto rounded-[14px] border border-[#333] bg-[#111] p-4 text-sm">
        {tree.years.length === 0 ? (
          <p className="text-muted">Nenhum clique registrado ainda.</p>
        ) : (
          tree.years.map((y) => (
            <details key={y.year} className="clicks-tree-node mb-2" open>
              <summary className="cursor-pointer list-none font-bold text-gold">
                ▶ {y.year}{" "}
                <span className="text-xs font-normal text-muted">
                  ({y.count} eventos)
                </span>
              </summary>
              <div className="ml-3 mt-2 border-l border-[#333] pl-3">
                {y.months.map((m) => (
                  <details key={m.key} className="clicks-tree-node mb-2">
                    <summary className="cursor-pointer list-none text-white">
                      ▶ {m.name}{" "}
                      <span className="text-xs text-muted">({m.count})</span>
                    </summary>
                    <div className="ml-3 mt-1 border-l border-[#333] pl-3">
                      {m.days.map((d) => (
                        <details key={d.key} className="clicks-tree-node mb-2">
                          <summary className="cursor-pointer list-none text-[#ddd]">
                            ▶ {d.label}{" "}
                            <span className="text-xs text-muted">
                              ({d.count} · {d.visitors.length} visitante
                              {d.visitors.length === 1 ? "" : "s"})
                            </span>
                          </summary>
                          <div className="ml-3 mt-1 border-l border-[#333] pl-3">
                            {d.visitors.map((v) => (
                              <details
                                key={v.key}
                                className="clicks-tree-node mb-2"
                              >
                                <summary className="cursor-pointer list-none">
                                  <span className="text-emerald-400/90">
                                    {v.label}
                                  </span>{" "}
                                  <span className="text-xs text-muted">
                                    ({v.count})
                                  </span>
                                </summary>
                                <div className="ml-3 mt-1">
                                  {v.sessions.map((s) => (
                                    <details
                                      key={s.key}
                                      className="clicks-tree-node mb-2"
                                    >
                                      <summary className="cursor-pointer list-none text-xs text-muted">
                                        {s.label} · {s.events.length} passo
                                        {s.events.length === 1 ? "" : "s"}
                                      </summary>
                                      <ol className="mt-2 space-y-1.5 pl-0">
                                        {s.events.map((ev, i) => (
                                          <li
                                            key={ev.id}
                                            className="flex flex-wrap items-center gap-2 rounded border border-[#2a2a2a] bg-[#1a1a1a] px-2 py-1.5"
                                          >
                                            <span className="w-6 text-center text-[10px] font-bold text-gold">
                                              {ev.sequencia || i + 1}
                                            </span>
                                            <span className="font-mono text-[11px] text-muted">
                                              {ev.hora}
                                            </span>
                                            {destinoBadge(ev)}
                                            <span className="flex-1 text-white">
                                              {stepLabel(ev)}
                                            </span>
                                            <span className="text-[10px] text-muted">
                                              {geoPill(ev)}
                                            </span>
                                          </li>
                                        ))}
                                      </ol>
                                    </details>
                                  ))}
                                </div>
                              </details>
                            ))}
                          </div>
                        </details>
                      ))}
                    </div>
                  </details>
                ))}
              </div>
            </details>
          ))
        )}
      </div>
    </div>
  );
}
