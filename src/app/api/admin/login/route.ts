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
      { error: "ADMIN_PASSWORD não configurado." },
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
      { error: "Usuário ou senha incorretos." },
      { status: 401 },
    );
  }

  const session = await createAdminSession(username || adminUsername());
  return NextResponse.json(session);
}
