import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import { listActiveProducts } from "@/lib/store-db";

export async function ProductShowcase() {
  const products = await listActiveProducts();

  return (
    <section id="vitrine" className="bg-bg py-14 md:py-20">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
        <h2 className="font-[family-name:var(--font-syne)] text-2xl font-bold text-white md:text-3xl">
          Loja
        </h2>
        <p className="mt-2 text-[#888]">
          Utilidades do lar e tech · preços de venda drop
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div className="mt-10 text-center">
          <Link
            href="/produtos"
            className="inline-flex rounded-md border border-gold px-6 py-3 text-sm font-bold text-gold hover:bg-gold hover:text-black"
          >
            Ver catálogo completo
          </Link>
        </div>
      </div>
    </section>
  );
}
