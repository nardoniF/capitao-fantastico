import type { ProductCategory } from "@/data/products";
import { categoryLabels } from "@/data/products";
import { prisma } from "@/lib/db";

const STORE_SLUGS: ProductCategory[] = [
  "gadgets",
  "auto",
  "pet",
  "kids",
  "beauty",
  "casa",
  "fit",
];

/** Mapeia texto de categoria CJ → slug da loja. */
export function mapCjCategoryToStore(
  cjCategoryName?: string,
  hint?: string,
): ProductCategory {
  const text = `${cjCategoryName || ""} ${hint || ""}`.toLowerCase();

  if (/pet|dog|cat|animal|collar|leash/.test(text)) return "pet";
  if (/car|auto|vehicle|motor/.test(text)) return "auto";
  if (/beauty|facial|skin|cosmetic|makeup|hair/.test(text)) return "beauty";
  if (/kid|child|baby|toy/.test(text)) return "kids";
  if (/fit|sport|gym|yoga|outdoor|camp/.test(text)) return "fit";
  if (/home|kitchen|bath|clean|house|garden|furniture/.test(text)) return "casa";
  if (/gadget|usb|electronic|phone|computer|fan|vacuum/.test(text)) {
    return "gadgets";
  }
  return "gadgets";
}

/** Garante Category no banco e devolve id + slug. */
export async function ensureStoreCategory(
  slug: ProductCategory | string,
  name?: string,
) {
  const safeSlug = STORE_SLUGS.includes(slug as ProductCategory)
    ? (slug as ProductCategory)
    : mapCjCategoryToStore(slug);

  const label =
    name ||
    categoryLabels[safeSlug as ProductCategory] ||
    safeSlug;

  const row = await prisma.category.upsert({
    where: { slug: safeSlug },
    create: { slug: safeSlug, name: label, active: true },
    update: { name: label, active: true },
  });

  return row;
}

export { STORE_SLUGS };
