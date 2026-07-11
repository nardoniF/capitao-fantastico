import { calculateSalePrice } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { getCJSupplier } from "@/lib/suppliers/cj";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/**
 * Importa um produto CJ pelo productId e cria/atualiza Product na loja com preço calculado.
 */
export async function importCJProduct(opts: {
  cjProductId: string;
  category: string;
  blurb?: string;
  description?: string;
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
  const item = await cj.getProduct(opts.cjProductId);
  if (!item) throw new Error(`Produto CJ não encontrado: ${opts.cjProductId}`);

  const priced = calculateSalePrice({
    supplierPrice: item.price.amount,
    shippingEstimate: item.shippingEstimate?.amount ?? 0,
    currency: item.price.currency,
    markup: Number(rule.markup),
    fxBrl: Number(rule.fxBrl),
    feePct: Number(rule.feePct),
  });

  const sp = await prisma.supplierProduct.upsert({
    where: {
      supplierId_externalId_variantId: {
        supplierId: supplier.id,
        externalId: item.externalId,
        variantId: item.variantId || "",
      },
    },
    create: {
      supplierId: supplier.id,
      externalId: item.externalId,
      variantId: item.variantId || "",
      sku: item.sku,
      title: item.title,
      rawTitle: item.title,
      imageUrl: item.imageUrl,
      supplierPrice: item.price.amount,
      currency: item.price.currency,
      shippingEstimate: item.shippingEstimate?.amount ?? 0,
      stock: item.stock,
      rawJson: item.raw as object | undefined,
      lastSyncedAt: new Date(),
    },
    update: {
      sku: item.sku,
      title: item.title,
      imageUrl: item.imageUrl,
      supplierPrice: item.price.amount,
      shippingEstimate: item.shippingEstimate?.amount ?? 0,
      stock: item.stock,
      rawJson: item.raw as object | undefined,
      lastSyncedAt: new Date(),
    },
  });

  const baseSlug = slugify(item.title) || `cj-${item.externalId.slice(0, 8)}`;
  const existing = await prisma.product.findUnique({
    where: { supplierProductId: sp.id },
  });

  const product = existing
    ? await prisma.product.update({
        where: { id: existing.id },
        data: {
          name: item.title,
          imageUrl: item.imageUrl || existing.imageUrl,
          salePrice: priced.salePrice,
          compareAt: priced.compareAt,
          category: opts.category,
          blurb: opts.blurb || existing.blurb,
          description: opts.description || existing.description,
          active: true,
          isNew: opts.isNew ?? existing.isNew,
        },
      })
    : await prisma.product.create({
        data: {
          slug: baseSlug,
          name: item.title,
          blurb: opts.blurb || "Aprovado pelo Capitão.",
          description:
            opts.description ||
            `${item.title}. Produto curado — preço alinhado ao fornecedor.`,
          category: opts.category,
          imageUrl: item.imageUrl || "/brand/logo-mark.png",
          salePrice: priced.salePrice,
          compareAt: priced.compareAt,
          approved: true,
          isNew: opts.isNew ?? true,
          active: true,
          supplierProductId: sp.id,
        },
      });

  return { product, supplierProduct: sp, priced };
}
