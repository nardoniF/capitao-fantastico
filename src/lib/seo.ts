import type { Metadata } from "next";
import { siteConfig } from "@/lib/site-config";

/** URL canônica do site (sem barra final). */
export function siteUrl() {
  const raw =
    process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
    "https://www.capitaofantastico.com.br";
  // Domínio de produção redireciona non-www → www; canonical/sitemap devem usar www.
  if (raw === "https://capitaofantastico.com.br") {
    return "https://www.capitaofantastico.com.br";
  }
  return raw;
}

export function absoluteUrl(path = "/") {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${siteUrl()}${p}`;
}

/** Palavras-chave principais — curadoria + categorias Capitão. */
export const seoKeywords = [
  "Capitão Fantástico",
  "loja online Brasil",
  "produtos curados",
  "gadgets inteligentes",
  "utilidades para casa",
  "acessórios automotivos",
  "produtos para pets",
  "comprar online",
  "Pix e cartão",
  "entrega rastreada",
  "dropshipping Brasil",
  siteConfig.company,
] as const;

type PageMetaInput = {
  title: string;
  description: string;
  path?: string;
  image?: string;
  noIndex?: boolean;
};

/** Metadata padrão para páginas públicas (title, OG, Twitter, canonical). */
export function buildPageMetadata(input: PageMetaInput): Metadata {
  const url = absoluteUrl(input.path ?? "/");
  const image = input.image ?? absoluteUrl("/brand/logo.png");

  return {
    title: input.title,
    description: input.description,
    keywords: [...seoKeywords],
    alternates: { canonical: url },
    robots: input.noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title: input.title,
      description: input.description,
      url,
      siteName: siteConfig.brand,
      locale: "pt_BR",
      type: "website",
      images: [{ url: image, alt: siteConfig.brand }],
    },
    twitter: {
      card: "summary_large_image",
      title: input.title,
      description: input.description,
      images: [image],
    },
  };
}

export function productAvailability(inStock: boolean) {
  return inStock
    ? "https://schema.org/InStock"
    : "https://schema.org/OutOfStock";
}
