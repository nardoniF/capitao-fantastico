"use client";

import Link from "next/link";
import { formatBRL, type Product } from "@/data/products";
import { useCart } from "@/components/CartProvider";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="group overflow-hidden rounded-xl border border-line bg-card transition hover:border-gold/40">
      <Link href={`/produtos/${product.slug}`} className="block">
        <div className="relative aspect-[4/5] overflow-hidden bg-card-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
          />
          <span className="absolute left-3 top-3 rounded-full bg-black/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-gold">
            {product.category === "tech" ? "Tech" : "Lar"}
          </span>
        </div>
        <div className="p-4">
          <h3 className="font-[family-name:var(--font-syne)] text-lg font-bold leading-tight text-white">
            {product.name}
          </h3>
          <p className="mt-1 line-clamp-2 text-sm text-muted">{product.blurb}</p>
          <div className="mt-3 flex items-center gap-2">
            <span className="text-lg font-bold text-gold">{formatBRL(product.price)}</span>
            {product.compareAt ? (
              <span className="text-sm text-muted line-through">
                {formatBRL(product.compareAt)}
              </span>
            ) : null}
          </div>
        </div>
      </Link>
      <div className="px-4 pb-4">
        <button
          type="button"
          onClick={() => add(product.id)}
          className="w-full rounded-md bg-gold px-3 py-2.5 text-sm font-bold text-black transition hover:bg-gold-deep"
        >
          Adicionar ao carrinho
        </button>
      </div>
    </article>
  );
}
