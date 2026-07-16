import { NextResponse } from "next/server";
import { buildClickEntry, isRealClick } from "@/lib/click-log";
import { logClick } from "@/lib/store-db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (!body.tipo) {
      return NextResponse.json({ error: "tipo obrigatório" }, { status: 400 });
    }

    const entry = buildClickEntry(body, request);
    if (!isRealClick(entry, entry.pagina)) {
      return NextResponse.json({ ok: true, skipped: true });
    }

    const click = await logClick(entry);
    return NextResponse.json({ ok: true, id: click.id });
  } catch {
    return NextResponse.json({ error: "falha" }, { status: 500 });
  }
}
