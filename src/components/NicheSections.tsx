export function NicheSections() {
  return (
    <>
      <section id="lar" className="border-b border-line bg-bg py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-12 md:gap-12 md:px-8">
          <div className="md:col-span-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              Utilidades do lar
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-white md:text-4xl">
              Utilidades que resolvem o dia a dia
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted md:col-span-7 md:pt-8">
            Organização, limpeza e praticidade com peças escolhidas para
            funcionar de verdade — sem firula.
          </p>
        </div>
      </section>

      <section id="tech" className="border-b border-line bg-card py-20 md:py-28">
        <div className="mx-auto grid max-w-6xl gap-10 px-5 md:grid-cols-12 md:gap-12 md:px-8">
          <div className="md:col-span-5">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              Tecnologia inteligente
            </p>
            <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-white md:text-4xl">
              Lar inteligente, no seu ritmo
            </h2>
          </div>
          <p className="text-lg leading-relaxed text-muted md:col-span-7 md:pt-8">
            Luz, tomadas, sensores e monitoramento que você controla pelo
            celular — instalação simples e uso no dia a dia.
          </p>
        </div>
      </section>
    </>
  );
}
