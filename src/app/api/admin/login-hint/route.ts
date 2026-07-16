import { NextResponse } from "next/server";
import { adminPasswordConfigured, adminUsername } from "@/lib/admin-auth";

/** Dica pública de login (sem expor senha). */
export async function GET() {
  return NextResponse.json({
    username: adminUsername(),
    passwordConfigured: adminPasswordConfigured(),
    help: "Igual STF: usuário + senha do Vercel (ADMIN_USERNAME / ADMIN_PASSWORD). Não há cadastro no site.",
  });
}
