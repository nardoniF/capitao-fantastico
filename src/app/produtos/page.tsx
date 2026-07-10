import type { Metadata } from "next";
import { ProductCard } from "@/components/ProductCard";
import { listActiveProducts } from "@/lib/store-db";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos",
};

export default async function ProductsPage() {
  const products = await listActiveProducts();

  return (
    <div className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
          Loja Oficial
        </h1>
        <p className="mt-2 text-[#888]">
          {products.length} produtos · Pix e cartão · envio para todo o Brasil
        </p>
        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      </div>
    </div>
  );
}
