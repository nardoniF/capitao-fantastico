import { createHmac, timingSafeEqual } from "crypto";
import { prisma } from "@/lib/db";

const SESSION_HOURS = 24;

export function adminUsername() {
  return (process.env.ADMIN_USERNAME || "admin").trim();
}

export function adminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD?.trim());
}

function sessionSecret() {
  return (
    process.env.ADMIN_PASSWORD?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "cf-admin-dev-only"
  );
}

function createSignedAdminToken(username: string, expiresAt: Date) {
  const payload = `${username}:${expiresAt.getTime()}`;
  const sig = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `cfs.${Buffer.from(payload, "utf8").toString("base64url")}.${sig}`;
}

function parseSignedAdminToken(token: string): { username: string } | null {
  if (!token.startsWith("cfs.")) return null;
  const rest = token.slice(4);
  const dot = rest.lastIndexOf(".");
  if (dot <= 0) return null;
  const payloadB64 = rest.slice(0, dot);
  const sig = rest.slice(dot + 1);
  try {
    const payload = Buffer.from(payloadB64, "base64url").toString("utf8");
    const sep = payload.lastIndexOf(":");
    if (sep <= 0) return null;
    const username = payload.slice(0, sep);
    const exp = Number(payload.slice(sep + 1));
    if (!username || !Number.isFinite(exp) || exp < Date.now()) return null;
    const expected = createHmac("sha256", sessionSecret())
      .update(payload)
      .digest("base64url");
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return { username };
  } catch {
    return null;
  }
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
    try {
      const row = await prisma.adminSession.create({
        data: { username, expiresAt },
      });
      return { token: row.token, username, expiresAt: expiresAt.toISOString() };
    } catch (e) {
      console.warn("AdminSession indisponível — token assinado", e);
    }
  }
  const token = createSignedAdminToken(username, expiresAt);
  return { token, username, expiresAt: expiresAt.toISOString() };
}

export async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;

  if (parseSignedAdminToken(token)) return true;

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
    return Boolean(parseSignedAdminToken(token));
  }
}

export async function validateAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  const givenUser = (username || adminUsername()).trim().toLowerCase();
  const wantUser = adminUsername().toLowerCase();
  return givenUser === wantUser && password === expected;
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
  if (token) {
    const signed = parseSignedAdminToken(token);
    if (signed) return signed.username;
  }

  if (!token || !process.env.DATABASE_URL) {
    if (await isAdminAuthorized(request)) return adminUsername();
    return null;
  }
  try {
    const row = await prisma.adminSession.findUnique({ where: { token } });
    if (!row || row.expiresAt < new Date()) {
      if (token) return parseSignedAdminToken(token)?.username ?? null;
      return null;
    }
    return row.username;
  } catch {
    return token ? parseSignedAdminToken(token)?.username ?? null : null;
  }
}
