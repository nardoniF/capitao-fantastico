import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { products } from "@/data/products";

export const metadata: Metadata = {
  title: "Produtos",
};

export default function ProductsPage() {
  return (
    <div className="bg-bg py-14 md:py-20">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Catálogo
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-bold text-white md:text-5xl">
          Produtos
        </h1>
        <p className="mt-4 max-w-xl text-muted">
          Utilidades do lar e tecnologia inteligente — seleção Capitão Fantástico.
        </p>
        <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
