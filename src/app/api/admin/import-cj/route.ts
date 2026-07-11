import { NextResponse } from "next/server";
import { importCJProductFull } from "@/lib/suppliers/import-cj";

function checkAuth(request: Request) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return request.headers.get("x-admin-password") === expected;
}

/**
 * POST /api/admin/import-cj (legado)
 * Prefira POST /api/admin/cj/import
 * Body: { cjProductId, category?, blurb?, description?, isNew? }
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      cjProductId?: string;
      category?: string;
      isNew?: boolean;
    };

    if (!body.cjProductId) {
      return NextResponse.json(
        { error: "cjProductId é obrigatório" },
        { status: 400 },
      );
    }

    const result = await importCJProductFull({
      cjProductId: body.cjProductId.trim(),
      category: body.category?.trim(),
      isNew: body.isNew,
    });

    return NextResponse.json({
      ok: true,
      product: result.product,
      priced: result.priced,
      variantCount: result.variantCount,
      galleryCount: result.galleryCount,
      hasVideo: result.hasVideo,
    });
  } catch (e) {
    console.error("import-cj", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao importar" },
      { status: 500 },
    );
  }
}
