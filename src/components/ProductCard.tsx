"use client";

import Link from "next/link";
import { categoryLabels, formatBRL, type Product } from "@/data/products";
import { useCart } from "@/components/CartProvider";
import { ApprovedSeal } from "@/components/ApprovedSeal";

export function ProductCard({ product }: { product: Product }) {
  const { add } = useCart();

  return (
    <article className="loja-card flex h-full flex-col overflow-hidden rounded-[14px] border border-[#333] bg-[#1a1a1a] transition hover:border-gold">
      <Link href={`/produtos/${product.slug}`} className="relative block">
        <div className="aspect-square w-full overflow-hidden bg-[#111]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
        {product.approved ? (
          <div className="absolute left-2 top-2">
            <ApprovedSeal compact />
          </div>
        ) : null}
        {product.isNew ? (
          <span className="absolute right-2 top-2 rounded bg-cap-blue px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
            Novo
          </span>
        ) : null}
      </Link>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <p className="m-0 text-[0.7rem] font-semibold uppercase tracking-wider text-gold/80">
          {categoryLabels[product.category]}
        </p>
        <Link href={`/produtos/${product.slug}`}>
          <h3 className="m-0 text-[1.05rem] font-bold leading-snug text-gold">
            {product.name}
          </h3>
        </Link>
        <p className="m-0 text-xs text-[#666]" aria-label={`${product.rating} de 5`}>
          {"★".repeat(product.rating)}
          {"☆".repeat(5 - product.rating)}
        </p>
        <p className="m-0 flex-1 text-[0.9rem] leading-snug text-[#888]">
          {product.blurb}
        </p>
        <div className="flex items-baseline gap-2">
          <span className="text-[1.1rem] font-bold text-white">
            {formatBRL(product.price)}
          </span>
          {product.compareAt ? (
            <span className="text-sm text-[#666] line-through">
              {formatBRL(product.compareAt)}
            </span>
          ) : null}
        </div>
        <div className="mt-auto flex gap-2 pt-2">
          <button
            type="button"
            onClick={() => add(product.id)}
            className="min-w-0 flex-1 rounded-md bg-gold px-3 py-2.5 text-sm font-bold text-black hover:bg-gold-deep"
          >
            Comprar
          </button>
          <Link
            href={`/produtos/${product.slug}`}
            className="flex min-w-0 flex-1 items-center justify-center rounded-md border border-[#333] px-3 py-2.5 text-sm font-semibold text-gold hover:border-gold"
          >
            Ver
          </Link>
        </div>
      </div>
    </article>
  );
}
