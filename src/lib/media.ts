/** Extrai a primeira URL válida de campos de imagem do CJ (string, JSON array ou lista). */
export function normalizeImageUrl(raw: unknown, fallback = "/brand/logo-mark.png"): string {
  const urls = extractImageUrls(raw);
  return urls[0] || fallback;
}

/** Extrai todas as URLs de imagem de um campo CJ (string, JSON array, lista). */
export function extractImageUrls(raw: unknown): string[] {
  const out: string[] = [];
  const seen = new Set<string>();

  const push = (url: string) => {
    const u = url.trim();
    if (!u) return;
    if (!(u.startsWith("http://") || u.startsWith("https://") || u.startsWith("/"))) return;
    if (seen.has(u)) return;
    seen.add(u);
    out.push(u);
  };

  const walk = (value: unknown) => {
    if (value == null) return;
    if (Array.isArray(value)) {
      for (const item of value) walk(item);
      return;
    }
    if (typeof value === "string") {
      const trimmed = value.trim();
      if (!trimmed) return;
      if (trimmed.startsWith("[")) {
        try {
          walk(JSON.parse(trimmed) as unknown);
          return;
        } catch {
          /* fall through */
        }
      }
      // lista separada por vírgula (raro)
      if (trimmed.includes("http") && trimmed.includes(",http")) {
        for (const part of trimmed.split(",")) push(part);
        return;
      }
      push(trimmed);
      return;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      for (const key of ["url", "src", "image", "imageUrl", "variantImage", "bigImage", "productImage"]) {
        if (key in obj) walk(obj[key]);
      }
    }
  };

  walk(raw);
  return out;
}

/** Monta galeria a partir do rawJson do CJ + imagem principal. */
export function galleryFromCjRaw(raw: unknown, primary?: string): string[] {
  const urls: string[] = [];
  const seen = new Set<string>();
  const add = (list: string[]) => {
    for (const u of list) {
      if (seen.has(u)) continue;
      seen.add(u);
      urls.push(u);
    }
  };

  if (primary) add(extractImageUrls(primary));
  if (!raw || typeof raw !== "object") return urls;

  const data = raw as Record<string, unknown>;
  add(extractImageUrls(data.bigImage));
  add(extractImageUrls(data.productImage));
  if (Array.isArray(data.variants)) {
    for (const v of data.variants) {
      if (v && typeof v === "object") {
        add(extractImageUrls((v as { variantImage?: unknown }).variantImage));
      }
    }
  }
  return urls.slice(0, 12);
}
