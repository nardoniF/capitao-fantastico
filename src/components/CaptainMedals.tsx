import { medalLabels, type CaptainMedal } from "@/data/captain";

export function CaptainMedals({
  medals = ["escolhaCapitao"],
}: {
  medals?: CaptainMedal[];
}) {
  if (!medals.length) return null;
  return (
    <div className="flex flex-wrap gap-2.5">
      {medals.map((m) => (
        <span
          key={m}
          className="rounded-md border border-[#333] bg-[#141414] px-2.5 py-1 text-xs font-semibold text-gold"
        >
          {medalLabels[m]}
        </span>
      ))}
    </div>
  );
}

/** Heurística simples de medalhas a partir do produto. */
export function medalsForProduct(opts: {
  approved?: boolean;
  isNew?: boolean;
  rating?: number;
  price?: number;
}): CaptainMedal[] {
  const out: CaptainMedal[] = [];
  if (opts.approved) out.push("escolhaCapitao");
  if ((opts.rating ?? 0) >= 4.8) out.push("nota10");
  if (opts.isNew) out.push("viral");
  if ((opts.price ?? 999) < 120) out.push("custoBeneficio");
  return out.slice(0, 3);
}
