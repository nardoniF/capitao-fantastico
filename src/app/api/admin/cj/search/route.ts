import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { calculateSalePrice } from "@/lib/pricing";
import { prisma } from "@/lib/db";
import { getCJSupplier } from "@/lib/suppliers/cj";

/**
 * POST /api/admin/cj/search
 * Body: { keyword?, categoryId?, page?, pageSize? }
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      keyword?: string;
      categoryId?: string;
      page?: number;
      pageSize?: number;
    };

    if (!body.keyword?.trim() && !body.categoryId?.trim()) {
      return NextResponse.json(
        { error: "Informe keyword ou categoryId" },
        { status: 400 },
      );
    }

    const cj = getCJSupplier();
    const { list, total } = await cj.searchProducts({
      keyword: body.keyword,
      categoryId: body.categoryId,
      page: body.page,
      pageSize: body.pageSize,
    });

    const pids = list.map((h) => h.pid);
    const imported = pids.length
      ? await prisma.supplierProduct.findMany({
          where: {
            supplier: { code: "cj" },
            externalId: { in: pids },
          },
          select: { externalId: true, product: { select: { id: true, slug: true, active: true } } },
        })
      : [];
    const importedMap = new Map(
      imported.map((r) => [r.externalId, r.product]),
    );

    const rule = await prisma.pricingRule.findFirst({ where: { active: true } });
    const markup = Number(rule?.markup ?? process.env.PRICING_MARKUP ?? 2.0);
    const fxBrl = Number(rule?.fxBrl ?? process.env.PRICING_FX_BRL ?? 5.6);
    const feePct = Number(rule?.feePct ?? 0.05);

    const results = list.map((hit) => {
      const priced = calculateSalePrice({
        supplierPrice: hit.priceUsd,
        shippingEstimate: 0,
        currency: "USD",
        markup,
        fxBrl,
        feePct,
      });
      const existing = importedMap.get(hit.pid);
      return {
        ...hit,
        salePriceBrl: priced.salePrice,
        alreadyImported: Boolean(existing),
        productSlug: existing?.slug,
        productActive: existing?.active,
      };
    });

    return NextResponse.json({
      ok: true,
      total,
      results,
      openaiConfigured: Boolean(process.env.OPENAI_API_KEY?.trim()),
    });
  } catch (e) {
    console.error("cj/search", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha na busca CJ" },
      { status: 500 },
    );
  }
}
