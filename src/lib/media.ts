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
    const u = url.trim().replace(/^\/\//, "https://");
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
      if (trimmed.includes("http") && trimmed.includes(",http")) {
        for (const part of trimmed.split(",")) push(part);
        return;
      }
      push(trimmed);
      return;
    }
    if (typeof value === "object") {
      const obj = value as Record<string, unknown>;
      for (const key of [
        "url",
        "src",
        "image",
        "imageUrl",
        "variantImage",
        "bigImage",
        "productImage",
      ]) {
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
  // Campo oficial da API atual: productImageSet
  add(extractImageUrls(data.productImageSet));
  add(extractImageUrls(data.productImages));
  add(extractImageUrls(data.imageSet));
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
        // IDs de vídeo CJ não são URL — ignora
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

/** Estoque: inventoryNum direto, variantInventory legado, ou inventories[]. */
export function stockFromCjVariant(v: Record<string, unknown>): number {
  const direct = Number(
    v.inventoryNum ??
      v.variantInventory ??
      v.inventory ??
      v.totalInventory ??
      v.totalInventoryNum ??
      0,
  );
  if (Number.isFinite(direct) && direct > 0) return direct;

  if (Array.isArray(v.inventories)) {
    let total = 0;
    for (const row of v.inventories) {
      if (!row || typeof row !== "object") continue;
      const inv = row as Record<string, unknown>;
      total +=
        Number(
          inv.totalInventoryNum ??
            inv.totalInventory ??
            inv.cjInventory ??
            inv.cjInventoryNum ??
            inv.factoryInventory ??
            inv.factoryInventoryNum ??
            0,
        ) || 0;
    }
    if (total > 0) return total;
  }
  return Number.isFinite(direct) ? Math.max(0, direct) : 0;
}

/** Chaves de opção do produto (ex.: Color-Size → ["Color","Size"]). */
export function optionKeysFromCjRaw(raw: unknown): string[] {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  if (Array.isArray(data.productKeyEnSet)) {
    return data.productKeyEnSet.map((x) => String(x).trim()).filter(Boolean);
  }
  if (typeof data.productKeyEn === "string" && data.productKeyEn.trim()) {
    return data.productKeyEn.split(/[-/|,]/).map((s) => s.trim()).filter(Boolean);
  }
  if (Array.isArray(data.productKeySet)) {
    return data.productKeySet.map((x) => String(x).trim()).filter(Boolean);
  }
  return [];
}

function parseVariantOptions(
  v: Record<string, unknown>,
  productKeys: string[] = [],
): Record<string, string> {
  const out: Record<string, string> = {};
  const raw =
    v.variantKey ||
    v.variantNameEn ||
    v.variantName ||
    v.variantProperty ||
    "";

  if (typeof raw === "string" && raw.trim()) {
    const s = raw.trim();
    if (s.includes(";") || (s.includes(":") && !productKeys.length)) {
      for (const part of s.split(/[;|]/)) {
        const [k, ...rest] = part.split(":");
        if (k && rest.length) out[k.trim()] = rest.join(":").trim();
      }
    }
    if (!Object.keys(out).length) {
      const parts = s.split(/[-/|,]/).map((p) => p.trim()).filter(Boolean);
      if (productKeys.length && parts.length) {
        for (let i = 0; i < Math.max(productKeys.length, parts.length); i++) {
          const key = productKeys[i] || (i === 0 ? "Cor" : `Opção ${i + 1}`);
          if (parts[i]) out[key] = parts[i]!;
        }
      } else if (parts.length === 1) {
        out.Opção = parts[0]!;
      } else if (parts.length >= 2) {
        out.Cor = parts[0]!;
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
  const list = Array.isArray(data.variants)
    ? data.variants
    : Array.isArray(data.variantList)
      ? data.variantList
      : [];
  if (!list.length) return [];

  const productKeys = optionKeysFromCjRaw(data);
  const out: CjParsedVariant[] = [];
  for (const item of list) {
    if (!item || typeof item !== "object") continue;
    const v = item as Record<string, unknown>;
    const vid = String(v.vid || "").trim();
    if (!vid) continue;
    const optionValues = parseVariantOptions(v, productKeys);
    const label =
      Object.values(optionValues).filter(Boolean).join(" / ") ||
      String(v.variantSku || v.variantNameEn || vid).slice(0, 40);
    const priceUsd = Number(
      v.variantSellPrice ?? v.variantPrice ?? data.sellPrice ?? data.nowPrice ?? 0,
    );
    out.push({
      vid,
      sku: typeof v.variantSku === "string" ? v.variantSku : undefined,
      priceUsd: Number.isFinite(priceUsd) ? priceUsd : 0,
      stock: stockFromCjVariant(v),
      imageUrl: normalizeImageUrl(v.variantImage, "") || undefined,
      optionValues,
      label,
    });
  }
  return out;
}

export type CjSpec = { label: string; value: string };

function mmToCm(raw: unknown): string | null {
  const n = Number(raw);
  if (!Number.isFinite(n) || n <= 0) return null;
  // CJ envia mm nas variantes; se já parecer cm (< 50 e inteiro pequeno), mantém
  if (n >= 50) return `${(n / 10).toFixed(n % 10 === 0 ? 0 : 1)} cm`;
  return `${n} cm`;
}

/** Extrai medidas/peso/specs do rawJson CJ. */
export function specsFromCjRaw(raw: unknown): CjSpec[] {
  if (!raw || typeof raw !== "object") return [];
  const data = raw as Record<string, unknown>;
  const specs: CjSpec[] = [];
  const push = (label: string, value: unknown) => {
    if (value == null || value === "") return;
    const s = String(value).trim();
    if (!s || s === "0" || s === "undefined" || s === "null") return;
    specs.push({ label, value: s });
  };

  push(
    "Peso embalagem (g)",
    data.packingWeight ?? data.packWeight ?? data.productWeight ?? data.weight,
  );
  push("Peso produto (g)", data.productWeight);
  push("Comprimento (cm)", data.packLength ?? data.length ?? data.packingLength);
  push("Largura (cm)", data.packWidth ?? data.width ?? data.packingWidth);
  push("Altura (cm)", data.packHeight ?? data.height ?? data.packingHeight);
  push("SKU", data.productSku);
  push("Categoria CJ", data.categoryName);

  if (Array.isArray(data.materialNameEnSet)) {
    push("Material", data.materialNameEnSet.filter(Boolean).join(", "));
  } else if (typeof data.materialNameEn === "string") {
    push("Material", data.materialNameEn.replace(/[\[\]"]/g, ""));
  }

  // Medidas da 1ª variante (mm → cm)
  if (Array.isArray(data.variants) && data.variants[0] && typeof data.variants[0] === "object") {
    const v0 = data.variants[0] as Record<string, unknown>;
    const L = mmToCm(v0.variantLength);
    const W = mmToCm(v0.variantWidth);
    const H = mmToCm(v0.variantHeight);
    if (L) push("Comprimento variante", L);
    if (W) push("Largura variante", W);
    if (H) push("Altura variante", H);
    if (v0.variantWeight != null) push("Peso variante (g)", v0.variantWeight);
    if (typeof v0.variantStandard === "string" && v0.variantStandard.trim()) {
      push("Especificação", v0.variantStandard);
    }
  }

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
