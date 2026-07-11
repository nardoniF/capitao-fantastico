"use client";

import Link from "next/link";
import { formatBRL } from "@/data/products";
import { useCart } from "@/components/CartProvider";
import { ProductImage } from "@/components/ProductImage";

export default function CartPage() {
  const { lines, subtotal, setQty, remove } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
          Carrinho vazio
        </h1>
        <p className="mt-3 text-muted">Adicione produtos para continuar.</p>
        <Link
          href="/produtos"
          className="mt-8 inline-flex rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black hover:bg-gold-deep"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-bg py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
          Carrinho
        </h1>
        <ul className="mt-10 divide-y divide-line rounded-[14px] border border-[#333] bg-[#1a1a1a]">
          {lines.map(({ product, qty, lineTotal }) => (
            <li
              key={product.id}
              className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center"
            >
              <div className="h-24 w-24 shrink-0 overflow-hidden rounded-lg border border-[#333] bg-[#111]">
                <ProductImage
                  src={product.image}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              </div>
              <div className="flex-1">
                <Link
                  href={`/produtos/${product.slug}`}
                  className="font-[family-name:var(--font-syne)] text-lg font-bold text-white hover:text-gold"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm text-muted">{formatBRL(product.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm text-muted">
                    Qtd{" "}
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(product.id, Number(e.target.value))}
                      className="ml-2 w-16 rounded border border-[#333] bg-[#111] px-2 py-1 text-white"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    className="text-sm text-gold underline-offset-2 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <p className="font-bold text-gold">{formatBRL(lineTotal)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col items-stretch justify-between gap-4 rounded-[14px] border border-[#333] bg-[#1a1a1a] p-6 sm:flex-row sm:items-center">
          <p className="text-lg text-white">
            Subtotal: <strong className="text-gold">{formatBRL(subtotal)}</strong>
          </p>
          <Link
            href="/checkout"
            className="inline-flex justify-center rounded-md bg-gold px-7 py-3.5 text-sm font-bold text-black hover:bg-gold-deep"
          >
            Ir para o checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
