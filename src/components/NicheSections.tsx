import Link from "next/link";
import {
  categoryLabels,
  categoryOrder,
  type ProductCategory,
} from "@/data/products";

const categoryHints: Record<ProductCategory, string> = {
  gadgets: "Cabos, carregadores, rastreadores e limpeza tech",
  auto: "Compressor, organização e utilidades para o carro",
  pet: "Bebedouro, escovas, unhas e cuidado animal",
  kids: "Segurança e praticidade para os pais",
  beauty: "Beleza e cuidados que facilitam a rotina",
  casa: "Organização, sensores e utilidades do lar",
  fit: "Massagem, postura e bem-estar no dia a dia",
};

export function NicheSections() {
  return (
    <section id="categorias" className="border-b border-line bg-bg py-14 md:py-16">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Estrutura da loja
        </p>
        <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
          Mundos do Capitão
        </h2>
        <p className="mt-2 max-w-2xl text-[#888]">
          Gadgets, auto, pet, kids, beauty, casa e fit — sem perder a identidade:
          só o que resolve.
        </p>
        <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {categoryOrder.map((cat) => (
            <Link
              key={cat}
              href={`/produtos?cat=${cat}`}
              className="rounded-[14px] border border-[#333] bg-[#1a1a1a] p-5 transition hover:border-gold"
            >
              <h3 className="font-bold text-gold">{categoryLabels[cat]}</h3>
              <p className="mt-2 text-sm leading-snug text-[#888]">
                {categoryHints[cat]}
              </p>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
