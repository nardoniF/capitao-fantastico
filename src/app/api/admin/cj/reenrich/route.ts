import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { reenrichCatalogFromCj } from "@/lib/suppliers/reenrich-cj";

/**
 * POST /api/admin/cj/reenrich
 * Reimporta do CJ produtos com galeria/opções/descrição incompletas.
 */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
      onlyThin?: boolean;
    };
    const result = await reenrichCatalogFromCj({
      limit: body.limit,
      onlyThin: body.onlyThin,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao reenricher" },
      { status: 500 },
    );
  }
}
