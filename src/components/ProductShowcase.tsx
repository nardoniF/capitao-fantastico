"use client";

import Link from "next/link";
import { products } from "@/data/products";
import { ProductCard } from "@/components/ProductCard";

export function ProductShowcase() {
  return (
    <section id="vitrine" className="bg-mist/60 py-20 md:py-28">
      <div className="mx-auto max-w-6xl px-5 md:px-8">
        <div className="max-w-2xl">
          <p className="text-sm font-semibold uppercase tracking-[0.18em] text-signal-deep">
            Vitrine
          </p>
          <h2 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight text-ink md:text-4xl">
            Seleção Capitão Fantástico
          </h2>
          <p className="mt-4 text-base leading-relaxed text-ink-soft/90 md:text-lg">
            Utilidades do lar e tecnologia inteligente — compre direto aqui.
          </p>
        </div>

        <div className="mt-12 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 8).map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-14 text-center">
          <Link
            href="/produtos"
            className="inline-flex items-center justify-center rounded-md bg-ink px-7 py-3.5 text-sm font-bold text-white transition hover:bg-ink-soft"
          >
            Ver todos os produtos
          </Link>
        </div>
      </div>
    </section>
  );
}
