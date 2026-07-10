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
        className="rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black transition hover:bg-gold-deep"
      >
        Adicionar ao carrinho
      </button>
      <Link
        href="/carrinho"
        onClick={() => add(productId)}
        className="rounded-md border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:border-gold hover:text-gold"
      >
        Comprar agora
      </Link>
    </div>
  );
}
