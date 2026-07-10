"use client";

import Link from "next/link";
import { formatBRL, type Product } from "@/data/products";
import { useCart } from "@/components/CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="group">
      <Link href={`/produtos/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-sm bg-mist">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
          />
          <span className="absolute left-3 top-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-white/90">
            {product.category === "tech" ? "Tech" : "Lar"}
          </span>
        </div>
        <h3 className="mt-3 font-[family-name:var(--font-syne)] text-lg font-bold leading-tight text-ink">
          {product.name}
        </h3>
        <p className="mt-1 text-sm text-ink-soft/85">{product.blurb}</p>
        <div className="mt-2 flex items-center gap-2">
          <span className="font-bold text-ink">{formatBRL(product.price)}</span>
          {product.compareAt ? (
            <span className="text-sm text-ink/40 line-through">
              {formatBRL(product.compareAt)}
            </span>
          ) : null}
        </div>
      </Link>
      <button
        type="button"
        onClick={() => add(product.id)}
        className="mt-3 w-full rounded-md bg-ink px-3 py-2.5 text-sm font-bold text-white transition hover:bg-ink-soft"
      >
        Adicionar ao carrinho
      </button>
    </article>
  );
}
