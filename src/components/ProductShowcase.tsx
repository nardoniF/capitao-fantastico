import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import {
  categoryLabels,
  categoryOrder,
  products as seedProducts,
} from "@/data/products";
import { listStorefrontProducts } from "@/lib/catalog";

export async function ProductShowcase() {
  const fromDb = await listStorefrontProducts();
  const products =
    fromDb.length > 0
      ? fromDb
      : seedProducts.map((p) => ({ ...p, image: p.image }));

  const novidades = products.filter((p) => p.isNew);
  const byCat = categoryOrder
    .map((cat) => ({
      cat,
      items: products.filter((p) => p.category === cat),
    }))
    .filter((g) => g.items.length > 0);

  return (
    <>
      <section id="novidades" className="bg-bg py-14 md:py-16">
        <div className="mx-auto max-w-[1200px] px-5 md:px-6">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
            Lançamentos da semana
          </p>
          <h2 className="mt-2 font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
            Novidades do Capitão
          </h2>
          <p className="mt-2 text-[#888]">
            {fromDb.length > 0
              ? "Seleção curada — só entra o que o Capitão aprova."
              : "Os que acabaram de ganhar o selo."}
          </p>
          <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {(novidades.length ? novidades : products.slice(0, 8)).map(
              (product) => (
                <ProductCard key={product.id} product={product} />
              ),
            )}
          </div>
        </div>
      </section>

      <section id="vitrine" className="border-t border-line bg-card py-14 md:py-16">
        <div className="mx-auto max-w-[1200px] space-y-14 px-5 md:px-6">
          {byCat.map(({ cat, items }) => (
            <div key={cat} id={cat}>
              <div className="flex flex-wrap items-end justify-between gap-4">
                <div>
                  <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-gold md:text-3xl">
                    {categoryLabels[cat]}
                  </h2>
                  <p className="mt-1 text-sm text-[#888]">
                    {items.length} produtos · Aprovados pelo Capitão
                  </p>
                </div>
                <Link
                  href={`/produtos?cat=${cat}`}
                  className="text-sm font-semibold text-white/70 hover:text-gold"
                >
                  Ver categoria →
                </Link>
              </div>
              <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {items.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            </div>
          ))}

          <div className="text-center">
            <Link
              href="/produtos"
              className="inline-flex rounded-md border border-gold px-6 py-3 text-sm font-bold text-gold hover:bg-gold hover:text-black"
            >
              Ver catálogo completo ({products.length})
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
