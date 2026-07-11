import { NextResponse } from "next/server";
import { calculateSalePrice } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import {
  galleryFromCjRaw,
  normalizeImageUrl,
  variantsFromCjRaw,
  videoFromCjRaw,
} from "@/lib/media";
import { getCJSupplier } from "@/lib/suppliers/cj";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Cron: atualiza preço + estoque + variantes dos produtos ligados ao CJ.
 * NÃO reescreve copy/SEO (só reimport manual).
 * GET/POST /api/jobs/sync-catalog
 */
export async function GET(request: Request) {
  return sync(request);
}

export async function POST(request: Request) {
  return sync(request);
}

async function sync(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rule = await prisma.pricingRule.findFirst({ where: { active: true } });
  if (!rule) {
    return NextResponse.json({ error: "Sem PricingRule ativa" }, { status: 400 });
  }

  const cj = getCJSupplier();
  const linked = await prisma.supplierProduct.findMany({
    where: { supplier: { code: "cj" } },
    include: { product: { include: { variants: true } } },
  });

  let updated = 0;
  const errors: string[] = [];

  for (const sp of linked) {
    try {
      const full = await cj.getProductFull(sp.externalId);
      if (!full) {
        errors.push(`missing ${sp.externalId}`);
        continue;
      }

      const priced = calculateSalePrice({
        supplierPrice: full.priceUsd,
        shippingEstimate: Number(sp.shippingEstimate) || 0,
        currency: "USD",
        markup: Number(rule.markup),
        fxBrl: Number(rule.fxBrl),
        feePct: Number(rule.feePct),
      });

      const imageUrl = normalizeImageUrl(full.imageUrl, "");
      const gallery = galleryFromCjRaw(full.raw, imageUrl);
      const videoUrl = videoFromCjRaw(full.raw);
      const parsedVariants = variantsFromCjRaw(full.raw);

      await prisma.supplierProduct.update({
        where: { id: sp.id },
        data: {
          supplierPrice: full.priceUsd,
          stock: full.stock,
          imageUrl: imageUrl || sp.imageUrl,
          rawJson: full.raw as object,
          lastSyncedAt: new Date(),
        },
      });

      if (sp.product) {
        await prisma.product.update({
          where: { id: sp.product.id },
          data: {
            salePrice: priced.salePrice,
            compareAt: priced.compareAt,
            imageUrl: imageUrl || sp.product.imageUrl,
            gallery: gallery.length ? gallery : undefined,
            videoUrl: videoUrl ?? undefined,
            // copy/SEO intencionalmente não tocados
          },
        });

        const allVariants =
          parsedVariants.length ? parsedVariants : full.variants;
        const seen = new Set<string>();
        let inStockCount = 0;

        for (const v of allVariants) {
          seen.add(v.vid);
          const inStock = v.stock > 0;
          if (inStock) inStockCount += 1;
          const vp = calculateSalePrice({
            supplierPrice: v.priceUsd || full.priceUsd,
            shippingEstimate: Number(sp.shippingEstimate) || 0,
            currency: "USD",
            markup: Number(rule.markup),
            fxBrl: Number(rule.fxBrl),
            feePct: Number(rule.feePct),
          });
          await prisma.productVariant.upsert({
            where: {
              productId_supplierVariantId: {
                productId: sp.product.id,
                supplierVariantId: v.vid,
              },
            },
            create: {
              productId: sp.product.id,
              supplierVariantId: v.vid,
              sku: v.sku,
              label: v.label,
              optionValues: v.optionValues,
              imageUrl: v.imageUrl || imageUrl,
              supplierPrice: v.priceUsd || full.priceUsd,
              salePrice: vp.salePrice,
              stock: v.stock,
              active: inStock,
            },
            update: {
              sku: v.sku,
              label: v.label,
              optionValues: v.optionValues,
              imageUrl: v.imageUrl || imageUrl,
              supplierPrice: v.priceUsd || full.priceUsd,
              salePrice: vp.salePrice,
              stock: v.stock,
              active: inStock,
            },
          });
        }

        if (seen.size) {
          await prisma.productVariant.updateMany({
            where: {
              productId: sp.product.id,
              OR: [
                { supplierVariantId: { notIn: [...seen] } },
                { stock: { lte: 0 } },
              ],
            },
            data: { active: false },
          });
        }

        // Sem variante vendável → tira da vitrine
        const noSellable =
          (allVariants.length > 0 && inStockCount === 0) ||
          (allVariants.length === 0 && full.stock <= 0);
        if (noSellable) {
          await prisma.product.update({
            where: { id: sp.product.id },
            data: { active: false },
          });
        }
      }

      updated += 1;
    } catch (e) {
      errors.push(
        `${sp.externalId}: ${e instanceof Error ? e.message : "erro"}`,
      );
    }
  }

  return NextResponse.json({ ok: true, updated, errors });
}
