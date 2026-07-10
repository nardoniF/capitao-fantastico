export function NicheSections() {
  return (
    <>
      <section id="lar" className="border-b border-line bg-bg py-14 md:py-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-5 md:grid-cols-2 md:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              Utilidades do lar
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
              Utilidades que resolvem
            </h2>
          </div>
          <p className="text-base leading-relaxed text-[#888] md:pt-6">
            Organização e limpeza com peças práticas — sem firula.
          </p>
        </div>
      </section>

      <section id="tech" className="border-b border-line bg-card py-14 md:py-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-5 md:grid-cols-2 md:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              Tecnologia inteligente
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
              Lar inteligente, no seu ritmo
            </h2>
          </div>
          <p className="text-base leading-relaxed text-[#888] md:pt-6">
            Luz, tomadas e sensores que você controla pelo celular.
          </p>
        </div>
      </section>
    </>
  );
}
