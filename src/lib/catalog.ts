import { prisma } from "@/lib/db";
import { normalizeImageUrl } from "@/lib/media";
import {
  parseGallery,
  parseProductDetails,
  type ProductDetails,
} from "@/lib/product-details";
import type { ProductCategory } from "@/data/products";

export type StorefrontVariant = {
  id: string;
  supplierVariantId: string;
  sku?: string | null;
  label: string;
  optionValues: Record<string, string>;
  imageUrl?: string | null;
  salePrice: number;
  stock: number;
};

export type StorefrontProduct = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  blurb: string;
  description: string;
  price: number;
  cost: number;
  compareAt?: number;
  rating: number;
  approved: boolean;
  isNew: boolean;
  image: string;
  accent: string;
  gallery: string[];
  details: ProductDetails;
  videoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  options?: Record<string, string[]>;
  variants: StorefrontVariant[];
};

function num(v: unknown) {
  if (v == null) return 0;
  if (typeof v === "number") return v;
  if (typeof v === "string") return Number(v);
  if (
    typeof v === "object" &&
    v &&
    "toNumber" in v &&
    typeof (v as { toNumber: () => number }).toNumber === "function"
  ) {
    return (v as { toNumber: () => number }).toNumber();
  }
  return Number(v);
}

function parseOptions(raw: unknown): Record<string, string[]> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, string[]> = {};
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    if (Array.isArray(v)) {
      out[k] = v.filter((x): x is string => typeof x === "string");
    }
  }
  return Object.keys(out).length ? out : undefined;
}

function mapRow(p: {
  id: string;
  slug: string;
  name: string;
  category: string;
  blurb: string;
  description: string;
  salePrice: unknown;
  compareAt: unknown;
  rating: number;
  approved: boolean;
  isNew: boolean;
  imageUrl: string;
  gallery?: unknown;
  details?: unknown;
  options?: unknown;
  videoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
  supplierProduct?: {
    supplierPrice: unknown;
  } | null;
  variants?: {
    id: string;
    supplierVariantId: string;
    sku: string | null;
    label: string;
    optionValues: unknown;
    imageUrl: string | null;
    salePrice: unknown;
    stock: number;
    active: boolean;
  }[];
}): StorefrontProduct {
  const image = normalizeImageUrl(p.imageUrl);
  const variants = (p.variants || [])
    .filter((v) => v.active && v.stock > 0)
    .map((v) => ({
      id: v.id,
      supplierVariantId: v.supplierVariantId,
      sku: v.sku,
      label: v.label,
      optionValues:
        v.optionValues && typeof v.optionValues === "object"
          ? (v.optionValues as Record<string, string>)
          : {},
      imageUrl: v.imageUrl,
      salePrice: num(v.salePrice),
      stock: v.stock,
    }));

  // Preço vitrine = menor variante COM ESTOQUE (é a que a página seleciona
  // por padrão). Evita card mostrando um preço e a página outro quando a
  // variante âncora muda de preço ou esgota.
  const cheapestVariant = variants.length
    ? Math.min(...variants.map((v) => v.salePrice))
    : null;
  const price = cheapestVariant ?? num(p.salePrice);
  const compareAtRaw = p.compareAt != null ? num(p.compareAt) : undefined;

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category as ProductCategory,
    blurb: p.blurb,
    description: p.description,
    price,
    cost: num(p.supplierProduct?.supplierPrice),
    compareAt:
      compareAtRaw && compareAtRaw > price ? compareAtRaw : undefined,
    rating: p.rating,
    approved: p.approved,
    isNew: p.isNew,
    image,
    accent: "#ffc107",
    gallery: parseGallery(p.gallery, image),
    details: parseProductDetails(p.details),
    videoUrl: p.videoUrl,
    seoTitle: p.seoTitle,
    seoDescription: p.seoDescription,
    options: parseOptions(p.options),
    variants,
  };
}

const includeVariants = {
  supplierProduct: true,
  variants: {
    where: { active: true, stock: { gt: 0 } },
    orderBy: { salePrice: "asc" as const },
  },
};

export async function listStorefrontProducts(): Promise<StorefrontProduct[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const rows = await prisma.product.findMany({
      where: { active: true },
      include: {
        supplierProduct: true,
        variants: {
          where: { active: true },
          orderBy: { salePrice: "asc" as const },
        },
      },
      orderBy: [{ isNew: "desc" }, { updatedAt: "desc" }],
    });
    return rows
      .map((row) => ({ row, product: mapRow(row) }))
      .filter(({ row, product }) => {
        // Tem variantes cadastradas mas nenhuma com estoque → some da vitrine
        if (row.variants.length > 0 && product.variants.length === 0) {
          return false;
        }
        return true;
      })
      .map(({ product }) => product);
  } catch (e) {
    console.error("listStorefrontProducts", e);
    return [];
  }
}

export async function getStorefrontBySlug(slug: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    const row = await prisma.product.findFirst({
      where: { slug, active: true },
      include: includeVariants,
    });
    return row ? mapRow(row) : null;
  } catch {
    return null;
  }
}

export async function getStorefrontById(id: string) {
  if (!process.env.DATABASE_URL) return null;
  try {
    const row = await prisma.product.findFirst({
      where: { id, active: true },
      include: includeVariants,
    });
    return row ? mapRow(row) : null;
  } catch {
    return null;
  }
}

/** Upsells por categoria quando o produto vem do banco (sem complementaryIds do seed). */
export async function listStorefrontComplementary(
  productIds: string[],
  limit = 6,
): Promise<StorefrontProduct[]> {
  if (!process.env.DATABASE_URL || !productIds.length) return [];
  try {
    const cart = await prisma.product.findMany({
      where: { id: { in: productIds }, active: true },
      select: { id: true, category: true },
    });
    if (!cart.length) return [];
    const categories = [...new Set(cart.map((p) => p.category))];
    const exclude = new Set(productIds);
    const rows = await prisma.product.findMany({
      where: {
        active: true,
        category: { in: categories },
        id: { notIn: productIds },
      },
      include: includeVariants,
      orderBy: [{ isNew: "desc" }, { updatedAt: "desc" }],
      take: limit * 2,
    });
    return rows
      .filter((r) => !exclude.has(r.id))
      .slice(0, limit)
      .map(mapRow);
  } catch (e) {
    console.error("listStorefrontComplementary", e);
    return [];
  }
}
