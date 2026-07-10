"use client";

import Link from "next/link";
import { formatBRL } from "@/data/products";
import { useCart } from "@/components/CartProvider";

export default function CartPage() {
  const { lines, subtotal, setQty, remove } = useCart();

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-5 py-20 text-center md:px-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-ink">
          Carrinho vazio
        </h1>
        <p className="mt-3 text-ink-soft/90">Adicione produtos para continuar.</p>
        <Link
          href="/produtos"
          className="mt-8 inline-flex rounded-md bg-signal px-6 py-3.5 text-sm font-bold text-ink hover:bg-signal-deep"
        >
          Ver produtos
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-paper py-12 md:py-16">
      <div className="mx-auto max-w-4xl px-5 md:px-8">
        <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-ink md:text-4xl">
          Carrinho
        </h1>
        <ul className="mt-10 divide-y divide-ink/10">
          {lines.map(({ product, qty, lineTotal }) => (
            <li key={product.id} className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={product.image}
                alt=""
                className="h-24 w-24 rounded-sm object-cover"
              />
              <div className="flex-1">
                <Link
                  href={`/produtos/${product.slug}`}
                  className="font-[family-name:var(--font-syne)] text-lg font-bold text-ink"
                >
                  {product.name}
                </Link>
                <p className="mt-1 text-sm text-ink-soft">{formatBRL(product.price)}</p>
                <div className="mt-3 flex items-center gap-3">
                  <label className="text-sm text-ink-soft">
                    Qtd{" "}
                    <input
                      type="number"
                      min={1}
                      value={qty}
                      onChange={(e) => setQty(product.id, Number(e.target.value))}
                      className="ml-2 w-16 rounded border border-ink/20 bg-white px-2 py-1"
                    />
                  </label>
                  <button
                    type="button"
                    onClick={() => remove(product.id)}
                    className="text-sm text-signal-deep underline-offset-2 hover:underline"
                  >
                    Remover
                  </button>
                </div>
              </div>
              <p className="font-bold text-ink">{formatBRL(lineTotal)}</p>
            </li>
          ))}
        </ul>
        <div className="mt-8 flex flex-col items-stretch justify-between gap-4 border-t border-ink/10 pt-8 sm:flex-row sm:items-center">
          <p className="text-lg text-ink">
            Subtotal: <strong>{formatBRL(subtotal)}</strong>
          </p>
          <Link
            href="/checkout"
            className="inline-flex justify-center rounded-md bg-signal px-7 py-3.5 text-sm font-bold text-ink hover:bg-signal-deep"
          >
            Ir para o checkout
          </Link>
        </div>
      </div>
    </div>
  );
}
