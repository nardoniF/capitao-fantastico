"use client";

import Link from "next/link";
import { useCart } from "@/components/CartProvider";

export function AddToCartButtons({ productId }: { productId: string }) {
  const { add } = useCart();

  return (
    <div className="mt-8 flex flex-wrap gap-3">
      <button
        type="button"
        onClick={() => add(productId)}
        className="rounded-md bg-signal px-6 py-3.5 text-sm font-bold text-ink transition hover:bg-signal-deep"
      >
        Adicionar ao carrinho
      </button>
      <Link
        href="/carrinho"
        onClick={() => add(productId)}
        className="rounded-md bg-ink px-6 py-3.5 text-sm font-bold text-white transition hover:bg-ink-soft"
      >
        Comprar agora
      </Link>
    </div>
  );
}
