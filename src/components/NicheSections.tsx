export function NicheSections() {
  return (
    <>
      <section id="lar" className="border-b border-line bg-bg py-14 md:py-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-5 md:grid-cols-2 md:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              Casa · cozinha · pet
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
              Utilidades que resolvem
            </h2>
          </div>
          <p className="text-base leading-relaxed text-[#888] md:pt-6">
            Limpeza, organização, pet e cozinha — produtos práticos para o dia a
            dia.
          </p>
        </div>
      </section>

      <section id="tech" className="border-b border-line bg-card py-14 md:py-16">
        <div className="mx-auto grid max-w-[1200px] gap-6 px-5 md:grid-cols-2 md:px-6">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
              Tech · smart home · escritório
            </p>
            <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
              Gadgets que vendem
            </h2>
          </div>
          <p className="text-base leading-relaxed text-[#888] md:pt-6">
            Gadgets, sensores e setup — tecnologia útil, sem complicação.
          </p>
        </div>
      </section>
    </>
  );
}
