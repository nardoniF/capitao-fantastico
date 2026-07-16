import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { importCJProductFull } from "@/lib/suppliers/import-cj";
import {
  appendImportLog,
  catalogCap,
  countStorefrontProducts,
} from "@/lib/import-log";
import type { ProductCategory } from "@/data/products";

/**
 * POST /api/admin/cj/import
 * Body: { cjProductId } | { cjProductIds: string[], category? }
 * Limite: 10 por request. Respeita teto do catálogo.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      cjProductId?: string;
      cjProductIds?: string[];
      category?: ProductCategory | string;
      isNew?: boolean;
    };

    const ids = [
      ...(body.cjProductIds || []),
      ...(body.cjProductId ? [body.cjProductId] : []),
    ]
      .map((id) => id.trim())
      .filter(Boolean);

    const unique = [...new Set(ids)].slice(0, 10);
    if (!unique.length) {
      return NextResponse.json(
        { error: "cjProductId ou cjProductIds obrigatório" },
        { status: 400 },
      );
    }

    const cap = catalogCap();
    let active = await countActiveProducts();
    const imported = [];
    const errors: { pid: string; error: string }[] = [];

    for (const pid of unique) {
      if (active >= cap) {
        errors.push({
          pid,
          error: `Teto do catálogo (${cap}). Desative/exclua produtos antes.`,
        });
        await appendImportLog({
          source: "manual",
          status: "cap",
          message: `Bloqueado pelo teto ${cap}`,
          pid,
        });
        continue;
      }

      try {
        if (imported.length > 0 || errors.length > 0) {
          await new Promise((r) => setTimeout(r, 1200));
        }
        const result = await importCJProductFull({
          cjProductId: pid,
          category: body.category,
          isNew: body.isNew,
        });
        imported.push({
          pid,
          productId: result.product.id,
          slug: result.product.slug,
          name: result.product.name,
          salePrice: Number(result.product.salePrice),
          variantCount: result.variantCount,
          galleryCount: result.galleryCount,
          hasVideo: result.hasVideo,
        });
        active += 1;
        await appendImportLog({
          source: "manual",
          status: "ok",
          message: `Manual · R$ ${Number(result.product.salePrice).toFixed(2)}`,
          pid,
          productId: result.product.id,
          slug: result.product.slug,
          name: result.product.name,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : "erro";
        errors.push({ pid, error: msg });
        await appendImportLog({
          source: "manual",
          status: "error",
          message: msg.slice(0, 200),
          pid,
        });
      }
    }

    return NextResponse.json({
      ok: errors.length === 0,
      catalogCap: cap,
      activeCount: await countStorefrontProducts(),
      imported,
      errors,
    });
  } catch (e) {
    console.error("cj/import", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao importar" },
      { status: 500 },
    );
  }
}
