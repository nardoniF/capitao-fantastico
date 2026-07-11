"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useCart } from "@/components/CartProvider";
import { formatBRL } from "@/data/products";
import type { StorefrontVariant } from "@/lib/catalog";

function optionLabel(color?: string, size?: string) {
  if (color && size && size !== "Único") return `${color} / ${size}`;
  if (color) return color;
  if (size && size !== "Único") return size;
  return undefined;
}

function valuesForKey(variants: StorefrontVariant[], keys: string[]) {
  const out: string[] = [];
  for (const v of variants) {
    if (v.stock <= 0) continue;
    for (const k of keys) {
      const val = v.optionValues[k];
      if (val && !out.includes(val)) out.push(val);
    }
  }
  return out;
}

export function AddToCartButtons({
  productId,
  sizes = [],
  colors = [],
  sizeRequired = false,
  variants = [],
  basePrice,
  onVariantChange,
}: {
  productId: string;
  sizes?: string[];
  colors?: string[];
  sizeRequired?: boolean;
  variants?: StorefrontVariant[];
  basePrice?: number;
  onVariantChange?: (v: StorefrontVariant | null) => void;
}) {
  const { add } = useCart();
  const liveVariants = useMemo(
    () => variants.filter((v) => v.stock > 0),
    [variants],
  );

  const liveColors = useMemo(() => {
    const fromVariants = valuesForKey(liveVariants, ["Cor", "Color", "Colour"]);
    if (fromVariants.length) return fromVariants;
    return colors;
  }, [liveVariants, colors]);

  const liveSizes = useMemo(() => {
    const fromVariants = valuesForKey(liveVariants, [
      "Tamanho",
      "Size",
      "Opção",
      "Option",
    ]);
    const source = fromVariants.length ? fromVariants : sizes;
    return source.filter((s) => s && s !== "Único");
  }, [liveVariants, sizes]);

  const [size, setSize] = useState<string>(liveSizes[0] || "");
  const [color, setColor] = useState<string>(liveColors[0] || "");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (liveSizes.length && !liveSizes.includes(size)) {
      setSize(liveSizes[0] || "");
    }
  }, [liveSizes, size]);

  useEffect(() => {
    if (liveColors.length && !liveColors.includes(color)) {
      setColor(liveColors[0] || "");
    }
  }, [liveColors, color]);

  const needsSize = sizeRequired && liveSizes.length > 0;
  const needsColor = liveColors.length > 1;

  const selectedLabel = useMemo(
    () => optionLabel(color || undefined, size || undefined),
    [color, size],
  );

  const matchedVariant = useMemo(() => {
    if (!liveVariants.length) return null;
    if (selectedLabel) {
      const byLabel = liveVariants.find(
        (v) =>
          v.label === selectedLabel ||
          v.label.toLowerCase() === selectedLabel.toLowerCase(),
      );
      if (byLabel) return byLabel;
      const byOpts = liveVariants.find((v) => {
        const vals = Object.values(v.optionValues).map((x) => x.toLowerCase());
        const want = selectedLabel.toLowerCase().split(" / ");
        return want.every((w) =>
          vals.some((val) => val.includes(w) || w.includes(val)),
        );
      });
      if (byOpts) return byOpts;
    }
    return liveVariants[0] || null;
  }, [liveVariants, selectedLabel]);

  useEffect(() => {
    onVariantChange?.(matchedVariant);
  }, [matchedVariant, onVariantChange]);

  const displayPrice = matchedVariant?.salePrice ?? basePrice;
  const outOfStock =
    liveVariants.length === 0 ||
    (matchedVariant != null && matchedVariant.stock <= 0);

  function addWithOptions(goCart = false) {
    if (outOfStock) {
      setError("Sem estoque nesta opção");
      return;
    }
    if (needsSize && !size) {
      setError("Escolha o tamanho antes de continuar");
      return;
    }
    if (needsColor && !color) {
      setError("Escolha a cor antes de continuar");
      return;
    }
    setError(null);
    add(productId, 1, selectedLabel, {
      supplierVariantId: matchedVariant?.supplierVariantId,
      unitPrice: matchedVariant?.salePrice,
      sku: matchedVariant?.sku || undefined,
    });
    if (goCart) window.location.href = "/carrinho";
  }

  return (
    <div className="mt-8 space-y-4">
      {liveColors.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-white">
            Cor {needsColor ? "*" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {liveColors.map((c) => (
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

      {liveSizes.length > 0 ? (
        <div>
          <p className="text-sm font-semibold text-white">
            Tamanho {needsSize ? "*" : ""}
          </p>
          <div className="mt-2 flex flex-wrap gap-2">
            {liveSizes.map((s) => (
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

      {displayPrice != null ? (
        <p className="text-sm text-muted">
          Preço da opção:{" "}
          <span className="font-semibold text-gold">
            {formatBRL(displayPrice)}
          </span>
          {outOfStock ? (
            <span className="ml-2 text-red-400">Sem estoque nesta opção</span>
          ) : null}
        </p>
      ) : null}

      {error ? <p className="text-sm text-red-400">{error}</p> : null}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => addWithOptions(false)}
          className="rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black transition hover:bg-gold-deep disabled:cursor-not-allowed disabled:opacity-40"
        >
          Adicionar ao carrinho
        </button>
        <button
          type="button"
          disabled={outOfStock}
          onClick={() => addWithOptions(true)}
          className="rounded-md border border-white/25 px-6 py-3.5 text-sm font-bold text-white transition hover:border-gold hover:text-gold disabled:cursor-not-allowed disabled:opacity-40"
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
