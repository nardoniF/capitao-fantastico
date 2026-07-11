/**
 * Tipos ricos do produto CJ (detalhe completo).
 */
export type CjSearchHit = {
  pid: string;
  title: string;
  imageUrl: string;
  priceUsd: number;
  categoryName?: string;
  listedNum?: number;
  alreadyImported?: boolean;
};

export type CjProductFull = {
  pid: string;
  titleEn: string;
  descriptionHtml: string;
  descriptionText: string;
  imageUrl: string;
  gallery: string[];
  videoUrl: string | null;
  categoryName?: string;
  priceUsd: number;
  stock: number;
  sku?: string;
  variants: import("@/lib/media").CjParsedVariant[];
  specs: import("@/lib/media").CjSpec[];
  options: Record<string, string[]>;
  raw: unknown;
};
