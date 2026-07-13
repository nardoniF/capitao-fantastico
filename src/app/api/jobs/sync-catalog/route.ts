import { NextResponse } from "next/server";
import { priceToWin } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { lookupMercadoLivreRef } from "@/lib/market-price";
import {
  galleryFromCjRaw,
  normalizeImageUrl,
  variantsFromCjRaw,
  videoFromCjRaw,
} from "@/lib/media";
import { getCJSupplier } from "@/lib/suppliers/cj";
import { localizeOptionValues, localizeOptions } from "@/lib/translate-free";
import type { ProductDetails } from "@/lib/product-details";
import { parseProductDetails } from "@/lib/product-details";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Cron: atualiza preço + estoque + variantes dos produtos ligados ao CJ.
 * - Sem estoque / sem margem vs mercado → tira da vitrine
 * - Voltou estoque + margem ok → recoloca
 * - Reenche galeria/opções se o parser antigo tinha deixado vazio
 * NÃO reescreve copy/SEO (só reimport).
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
  let deactivated = 0;
  let reactivated = 0;
  const errors: string[] = [];

  for (const sp of linked) {
    try {
      const full = await cj.getProductFull(sp.externalId);
      if (!full) {
        errors.push(`missing ${sp.externalId}`);
        if (sp.product?.active) {
          await prisma.product.update({
            where: { id: sp.product.id },
            data: { active: false },
          });
          deactivated += 1;
        }
        continue;
      }

      let shippingUsd = Number(sp.shippingEstimate) || 0;
      const inStockVid =
        full.variants.find((v) => v.stock > 0)?.vid || full.variants[0]?.vid;
      // Atualiza frete se ainda zero ou a cada sync leve (só quando product ativo / sem frete)
      if (inStockVid && shippingUsd <= 0) {
        const freight = await cj.freightToBrazil({ vid: inStockVid });
        if (freight) shippingUsd = freight.amountUsd;
      }

      const marketRef = sp.product
        ? await lookupMercadoLivreRef(sp.product.name || full.titleEn)
        : await lookupMercadoLivreRef(full.titleEn);

      const priced = priceToWin({
        supplierPrice: full.priceUsd,
        shippingEstimate: shippingUsd,
        currency: "USD",
        markup: Number(rule.markup),
        fxBrl: Number(rule.fxBrl),
        feePct: Number(rule.feePct),
        marketRef,
      });

      const imageUrl = normalizeImageUrl(full.imageUrl, "");
      const gallery = galleryFromCjRaw(full.raw, imageUrl);
      const videoUrl = videoFromCjRaw(full.raw);
      const parsedVariants = variantsFromCjRaw(full.raw);

      await prisma.supplierProduct.update({
        where: { id: sp.id },
        data: {
          supplierPrice: full.priceUsd,
          shippingEstimate: shippingUsd,
          stock: full.stock,
          imageUrl: imageUrl || sp.imageUrl,
          rawJson: full.raw as object,
          lastSyncedAt: new Date(),
        },
      });

      if (sp.product) {
        const allVariants =
          parsedVariants.length ? parsedVariants : full.variants;
        const seen = new Set<string>();
        let inStockCount = 0;
        const liveOpts: Record<string, string[]> = {};

        for (const v of allVariants) {
          seen.add(v.vid);
          const inStock = v.stock > 0;
          const optionValuesPt = await localizeOptionValues(v.optionValues || {});
          if (inStock) {
            inStockCount += 1;
            for (const [k, val] of Object.entries(optionValuesPt)) {
              if (!val) continue;
              if (!liveOpts[k]) liveOpts[k] = [];
              if (!liveOpts[k].includes(val)) liveOpts[k].push(val);
            }
          }
          const vp = priceToWin({
            supplierPrice: v.priceUsd || full.priceUsd,
            shippingEstimate: shippingUsd,
            currency: "USD",
            markup: Number(rule.markup),
            fxBrl: Number(rule.fxBrl),
            feePct: Number(rule.feePct),
            marketRef,
          });
          const labelPt =
            Object.values(optionValuesPt).filter(Boolean).join(" / ") || v.label;
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
              label: labelPt,
              optionValues: optionValuesPt,
              imageUrl: v.imageUrl || imageUrl,
              supplierPrice: v.priceUsd || full.priceUsd,
              salePrice: vp.salePrice,
              stock: v.stock,
              active: inStock && vp.ok,
            },
            update: {
              sku: v.sku,
              label: labelPt,
              optionValues: optionValuesPt,
              imageUrl: v.imageUrl || imageUrl,
              supplierPrice: v.priceUsd || full.priceUsd,
              salePrice: vp.salePrice,
              stock: v.stock,
              active: inStock && vp.ok,
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

        const stockOk =
          (allVariants.length > 0 && inStockCount > 0) ||
          (allVariants.length === 0 && full.stock > 0);
        const sellable = stockOk && priced.ok;

        const wasActive = sp.product.active;
        const prevGallery = Array.isArray(sp.product.gallery)
          ? (sp.product.gallery as string[])
          : [];
        const nextGallery =
          gallery.length >= prevGallery.length && gallery.length > 0
            ? gallery
            : gallery.length > 0 && prevGallery.length === 0
              ? gallery
              : prevGallery.length
                ? prevGallery
                : gallery.length
                  ? gallery
                  : undefined;

        const prevDetails = parseProductDetails(sp.product.details);
        const measurementsFromCj = full.specs.map((s) => ({
          label: s.label,
          value: s.value,
        }));
        const mergedDetails: ProductDetails = {
          ...prevDetails,
          colors:
            liveOpts.Cor?.length || liveOpts.Color?.length
              ? liveOpts.Cor || liveOpts.Color
              : prevDetails.colors,
          sizes:
            liveOpts.Tamanho?.length ||
            liveOpts.Size?.length ||
            liveOpts.Opção?.length
              ? liveOpts.Tamanho || liveOpts.Size || liveOpts.Opção
              : prevDetails.sizes,
          measurements:
            prevDetails.measurements?.length
              ? prevDetails.measurements
              : measurementsFromCj.length
                ? measurementsFromCj
                : prevDetails.measurements,
        };

        const optionsPt =
          Object.keys(liveOpts).length > 0
            ? await localizeOptions(liveOpts)
            : undefined;

        const productPatch: {
          salePrice: number;
          compareAt: number;
          imageUrl?: string;
          gallery?: string[];
          videoUrl?: string | null;
          active: boolean;
          options?: Record<string, string[]>;
          details?: ProductDetails;
        } = {
          salePrice: priced.salePrice,
          compareAt: priced.compareAt,
          imageUrl: imageUrl || sp.product.imageUrl,
          gallery: nextGallery,
          videoUrl: videoUrl ?? undefined,
          active: sellable,
          details: mergedDetails,
        };
        if (optionsPt && Object.keys(optionsPt).length) {
          productPatch.options = optionsPt;
        }

        await prisma.product.update({
          where: { id: sp.product.id },
          data: productPatch,
        });

        if (wasActive && !sellable) deactivated += 1;
        if (!wasActive && sellable) reactivated += 1;
      }

      updated += 1;
    } catch (e) {
      errors.push(
        `${sp.externalId}: ${e instanceof Error ? e.message : "erro"}`,
      );
    }
  }

  return NextResponse.json({
    ok: true,
    updated,
    deactivated,
    reactivated,
    errors,
  });
}
