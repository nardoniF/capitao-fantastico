export type ProductMeasurement = {
  label: string;
  value: string;
};

export type ProductDetails = {
  highlights?: string[];
  sizes?: string[];
  sizeNote?: string;
  adjustable?: boolean;
  measurements?: ProductMeasurement[];
  includes?: string[];
  materials?: string;
  howToUse?: string;
  care?: string;
  longDescription?: string;
};

export function parseProductDetails(raw: unknown): ProductDetails {
  if (!raw || typeof raw !== "object") return {};
  return raw as ProductDetails;
}

export function parseGallery(raw: unknown, fallbackImage?: string): string[] {
  const list: string[] = [];
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (typeof item === "string" && item.trim()) list.push(item.trim());
    }
  }
  if (fallbackImage && !list.includes(fallbackImage)) {
    list.unshift(fallbackImage);
  }
  return [...new Set(list)].filter(Boolean);
}
