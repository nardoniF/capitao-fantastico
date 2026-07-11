"use client";

import { useEffect, useState } from "react";

type Props = {
  src: string;
  alt: string;
  className?: string;
  fallback?: string;
};

/** Imagem de produto com fallback e sem referrer (CDNs de fornecedor). */
export function ProductImage({
  src,
  alt,
  className,
  fallback = "/brand/logo-mark.png",
}: Props) {
  const [current, setCurrent] = useState(src || fallback);

  useEffect(() => {
    setCurrent(src || fallback);
  }, [src, fallback]);

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={current}
      alt={alt}
      className={className}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => {
        if (current !== fallback) setCurrent(fallback);
      }}
    />
  );
}
