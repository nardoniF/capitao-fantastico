import { prisma } from "@/lib/db";

const SESSION_HOURS = 24;

export function adminUsername() {
  return (process.env.ADMIN_USERNAME || "admin").trim();
}

export function adminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

export function bearerToken(request: Request): string | null {
  const h = request.headers.get("authorization") || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return null;
}

export function legacyPassword(request: Request): string {
  return (request.headers.get("x-admin-password") || "").trim();
}

export async function createAdminSession(username: string) {
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  if (process.env.DATABASE_URL) {
    const row = await prisma.adminSession.create({
      data: { username, expiresAt },
    });
    return { token: row.token, username, expiresAt: expiresAt.toISOString() };
  }
  const token = `local_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  return { token, username, expiresAt: expiresAt.toISOString() };
}

export async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  if (!process.env.DATABASE_URL) {
    return token.startsWith("local_");
  }
  try {
    const row = await prisma.adminSession.findUnique({ where: { token } });
    if (!row) return false;
    if (row.expiresAt < new Date()) {
      await prisma.adminSession.delete({ where: { id: row.id } }).catch(() => {});
      return false;
    }
    return true;
  } catch {
    return false;
  }
}

export async function validateAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  return username === adminUsername() && password === expected;
}

/** Token Bearer ou header legado x-admin-password. */
export async function isAdminAuthorized(request: Request): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;

  const token = bearerToken(request);
  if (token && (await validateAdminToken(token))) return true;

  if (legacyPassword(request) === expected) return true;

  return false;
}

export async function getAdminSessionUser(
  request: Request,
): Promise<string | null> {
  const token = bearerToken(request);
  if (!token || !process.env.DATABASE_URL) {
    if (await isAdminAuthorized(request)) return adminUsername();
    return null;
  }
  const row = await prisma.adminSession.findUnique({ where: { token } });
  if (!row || row.expiresAt < new Date()) return null;
  return row.username;
}
