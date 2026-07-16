import { NextResponse } from "next/server";
import {
  catalogCap,
  countStorefrontProducts,
} from "@/lib/import-log";
import { autoImportTopCjProducts } from "@/lib/suppliers/auto-import-cj";

export const maxDuration = 300;
export const dynamic = "force-dynamic";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Cron autônomo: enche a vitrine até CATALOG_CAP (200).
 * Conta só produtos vendáveis com estoque (mesma regra da página /produtos).
 */
async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const cap = catalogCap();
  const vitrine = await countStorefrontProducts();
  const slotsLeft = Math.max(0, cap - vitrine);
  if (slotsLeft <= 0) {
    return NextResponse.json({
      ok: true,
      mode: "catalog-full",
      vitrine,
      catalogCap: cap,
      slotsLeft: 0,
      imported: [],
      skipped: [],
      errors: [],
    });
  }

  const batchDefault = Number(process.env.AUTO_IMPORT_BATCH || 20) || 20;
  const limit = Math.min(30, slotsLeft, batchDefault);

  try {
    const started = Date.now();
    const result = await autoImportTopCjProducts({
      limit,
      deepFill: slotsLeft >= 5,
      source: "cron",
    });
    return NextResponse.json({
      ok: true,
      mode: "autonomous-fill-vitrine",
      batchLimit: limit,
      vitrineBefore: vitrine,
      durationMs: Date.now() - started,
      ...result,
    });
  } catch (e) {
    console.error("auto-import-cj cron", e);
    return NextResponse.json(
      {
        ok: false,
        error: e instanceof Error ? e.message : "Falha no auto-import",
      },
      { status: 500 },
    );
  }
}

export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}
