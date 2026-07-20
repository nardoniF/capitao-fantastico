import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { isMaintenanceMode } from "@/lib/maintenance";

/** Rotas que continuam acessíveis durante manutenção. */
function isAllowedDuringMaintenance(pathname: string) {
  return (
    pathname === "/manutencao" ||
    pathname.startsWith("/admin") ||
    pathname.startsWith("/api/") ||
    pathname.startsWith("/_next") ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    pathname.startsWith("/brand/") ||
    pathname.endsWith(".ico") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".xml") ||
    pathname.startsWith("/google")
  );
}

export function middleware(request: NextRequest) {
  if (!isMaintenanceMode()) return NextResponse.next();

  const { pathname } = request.nextUrl;
  if (isAllowedDuringMaintenance(pathname)) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/manutencao";
  url.search = "";
  return NextResponse.redirect(url, 503);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image).*)"],
};
