"use client";

import { useState } from "react";
import { ProductImage } from "@/components/ProductImage";

export function ProductGallery({
  images,
  alt,
}: {
  images: string[];
  alt: string;
}) {
  const gallery = images.length ? images : ["/brand/logo-mark.png"];
  const [active, setActive] = useState(0);
  const current = gallery[Math.min(active, gallery.length - 1)];

  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-[14px] border border-[#333] bg-[#1a1a1a]">
        <ProductImage
          src={current}
          alt={alt}
          className="aspect-square w-full object-cover"
        />
      </div>
      {gallery.length > 1 ? (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {gallery.map((src, i) => (
            <button
              key={`${src}-${i}`}
              type="button"
              onClick={() => setActive(i)}
              className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border transition ${
                i === active
                  ? "border-gold ring-1 ring-gold"
                  : "border-[#333] hover:border-gold/60"
              }`}
              aria-label={`Foto ${i + 1}`}
            >
              <ProductImage
                src={src}
                alt=""
                className="h-full w-full object-cover"
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
