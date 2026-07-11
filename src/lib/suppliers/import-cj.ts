import { calculateSalePrice } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { generateProductCopy } from "@/lib/ai/product-copy";
import {
  ensureStoreCategory,
  mapCjCategoryToStore,
} from "@/lib/categories";
import { getCJSupplier } from "@/lib/suppliers/cj";
import { localizeOptionValues } from "@/lib/translate-free";
import type { ProductCategory } from "@/data/products";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

async function uniqueSlug(base: string, excludeProductId?: string) {
  let slug = slugify(base) || `cj-${Date.now().toString(36)}`;
  for (let i = 0; i < 20; i++) {
    const candidate = i === 0 ? slug : `${slug}-${i + 1}`;
    const existing = await prisma.product.findUnique({
      where: { slug: candidate },
      select: { id: true },
    });
    if (!existing || existing.id === excludeProductId) return candidate;
  }
  return `${slug}-${Date.now().toString(36)}`;
}

/**
 * Import completo e pronto para vender:
 * PT (nome/desc/SEO), galeria, vídeo, variantes, cores, tamanhos, medidas.
 */
export async function importCJProductFull(opts: {
  cjProductId: string;
  category?: ProductCategory | string;
  isNew?: boolean;
}) {
  const rule =
    (await prisma.pricingRule.findFirst({ where: { active: true } })) ??
    (await prisma.pricingRule.create({
      data: {
        name: "default",
        markup: Number(process.env.PRICING_MARKUP || 2.3),
        fxBrl: Number(process.env.PRICING_FX_BRL || 5.6),
        feePct: 0.05,
      },
    }));

  const supplier =
    (await prisma.supplier.findUnique({ where: { code: "cj" } })) ??
    (await prisma.supplier.create({
      data: { code: "cj", name: "CJ Dropshipping" },
    }));

  const cj = getCJSupplier();
  const full = await cj.getProductFull(opts.cjProductId);
  if (!full) throw new Error(`Produto CJ não encontrado: ${opts.cjProductId}`);

  const storeCategory =
    (opts.category as ProductCategory) ||
    mapCjCategoryToStore(full.categoryName, full.titleEn);
  const categoryRow = await ensureStoreCategory(storeCategory);

  const copy = await generateProductCopy({
    titleEn: full.titleEn,
    descriptionText: full.descriptionText,
    specs: full.specs,
    options: full.options,
    categoryHint: categoryRow.name,
  });

  const details = { ...copy.details };
  if (!details.colors?.length && copy.optionsPt.Cor?.length) {
    details.colors = copy.optionsPt.Cor;
  }
  if (!details.sizes?.length) {
    const sizes = copy.optionsPt.Tamanho || copy.optionsPt.Opção;
    if (sizes?.length) details.sizes = sizes;
  }

  const gallery =
    full.gallery.length > 0
      ? full.gallery
      : [full.imageUrl].filter(Boolean);

  const basePriced = calculateSalePrice({
    supplierPrice: full.priceUsd,
    shippingEstimate: 0,
    currency: "USD",
    markup: Number(rule.markup),
    fxBrl: Number(rule.fxBrl),
    feePct: Number(rule.feePct),
  });

  const firstVid = full.variants[0]?.vid || "";

  const sp = await prisma.supplierProduct.upsert({
    where: {
      supplierId_externalId_variantId: {
        supplierId: supplier.id,
        externalId: full.pid,
        variantId: "",
      },
    },
    create: {
      supplierId: supplier.id,
      externalId: full.pid,
      variantId: "",
      sku: full.sku || firstVid || null,
      title: full.titleEn,
      rawTitle: full.titleEn,
      imageUrl: full.imageUrl,
      supplierPrice: full.priceUsd,
      currency: "USD",
      shippingEstimate: 0,
      stock: full.stock,
      rawJson: full.raw as object,
      lastSyncedAt: new Date(),
    },
    update: {
      sku: full.sku || firstVid || undefined,
      title: full.titleEn,
      imageUrl: full.imageUrl,
      supplierPrice: full.priceUsd,
      stock: full.stock,
      rawJson: full.raw as object,
      lastSyncedAt: new Date(),
    },
  });

  const existing = await prisma.product.findUnique({
    where: { supplierProductId: sp.id },
  });

  const inStockVariants = full.variants.filter((v) => v.stock > 0);
  const hasVariantData = full.variants.length > 0;
  const sellable =
    (hasVariantData && inStockVariants.length > 0) ||
    (!hasVariantData && full.stock > 0);

  // Sem estoque vendável → não publica (e tira da vitrine se já existia)
  if (!sellable) {
    if (existing) {
      await prisma.product.update({
        where: { id: existing.id },
        data: { active: false },
      });
      await prisma.productVariant.updateMany({
        where: { productId: existing.id },
        data: { active: false, stock: 0 },
      });
    }
    const n = full.variants.length;
    throw new Error(
      n > 0
        ? `Sem estoque na CJ (todas as ${n} variantes zeradas) — não publicado`
        : "Sem estoque na CJ — não publicado",
    );
  }

  const slug = await uniqueSlug(copy.slug, existing?.id);

  const productData = {
    slug,
    name: copy.name,
    blurb: copy.blurb,
    description: copy.description,
    category: categoryRow.slug,
    categoryId: categoryRow.id,
    imageUrl: gallery[0] || full.imageUrl,
    gallery,
    details,
    options: copy.optionsPt,
    videoUrl: full.videoUrl,
    seoTitle: copy.seoTitle,
    seoDescription: copy.seoDescription,
    salePrice: basePriced.salePrice,
    compareAt: basePriced.compareAt,
    approved: true,
    isNew: opts.isNew ?? existing?.isNew ?? true,
    active: true,
  };

  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: productData,
      })
    : await prisma.product.create({
        data: {
          ...productData,
          supplierProductId: sp.id,
        },
      });

  const seenVids = new Set<string>();
  // Só grava variantes com estoque; se não houver lista de variantes, nada a upsert
  const variantsToUpsert = inStockVariants;

  for (const v of variantsToUpsert) {
    seenVids.add(v.vid);
    const optionValuesPt = await localizeOptionValues(v.optionValues);
    const labelPt =
      Object.values(optionValuesPt).filter(Boolean).join(" / ") || v.label;
    const priced = calculateSalePrice({
      supplierPrice: v.priceUsd || full.priceUsd,
      shippingEstimate: 0,
      currency: "USD",
      markup: Number(rule.markup),
      fxBrl: Number(rule.fxBrl),
      feePct: Number(rule.feePct),
    });
    await prisma.productVariant.upsert({
      where: {
        productId_supplierVariantId: {
          productId: product.id,
          supplierVariantId: v.vid,
        },
      },
      create: {
        productId: product.id,
        supplierVariantId: v.vid,
        sku: v.sku,
        label: labelPt,
        optionValues: optionValuesPt,
        imageUrl: v.imageUrl || gallery[0] || full.imageUrl,
        supplierPrice: v.priceUsd || full.priceUsd,
        salePrice: priced.salePrice,
        stock: v.stock,
        active: v.stock > 0,
      },
      update: {
        sku: v.sku,
        label: labelPt,
        optionValues: optionValuesPt,
        imageUrl: v.imageUrl || gallery[0] || full.imageUrl,
        supplierPrice: v.priceUsd || full.priceUsd,
        salePrice: priced.salePrice,
        stock: v.stock,
        active: v.stock > 0,
      },
    });
  }

  // Variantes zeradas / sumidas → inactive
  await prisma.productVariant.updateMany({
    where: {
      productId: product.id,
      ...(seenVids.size
        ? { OR: [{ supplierVariantId: { notIn: [...seenVids] } }, { stock: { lte: 0 } }] }
        : { stock: { lte: 0 } }),
    },
    data: { active: false },
  });

  // Só opções com estoque na vitrine
  const liveOpts: Record<string, string[]> = {};
  for (const v of variantsToUpsert) {
    if (v.stock <= 0) continue;
    const ov = await localizeOptionValues(v.optionValues);
    for (const [k, val] of Object.entries(ov)) {
      if (!liveOpts[k]) liveOpts[k] = [];
      if (val && !liveOpts[k].includes(val)) liveOpts[k].push(val);
    }
  }
  if (Object.keys(liveOpts).length) {
    const colors = liveOpts.Cor || [];
    const sizes = liveOpts.Tamanho || liveOpts.Opção || [];
    await prisma.product.update({
      where: { id: product.id },
      data: {
        options: liveOpts,
        details: {
          ...details,
          colors: colors.length ? colors : details.colors,
          sizes: sizes.length ? sizes : details.sizes,
        },
        active: true,
      },
    });
  }

  return {
    product,
    supplierProduct: sp,
    priced: basePriced,
    variantCount: variantsToUpsert.length,
    galleryCount: gallery.length,
    hasVideo: Boolean(full.videoUrl),
  };
}

export async function importCJProduct(opts: {
  cjProductId: string;
  category: string;
  name?: string;
  blurb?: string;
  description?: string;
  isNew?: boolean;
}) {
  return importCJProductFull({
    cjProductId: opts.cjProductId,
    category: opts.category,
    isNew: opts.isNew,
  });
}
