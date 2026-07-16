import { NextResponse } from "next/server";
import {
  adminPasswordConfigured,
  adminUsername,
  createAdminSession,
  validateAdminCredentials,
} from "@/lib/admin-auth";

export async function POST(request: Request) {
  if (!adminPasswordConfigured()) {
    return NextResponse.json(
      {
        error:
          "ADMIN_PASSWORD não configurado no Vercel. Settings → Environment Variables.",
      },
      { status: 500 },
    );
  }

  const body = (await request.json().catch(() => ({}))) as {
    username?: string;
    password?: string;
  };

  const username = String(body.username || "").trim();
  const password = String(body.password || "");

  if (!(await validateAdminCredentials(username, password))) {
    return NextResponse.json(
      {
        error: `Usuário ou senha incorretos. Use "${adminUsername()}" e a senha ADMIN_PASSWORD do Vercel.`,
      },
      { status: 401 },
    );
  }

  try {
    const session = await createAdminSession(username || adminUsername());
    return NextResponse.json(session);
  } catch (e) {
    console.error("admin login session", e);
    return NextResponse.json(
      {
        error:
          "Login ok, mas falha ao criar sessão. Rode npx prisma db push no banco de produção.",
      },
      { status: 500 },
    );
  }
}
