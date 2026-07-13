import type { Metadata } from "next";
import Link from "next/link";
import { ProductCard } from "@/components/ProductCard";
import {
  categoryLabels,
  categoryOrder,
  type ProductCategory,
} from "@/data/products";
import { listStorefrontProducts } from "@/lib/catalog";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Produtos",
};

type Props = {
  searchParams: Promise<{ cat?: string; novidades?: string }>;
};

function isCategory(v: string | undefined): v is ProductCategory {
  return Boolean(v && categoryOrder.includes(v as ProductCategory));
}

export default async function ProductsPage({ searchParams }: Props) {
  const q = await searchParams;
  const fromDb = await listStorefrontProducts();
  // Com banco ligado, nunca mascara vitrine com seed demo (sem estoque ≠ fake catalog)
  const products = fromDb;
  const onlyNew = q.novidades === "1";
  const cat = isCategory(q.cat) ? q.cat : null;

  let filtered = products;
  if (onlyNew) filtered = filtered.filter((p) => p.isNew);
  if (cat) filtered = filtered.filter((p) => p.category === cat);

  const title = onlyNew
    ? "Novidades do Capitão"
    : cat
      ? categoryLabels[cat]
      : "Loja Oficial";

  return (
    <div className="bg-bg py-10 md:py-14">
      <div className="mx-auto max-w-[1200px] px-5 md:px-6">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
          {title}
        </h1>
        <p className="mt-2 text-[#888]">
          {filtered.length} produtos · Só entra o que o Capitão aprova
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          <Link
            href="/produtos"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              !cat && !onlyNew
                ? "bg-gold text-black"
                : "border border-line text-muted hover:border-gold hover:text-gold"
            }`}
          >
            Todos
          </Link>
          <Link
            href="/produtos?novidades=1"
            className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
              onlyNew
                ? "bg-gold text-black"
                : "border border-line text-muted hover:border-gold hover:text-gold"
            }`}
          >
            Novidades
          </Link>
          {categoryOrder.map((c) => (
            <Link
              key={c}
              href={`/produtos?cat=${c}`}
              className={`rounded-full px-3 py-1.5 text-xs font-semibold ${
                cat === c
                  ? "bg-gold text-black"
                  : "border border-line text-muted hover:border-gold hover:text-gold"
              }`}
            >
              {categoryLabels[c]}
            </Link>
          ))}
        </div>

        <div className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        {filtered.length === 0 ? (
          <p className="mt-10 text-center text-muted">
            O Capitão está repondo a vitrine com itens que têm estoque agora.
            Volte em breve — ou{" "}
            <Link href="/sugestoes" className="text-gold hover:underline">
              sugira um produto
            </Link>
            .
          </p>
        ) : null}
      </div>
    </div>
  );
}
