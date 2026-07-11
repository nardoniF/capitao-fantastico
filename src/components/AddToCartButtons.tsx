"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";

function optionLabel(color?: string, size?: string) {
  if (color && size && size !== "Único") return `${color} / ${size}`;
  if (color) return color;
  if (size && size !== "Único") return size;
  return undefined;
}

export function AddToCartButtons({
  productId,
  sizes = [],
  colors = [],
  sizeRequired = false,
}: {
  productId: string;
  sizes?: string[];
  colors?: string[];
  sizeRequired?: boolean;
}) {
  const { add } = useCart();
  const realSizes = sizes.filter((s) => s && s !== "Único");
  const [size, setSize] = useState<string>(realSizes[0] || "");
  const [color, setColor] = useState<string>(colors[0] || "");
  const [error, setError] = useState<string | null>(null);

  const needsSize = sizeRequired && realSizes.length > 0;
  const needsColor = colors.length > 1;

  const selected = useMemo(
    () => optionLabel(color || undefined, size || undefined),
    [color, size],
  );

  function addWithOptions(goCart = false) {
    if (needsSize && !size) {
      setError("Escolha o tamanho antes de continuar");
      return;
    }
    if (needsColor && !color) {
      setError("Escolha a cor antes de continuar");
      return;
    }
    setError(null);
    add(productId, 1, selected);
    if (goCart) window.location.href = "/carrinho";
  }

  return (
    <div className="mt-8 space-y-4">
      {colors.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-white">
            Cor {needsColor ? "*" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setError(null);
                }}
                className={`rounded-md border px-3 py-2 text-sm font-semibold transition ${
                  color === c
                    ? "border-gold bg-gold text-black"
                    : "border-[#333] text-white hover:border-gold"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      {realSizes.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-white">
            Tamanho {needsSize ? "*" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {realSizes.map((s) => (
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
            Abra “Medidas, cores e tamanhos” e “Dúvidas frequentes” abaixo.
          </p>
        </div>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={() => addWithOptions(false)}
          className="rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black transition hover:bg-gold-deep"
        >
          Adicionar ao carrinho
        </button>
        <button
          type="button"
          onClick={() => addWithOptions(true)}
          className="rounded-md border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:border-gold hover:text-gold"
        >
          Comprar agora
        </button>
        <Link
          href="/sugestoes"
          className="rounded-md px-3 py-3.5 text-sm text-muted hover:text-gold"
        >
          Ainda com dúvida? Fale com o Capitão
        </Link>
      </div>
    </div>
  );
}
