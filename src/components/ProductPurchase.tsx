"use client";

import { useCallback, useState } from "react";
import { AddToCartButtons } from "@/components/AddToCartButtons";
import { ProductGallery } from "@/components/ProductGallery";
import { formatBRL } from "@/data/products";
import type { StorefrontVariant } from "@/lib/catalog";

export function ProductPurchase({
  productId,
  name,
  gallery,
  price,
  compareAt,
  sizes,
  colors,
  sizeRequired,
  variants,
}: {
  productId: string;
  name: string;
  gallery: string[];
  price: number;
  compareAt?: number;
  sizes: string[];
  colors: string[];
  sizeRequired: boolean;
  variants: StorefrontVariant[];
}) {
  const [images, setImages] = useState(gallery);
  const [displayPrice, setDisplayPrice] = useState(price);
  const [displayCompare, setDisplayCompare] = useState(compareAt);

  const onVariantChange = useCallback(
    (v: StorefrontVariant | null) => {
      if (!v) {
        setDisplayPrice(price);
        setDisplayCompare(compareAt);
        setImages(gallery);
        return;
      }
      setDisplayPrice(v.salePrice);
      setDisplayCompare(undefined);
      if (v.imageUrl) {
        setImages([v.imageUrl, ...gallery.filter((g) => g !== v.imageUrl)]);
      }
    },
    [price, compareAt, gallery],
  );

  return (
    <div className="grid gap-8 md:grid-cols-2 md:gap-12">
      <ProductGallery images={images} alt={name} />
      <div className="flex flex-col">
        <div className="mt-0 flex items-baseline gap-3">
          <span className="text-3xl font-bold text-gold">
            {formatBRL(displayPrice)}
          </span>
          {displayCompare ? (
            <span className="text-lg text-[#666] line-through">
              {formatBRL(displayCompare)}
            </span>
          ) : null}
        </div>
        <p className="mt-1 text-xs text-muted">
          Preço da unidade · frete calculado após o pedido
        </p>

        <AddToCartButtons
          productId={productId}
          sizes={sizes}
          colors={colors}
          sizeRequired={sizeRequired}
          variants={variants}
          basePrice={price}
          onVariantChange={onVariantChange}
        />

        <p className="mt-5 text-sm text-[#666]">
          Frete após o pedido · Pix/cartão via Mercado Pago · Suporte em
          português até chegar ·{" "}
          <a href="/pedido/rastreio" className="text-gold hover:underline">
            Página do pedido
          </a>
        </p>
      </div>
    </div>
  );
}
