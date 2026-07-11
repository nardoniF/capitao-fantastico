import { NextResponse } from "next/server";
import { importCJProduct } from "@/lib/suppliers/import-cj";

function checkAuth(request: Request) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return request.headers.get("x-admin-password") === expected;
}

/**
 * POST /api/admin/import-cj
 * Body: { cjProductId, category, blurb?, description?, isNew? }
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json()) as {
      cjProductId?: string;
      category?: string;
      blurb?: string;
      description?: string;
      isNew?: boolean;
    };

    if (!body.cjProductId || !body.category) {
      return NextResponse.json(
        { error: "cjProductId e category são obrigatórios" },
        { status: 400 },
      );
    }

    const result = await importCJProduct({
      cjProductId: body.cjProductId.trim(),
      category: body.category.trim(),
      blurb: body.blurb,
      description: body.description,
      isNew: body.isNew,
    });

    return NextResponse.json({
      ok: true,
      product: result.product,
      priced: result.priced,
    });
  } catch (e) {
    console.error("import-cj", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao importar" },
      { status: 500 },
    );
  }
}
