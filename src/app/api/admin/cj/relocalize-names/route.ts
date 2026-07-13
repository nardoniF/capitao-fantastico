import { NextResponse } from "next/server";
import { relocalizeProductNames } from "@/lib/suppliers/relocalize-names";

function checkAuth(request: Request) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return request.headers.get("x-admin-password") === expected;
}

/** POST /api/admin/cj/relocalize-names — corrige nomes PT ruins. */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
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
