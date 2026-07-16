import type { ClickEvent } from "@/lib/store-types";

const TZ = "America/Sao_Paulo";

export type ClickTreeStep = ClickEvent & { hora: string };

export type ClickTreeSession = {
  key: string;
  label: string;
  events: ClickTreeStep[];
};

export type ClickTreeVisitor = {
  key: string;
  label: string;
  meta: ClickEvent;
  count: number;
  sessions: ClickTreeSession[];
};

export type ClickTreeDay = {
  key: string;
  label: string;
  count: number;
  visitors: ClickTreeVisitor[];
};

export type ClickTreeMonth = {
  key: string;
  name: string;
  count: number;
  days: ClickTreeDay[];
};

export type ClickTreeYear = {
  year: number;
  count: number;
  months: ClickTreeMonth[];
};

export type ClickTree = {
  years: ClickTreeYear[];
  total: number;
};

function tsOf(c: ClickEvent) {
  const t = c.clientTs || c.createdAt;
  return new Date(t).getTime();
}

function brDateParts(ts: number) {
  const d = new Date(ts);
  const year = d.toLocaleString("pt-BR", { timeZone: TZ, year: "numeric" });
  const monthNum = d.toLocaleString("pt-BR", { timeZone: TZ, month: "2-digit" });
  const monthName = d.toLocaleString("pt-BR", { timeZone: TZ, month: "long" });
  const dateKey = d.toLocaleDateString("pt-BR", { timeZone: TZ });
  const dayLabel = d.toLocaleDateString("pt-BR", {
    timeZone: TZ,
    weekday: "short",
    day: "2-digit",
    month: "short",
  });
  return { year: Number(year), monthNum, monthName, dateKey, dayLabel };
}

function horaBr(ts: number) {
  return new Date(ts).toLocaleTimeString("pt-BR", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function visitorKey(c: ClickEvent) {
  if (c.visitanteId) return `vid:${c.visitanteId}`;
  if (c.ipPrefix) return `ipp:${c.ipPrefix}`;
  return `unk:${c.sessaoVisita || c.id}`;
}

export function visitorLabel(c: ClickEvent) {
  const geo = [c.cidade, c.estado, c.pais].filter(Boolean).join(", ");
  const ip = c.ipPrefix || "";
  if (c.visitanteId) {
    const short = c.visitanteId.slice(0, 12);
    if (geo) return `${short}… · ${geo}`;
    if (ip) return `${short}… · ${ip}`;
    return `Visitante ${short}…`;
  }
  if (geo) return geo;
  if (ip) return `IP ${ip}`;
  return "Visitante anônimo";
}

function stepLabel(c: ClickEvent) {
  const cat = c.destinoLabel || c.destino || c.tipo;
  const rot = c.rotulo ? ` — ${c.rotulo}` : "";
  return `${cat}${rot}`.slice(0, 120);
}

export function buildClicksTree(clicks: ClickEvent[]): ClickTree {
  type Raw = {
    count: number;
    months: Record<
      string,
      {
        name: string;
        count: number;
        days: Record<
          string,
          {
            label: string;
            count: number;
            visitors: Record<
              string,
              {
                meta: ClickEvent;
                count: number;
                sessions: Record<string, ClickEvent[]>;
              }
            >;
          }
        >;
      }
    >;
  };

  const tree: Record<number, Raw> = {};

  for (const c of clicks) {
    const ts = tsOf(c);
    if (!ts) continue;
    const { year, monthNum, monthName, dateKey, dayLabel } = brDateParts(ts);
    const vKey = visitorKey(c);
    const sKey = c.sessaoVisita || "sem_sessao";

    if (!tree[year]) tree[year] = { count: 0, months: {} };
    const y = tree[year];
    if (!y.months[monthNum])
      y.months[monthNum] = { name: monthName, count: 0, days: {} };
    const m = y.months[monthNum];
    if (!m.days[dateKey])
      m.days[dateKey] = { label: dayLabel, count: 0, visitors: {} };
    const d = m.days[dateKey];
    if (!d.visitors[vKey])
      d.visitors[vKey] = { meta: c, count: 0, sessions: {} };
    const v = d.visitors[vKey];
    if (!v.sessions[sKey]) v.sessions[sKey] = [];
    v.sessions[sKey].push(c);
    v.count++;
    d.count++;
    m.count++;
    y.count++;
  }

  const years: ClickTreeYear[] = Object.entries(tree)
    .map(([yearStr, y]) => {
      const months: ClickTreeMonth[] = Object.entries(y.months)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([monthNum, m]) => {
          const days: ClickTreeDay[] = Object.entries(m.days)
            .sort(([a], [b]) => {
              const pa = a.split("/").reverse().join("");
              const pb = b.split("/").reverse().join("");
              return pb.localeCompare(pa);
            })
            .map(([dateKey, d]) => {
              const visitors: ClickTreeVisitor[] = Object.entries(d.visitors)
                .map(([vKey, v]) => {
                  const sessions: ClickTreeSession[] = Object.entries(
                    v.sessions,
                  ).map(([sKey, events]) => {
                    const sorted = [...events].sort((a, b) => {
                      const sa = a.sequencia || 0;
                      const sb = b.sequencia || 0;
                      if (sa && sb && sa !== sb) return sa - sb;
                      return tsOf(a) - tsOf(b);
                    });
                    return {
                      key: sKey,
                      label:
                        sKey === "sem_sessao"
                          ? "Sessão única"
                          : `Visita ${sKey.slice(0, 8)}…`,
                      events: sorted.map((ev) => ({
                        ...ev,
                        hora: horaBr(tsOf(ev)),
                      })),
                    };
                  });
                  return {
                    key: vKey,
                    label: visitorLabel(v.meta),
                    meta: v.meta,
                    count: v.count,
                    sessions,
                  };
                });
              return {
                key: dateKey,
                label: d.label,
                count: d.count,
                visitors,
              };
            });
          return {
            key: monthNum,
            name: m.name.charAt(0).toUpperCase() + m.name.slice(1),
            count: m.count,
            days,
          };
        });
      return { year: Number(yearStr), count: y.count, months };
    })
    .sort((a, b) => b.year - a.year);

  return {
    years,
    total: clicks.length,
  };
}

export { stepLabel };

export function clickStats(clicks: ClickEvent[]) {
  const todayKey = new Date().toLocaleDateString("pt-BR", { timeZone: TZ });
  const byDestino: Record<string, number> = {};
  let todayCount = 0;

  for (const c of clicks.slice(0, 500)) {
    const key = new Date(c.clientTs || c.createdAt).toLocaleDateString(
      "pt-BR",
      { timeZone: TZ },
    );
    if (key === todayKey) todayCount++;
    const d = c.destino || c.tipo || "outro";
    byDestino[d] = (byDestino[d] || 0) + 1;
  }

  return { todayCount, byDestino };
}
