import { NextResponse } from "next/server";
import { autoImportTopCjProducts } from "@/lib/suppliers/auto-import-cj";

function checkAuth(request: Request) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return request.headers.get("x-admin-password") === expected;
}

/**
 * POST /api/admin/cj/auto-import
 * Body: { limit?: number (max 30), dryRun?: boolean, minUsd?, maxUsd? }
 *
 * Busca trending + mais listados por nicho e publica automaticamente.
 */
export async function POST(request: Request) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  try {
    const body = (await request.json().catch(() => ({}))) as {
      limit?: number;
      dryRun?: boolean;
      minUsd?: number;
      maxUsd?: number;
    };

    const result = await autoImportTopCjProducts({
      limit: body.limit ?? 10,
      dryRun: body.dryRun,
      minUsd: body.minUsd,
      maxUsd: body.maxUsd,
      source: "force",
    });

    return NextResponse.json({
      ok: result.errors.length === 0,
      ...result,
    });
  } catch (e) {
    console.error("cj/auto-import", e);
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no auto-import" },
      { status: 500 },
    );
  }
}
