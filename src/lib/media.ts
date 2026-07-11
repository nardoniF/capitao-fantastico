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
  return urls.slice(0, 24);
}

/** Extrai URL de vídeo do rawJson CJ. */
export function videoFromCjRaw(raw: unknown): string | null {
  if (!raw || typeof raw !== "object") return null;
  const data = raw as Record<string, unknown>;
  const candidates = [
    data.productVideo,
    data.videoUrl,
    data.video,
    data.productVideoUrl,
  ];
  for (const c of candidates) {
    if (typeof c === "string" && c.trim().startsWith("http")) return c.trim();
    if (Array.isArray(c)) {
      for (const item of c) {
        if (typeof item === "string" && item.trim().startsWith("http")) {
          return item.trim();
        }
        if (item && typeof item === "object") {
          const o = item as Record<string, unknown>;
          for (const k of ["url", "src", "videoUrl"]) {
            const v = o[k];
            if (typeof v === "string" && v.trim().startsWith("http")) {
              return v.trim();
            }
          }
        }
      }
    }
  }
  return null;
}

export type CjParsedVariant = {
  vid: string;
  sku?: string;
  priceUsd: number;
  stock: number;
  imageUrl?: string;
  /** Atributos brutos da CJ (EN) */
  optionValues: Record<string, string>;
  label: string;
};

function parseVariantOptions(v: Record<string, unknown>): Record<string, string> {
  const out: Record<string, string> = {};
  const raw =
    v.variantKey ||
    v.variantNameEn ||
    v.variantName ||
    v.variantProperty ||
    "";
  if (typeof raw === "string" && raw.trim()) {
    // Formatos comuns: "Black-M" | "Color:Black;Size:M" | "Black / M"
    const s = raw.trim();
    if (s.includes(";") || s.includes(":")) {
      for (const part of s.split(/[;|]/)) {
        const [k, ...rest] = part.split(":");
        if (k && rest.length) out[k.trim()] = rest.join(":").trim();
      }
    }
    if (!Object.keys(out).length) {
      const parts = s.split(/[-/|,]/).map((p) => p.trim()).filter(Boolean);
      if (parts.length === 1) out.Opção = parts[0];
      else if (parts.length >= 2) {
        out.Cor = parts[0];
        out.Tamanho = parts.slice(1).join(" ");
      }
    }
  }
  if (typeof v.variantColor === "string" && v.variantColor.trim()) {
    out.Cor = v.variantColor.trim();
  }
  if (typeof v.variantSize === "string" && v.variantSize.trim()) {
    out.Tamanho = v.variantSize.trim();
  }
  return out;
}

/** Extrai todas as variantes do rawJson CJ. */
export function variantsFromCjRaw(raw: unknown): CjParsedVariant[] {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  if (!Array.isArray(data.variants)) return [];

  const out: CjParsedVariant[] = [];
  for (const item of data.variants) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const vid = String(v.vid || "").trim();
    if (!vid) continue;
    const optionValues = parseVariantOptions(v);
    const label =
      Object.values(optionValues).filter(Boolean).join(" / ") ||
      String(v.variantSku || vid).slice(0, 40);
    const priceUsd = Number(
      v.variantSellPrice ?? v.variantPrice ?? data.sellPrice ?? data.nowPrice ?? 0,
    );
    out.push({
      vid,
      sku: typeof v.variantSku === "string" ? v.variantSku : undefined,
      priceUsd: Number.isFinite(priceUsd) ? priceUsd : 0,
      stock: Number(v.variantInventory ?? v.inventory ?? 0) || 0,
      imageUrl: normalizeImageUrl(v.variantImage, "") || undefined,
      optionValues,
      label,
    });
  }
  return out;
}

export type CjSpec = { label: string; value: string };

/** Extrai medidas/peso/specs do rawJson CJ. */
export function specsFromCjRaw(raw: unknown): CjSpec[] {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  const specs: CjSpec[] = [];
  const push = (label: string, value: unknown) => {
    if (value == null || value === "") return;
    const s = String(value).trim();
    if (!s || s === "0" || s === "undefined") return;
    specs.push({ label, value: s });
  };

  push("Peso embalagem (g)", data.packWeight ?? data.productWeight ?? data.weight);
  push("Comprimento (cm)", data.packLength ?? data.length);
  push("Largura (cm)", data.packWidth ?? data.width);
  push("Altura (cm)", data.packHeight ?? data.height);
  push("SKU", data.productSku);
  push("Categoria CJ", data.categoryName);

  if (Array.isArray(data.productPropSet)) {
    for (const prop of data.productPropSet) {
      if (!prop || typeof prop !== "object") continue;
      const p = prop as Record<string, unknown>;
      const name = String(p.propNameEn || p.propName || "").trim();
      const val = String(p.propValueEn || p.propValue || "").trim();
      if (name && val) push(name, val);
    }
  }

  return specs;
}

/** Remove tags HTML simples para texto plano. */
export function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
}
