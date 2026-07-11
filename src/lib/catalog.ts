import { prisma } from "@/lib/db";
import type { ProductCategory } from "@/data/products";

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
};

function mapRow(p: {
  id: string;
  slug: string;
  name: string;
  category: string;
  blurb: string;
  description: string;
  salePrice: { toNumber?: () => number } | number | string;
  compareAt: { toNumber?: () => number } | number | string | null;
  rating: number;
  approved: boolean;
  isNew: boolean;
  imageUrl: string;
  supplierProduct?: { supplierPrice: { toNumber?: () => number } | number | string } | null;
}): StorefrontProduct {
  const num = (v: unknown) => {
    if (v == null) return 0;
    if (typeof v === "number") return v;
    if (typeof v === "string") return Number(v);
    if (typeof v === "object" && v && "toNumber" in v && typeof (v as { toNumber: () => number }).toNumber === "function") {
      return (v as { toNumber: () => number }).toNumber();
    }
    return Number(v);
  };

  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category as ProductCategory,
    blurb: p.blurb,
    description: p.description,
    price: num(p.salePrice),
    cost: num(p.supplierProduct?.supplierPrice),
    compareAt: p.compareAt != null ? num(p.compareAt) : undefined,
    rating: p.rating,
    approved: p.approved,
    isNew: p.isNew,
    image: p.imageUrl,
    accent: "#ffc107",
  };
}

export async function listStorefrontProducts(): Promise<StorefrontProduct[]> {
  if (!process.env.DATABASE_URL) return [];
  try {
    const rows = await prisma.product.findMany({
      where: { active: true },
      include: { supplierProduct: true },
      orderBy: [{ isNew: "desc" }, { updatedAt: "desc" }],
    });
    return rows.map(mapRow);
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
      include: { supplierProduct: true },
    });
    return row ? mapRow(row) : null;
  } catch {
    return null;
  }
}
