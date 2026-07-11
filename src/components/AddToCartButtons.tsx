"use client";

import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/components/CartProvider";

export function AddToCartButtons({
  productId,
  sizes = [],
  sizeRequired = false,
}: {
  productId: string;
  sizes?: string[];
  sizeRequired?: boolean;
}) {
  const { add } = useCart();
  const [size, setSize] = useState<string>(sizes[0] || "");
  const [error, setError] = useState<string | null>(null);

  function addWithSize(goCart = false) {
    if (sizeRequired && sizes.length && !size) {
      setError("Escolha o tamanho antes de continuar");
      return;
    }
    setError(null);
    add(productId, 1, size || undefined);
    if (goCart) window.location.href = "/carrinho";
  }

  return (
    <div className="mt-8 space-y-4">
      {sizes.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-white">
            Tamanho {sizeRequired ? "*" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {sizes.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => {
                  setSize(s);
                  setError(null);
                }}
                className={`min-w-11 rounded-md border px-3 py-2 text-sm font-bold transition ${
                  size === s
                    ? "border-gold bg-gold text-black"
                    : "border-[#333] text-white hover:border-gold"
                }`}
              >
                {s}
              </button>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted">
            Confira a tabela de medidas abaixo se tiver dúvida.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => addWithSize(false)}
          className="rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black transition hover:bg-gold-deep"
        >
          Adicionar ao carrinho
        </button>
        <button
          type="button"
          onClick={() => addWithSize(true)}
          className="rounded-md border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:border-gold hover:text-gold"
        >
          Comprar agora
        </button>
        <Link
          href="/sugestoes"
          className="rounded-md px-3 py-3.5 text-sm text-muted hover:text-gold"
        >
          Dúvida de tamanho? Sugira melhoria
        </Link>
      </div>
    </div>
  );
}
