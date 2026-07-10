export function NicheSections() {
  return (
    <>
      <section id="lar" className="border-b border-ink/10 bg-paper py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-12 md:gap-12 md:px-8">
          <div className="md:col-span-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal-deep">
              Utilidades do lar
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-ink md:text-4xl">
              Utilidades que resolvem o dia a dia
            </h2>
          </div>
          <p className="md:col-span-7 md:pt-8 text-lg leading-relaxed text-ink-soft/90">
            Organização, limpeza e praticidade com peças escolhidas para
            funcionar de verdade — sem firula, sem produto que vira enfeite.
          </p>
        </div>
      </section>

      <section id="tech" className="bg-ink py-20 text-white md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-12 md:gap-12 md:px-8">
          <div className="md:col-span-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aqua">
              Tecnologia inteligente
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight md:text-4xl">
              Lar inteligente, no seu ritmo
            </h2>
          </div>
          <p className="md:col-span-7 md:pt-8 text-lg leading-relaxed text-white/75">
            Luz, tomadas, sensores e monitoramento que você controla pelo
            celular — instalação simples e uso no dia a dia, não só no unboxing.
          </p>
        </div>
      </section>
    </>
  );
}
