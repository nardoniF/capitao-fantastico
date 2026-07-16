import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { importCJProductFull } from "@/lib/suppliers/import-cj";

/**
 * POST /api/admin/import-cj (legado)
 * Prefira POST /api/admin/cj/import
 * Body: { cjProductId, category?, blurb?, description?, isNew? }
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
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
