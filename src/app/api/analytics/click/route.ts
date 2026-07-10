import { NextResponse } from "next/server";
import { logClick } from "@/lib/store-db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      tipo?: string;
      rotulo?: string;
      pagina?: string;
      href?: string;
      secao?: string;
    };
    if (!body.tipo) {
      return NextResponse.json({ error: "tipo obrigatório" }, { status: 400 });
    }
    const click = await logClick({
      tipo: body.tipo,
      rotulo: body.rotulo,
      pagina: body.pagina,
      href: body.href,
      secao: body.secao,
    });
    return NextResponse.json({ ok: true, id: click.id });
  } catch {
    return NextResponse.json({ error: "falha" }, { status: 500 });
  }
}
