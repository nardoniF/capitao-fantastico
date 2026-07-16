import { NextResponse } from "next/server";
import {
  adminUsername,
  getAdminSessionUser,
  isAdminAuthorized,
} from "@/lib/admin-auth";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const username = (await getAdminSessionUser(request)) || adminUsername();
  return NextResponse.json({ ok: true, username });
}
