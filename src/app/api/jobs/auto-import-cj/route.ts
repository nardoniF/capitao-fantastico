import { NextResponse } from "next/server";
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
 * Cron autônomo: descobre top/trending CJ e publica o que ainda não existe.
 * Já importado → ignora. Novo bombando → entra. Sem clique no admin.
 *
 * GET/POST /api/jobs/auto-import-cj
 * Schedule: vercel.json (a cada 2h)
 */
async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const limit = Math.min(
    Math.max(Number(process.env.AUTO_IMPORT_BATCH || 12) || 12, 1),
    15,
  );

  try {
    const started = Date.now();
    const result = await autoImportTopCjProducts({ limit, source: "cron" });
    return NextResponse.json({
      ok: true,
      mode: "autonomous-cap150",
      batchLimit: limit,
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
