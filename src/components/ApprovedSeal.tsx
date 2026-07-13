import { siteConfig } from "@/lib/site-config";
import {
  medalLabels,
  resolveChecks,
  type CaptainMedal,
} from "@/data/captain";

export function ApprovedSeal({
  compact = false,
  wide = false,
  score = siteConfig.captainScore,
  medals,
}: {
  compact?: boolean;
  /** Card horizontal de largura total — selo, nota, medalhas e garantias em um lugar só. */
  wide?: boolean;
  score?: number;
  medals?: CaptainMedal[];
}) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gold ring-1 ring-gold/50 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
        Aprovado
      </span>
    );
  }

  if (wide) {
    return (
      <div className="flex w-full flex-wrap items-center gap-x-6 gap-y-3 rounded-[14px] border border-gold/40 bg-gold/10 px-5 py-4 md:px-6">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-sm font-bold uppercase tracking-wide text-gold">
            Aprovado pelo Capitão
          </span>
          <span className="rounded bg-black/40 px-2 py-0.5 font-[family-name:var(--font-syne)] text-lg font-bold text-white">
            {score.toFixed(1).replace(".", ",")}
          </span>
          <span className="text-sm text-gold" aria-label="5 estrelas">
            ★★★★★
          </span>
        </div>
        {medals?.length ? (
          <div className="flex flex-wrap gap-2">
            {medals.map((m) => (
              <span
                key={m}
                className="rounded-md border border-gold/30 bg-black/30 px-2.5 py-1 text-xs font-semibold text-gold"
              >
                {medalLabels[m]}
              </span>
            ))}
          </div>
        ) : null}
        <ul className="flex flex-wrap gap-x-4 gap-y-1 md:ml-auto">
          {["Suporte em português", "Rastreio no site até chegar"].map((c) => (
            <li key={c} className="flex items-center gap-1.5 text-xs text-[#ccc]">
              <span className="text-gold" aria-hidden>
                ✓
              </span>
              {c}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="inline-flex max-w-xl flex-col gap-3.5 rounded-[14px] border border-gold/40 bg-gold/10 px-5 py-4">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-sm font-bold uppercase tracking-wide text-gold">
          Aprovado pelo Capitão
        </span>
        <span className="rounded bg-black/40 px-2 py-0.5 font-[family-name:var(--font-syne)] text-lg font-bold text-white">
          {score.toFixed(1).replace(".", ",")}
        </span>
        <span className="text-sm text-gold" aria-label="5 estrelas">
          ★★★★★
        </span>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1">
        {resolveChecks.map((c) => (
          <li key={c} className="flex items-center gap-1.5 text-xs text-[#ccc]">
            <span className="text-gold" aria-hidden>
              ✓
            </span>
            {c}
          </li>
        ))}
      </ul>
    </div>
  );
}
