import { NextResponse } from "next/server";
import { calculateSalePrice } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { normalizeImageUrl } from "@/lib/media";
import { getCJSupplier } from "@/lib/suppliers/cj";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Cron: atualiza preço + estoque dos produtos ligados ao CJ.
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
    include: { product: true },
  });

  let updated = 0;
  const errors: string[] = [];

  for (const sp of linked) {
    try {
      const item = await cj.getProduct(sp.externalId);
      if (!item) {
        errors.push(`missing ${sp.externalId}`);
        continue;
      }

      const priced = calculateSalePrice({
        supplierPrice: item.price.amount,
        shippingEstimate: item.shippingEstimate?.amount ?? Number(sp.shippingEstimate),
        currency: item.price.currency,
        markup: Number(rule.markup),
        fxBrl: Number(rule.fxBrl),
        feePct: Number(rule.feePct),
      });

      const imageUrl = normalizeImageUrl(item.imageUrl, "");

      await prisma.supplierProduct.update({
        where: { id: sp.id },
        data: {
          supplierPrice: item.price.amount,
          stock: item.stock,
          imageUrl: imageUrl || sp.imageUrl,
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
          },
        });
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
