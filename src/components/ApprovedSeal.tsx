export function ApprovedSeal({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-black/80 px-2 py-1 text-[10px] font-bold uppercase tracking-wide text-gold ring-1 ring-gold/50 backdrop-blur">
        <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden />
        Aprovado
      </span>
    );
  }

  return (
    <div className="inline-flex flex-wrap items-center gap-2 rounded-md border border-gold/40 bg-gold/10 px-3 py-2">
      <span className="inline-flex items-center gap-2 text-sm font-bold text-gold">
        <span className="h-2 w-2 rounded-full bg-emerald-400" aria-hidden />
        Aprovado pelo Capitão
      </span>
      <span className="text-xs text-[#888]">★★★★★</span>
    </div>
  );
}
