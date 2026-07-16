import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { relocalizeProductNames } from "@/lib/suppliers/relocalize-names";

/** POST /api/admin/cj/relocalize-names — corrige nomes PT ruins. */
export async function POST(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
      onlyActive?: boolean;
    };
    const result = await relocalizeProductNames({
      limit: body.limit,
      onlyActive: body.onlyActive,
    });
    return NextResponse.json(result);
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha ao relocalizar" },
      { status: 500 },
    );
  }
}
