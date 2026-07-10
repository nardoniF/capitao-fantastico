import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { categoryLabels, categoryOrder } from "@/data/products";
import { listActiveProducts } from "@/lib/store-db";

export async function ProductShowcase() {
  const products = await listActiveProducts();
  const novidades = products.filter((p) => p.isNew).slice(0, 8);
  const restByCat = categoryOrder
    .map((cat) => ({
      cat,
      items: products.filter((p) => p.category === cat).slice(0, 4),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <section id="novidades" className="bg-bg py-14 md:py-16">
        <div className="mx-auto max-w-[1200px] px-5 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Lançamentos
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
            Novidades do Capitão
          </h2>
          <p className="mt-2 text-[#888]">Os que acabaram de ganhar o selo.</p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(novidades.length ? novidades : products.slice(0, 4)).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      <section id="vitrine" className="border-t border-line bg-card py-14 md:py-16">
        <div className="mx-auto max-w-[1200px] px-5 md:px-6">
          <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
            Aprovados pelo Capitão
          </h2>
          <p className="mt-2 text-[#888]">Curadoria por categoria</p>

          <div className="mt-10 space-y-12">
            {restByCat.map(({ cat, items }) => (
              <div key={cat}>
                <div className="flex items-end justify-between gap-4">
                  <h3 className="font-[family-name:var(--font-syne)] text-xl font-bold text-gold">
                    {categoryLabels[cat]}
                  </h3>
                  <Link
                    href={`/produtos?cat=${cat}`}
                    className="text-sm font-semibold text-white/70 hover:text-gold"
                  >
                    Ver todos →
                  </Link>
                </div>
                <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-12 text-center">
            <Link
              href="/produtos"
              className="inline-flex rounded-md border border-gold px-6 py-3 text-sm font-bold text-gold hover:bg-gold hover:text-black"
            >
              Ver catálogo completo
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
