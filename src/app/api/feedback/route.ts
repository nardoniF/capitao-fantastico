import { NextResponse } from "next/server";
import {
  createFeedback,
  isFeedbackKind,
  listFeedback,
} from "@/lib/feedback";

function checkAdmin(request: Request) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return (request.headers.get("x-admin-password") || "") === expected;
}

export async function GET(request: Request) {
  if (!checkAdmin(request)) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }
  if (!process.env.DATABASE_URL) {
    return NextResponse.json({ feedback: [] });
  }
  try {
    const feedback = await listFeedback();
    return NextResponse.json({ feedback });
  } catch (e) {
    console.error("list feedback", e);
    return NextResponse.json({ error: "Falha ao listar" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  if (!process.env.DATABASE_URL) {
    return NextResponse.json(
      { error: "Sugestões temporariamente indisponíveis" },
      { status: 503 },
    );
  }

  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      kind?: string;
      message?: string;
      page?: string;
    };

    const name = (body.name || "").trim();
    const email = (body.email || "").trim();
    const message = (body.message || "").trim();
    const kind = (body.kind || "other").trim();

    if (name.length < 2) {
      return NextResponse.json({ error: "Informe seu nome" }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "E-mail inválido" }, { status: 400 });
    }
    if (message.length < 8) {
      return NextResponse.json(
        { error: "Escreva pelo menos 8 caracteres na sugestão" },
        { status: 400 },
      );
    }
    if (!isFeedbackKind(kind)) {
      return NextResponse.json({ error: "Tipo inválido" }, { status: 400 });
    }

    const entry = await createFeedback({
      name,
      email,
      kind,
      message,
      page: body.page,
    });

    return NextResponse.json({ ok: true, id: entry.id });
  } catch (e) {
    console.error("create feedback", e);
    return NextResponse.json({ error: "Falha ao enviar" }, { status: 500 });
  }
}
