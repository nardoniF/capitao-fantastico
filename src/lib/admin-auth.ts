import { createHmac, timingSafeEqual } from "crypto";

const SESSION_HOURS = 24;

/** Normaliza secret (Vercel às vezes grava com aspas ou espaço). */
export function normalizeAdminSecret(value: string): string {
  let v = value.trim();
  if (
    (v.startsWith('"') && v.endsWith('"')) ||
    (v.startsWith("'") && v.endsWith("'"))
  ) {
    v = v.slice(1, -1).trim();
  }
  return v;
}

export function adminUsername() {
  return normalizeAdminSecret(process.env.ADMIN_USERNAME || "admin");
}

export function adminPasswordConfigured() {
  return Boolean(normalizeAdminSecret(process.env.ADMIN_PASSWORD || ""));
}

export function adminPasswordExpected() {
  return normalizeAdminSecret(process.env.ADMIN_PASSWORD || "");
}

function sessionSecret() {
  return (
    adminPasswordExpected() ||
    normalizeAdminSecret(process.env.CRON_SECRET || "") ||
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
  return normalizeAdminSecret(request.headers.get("x-admin-password") || "");
}

/** Sempre token assinado — não depende de tabela AdminSession no banco. */
export async function createAdminSession(username: string) {
  const expiresAt = new Date(Date.now() + SESSION_HOURS * 60 * 60 * 1000);
  const token = createSignedAdminToken(username, expiresAt);
  return { token, username, expiresAt: expiresAt.toISOString() };
}

export async function validateAdminToken(token: string | null): Promise<boolean> {
  if (!token) return false;
  return Boolean(parseSignedAdminToken(token));
}

/** Igual STF: usuário exato + senha exata (com normalização de env). */
export async function validateAdminCredentials(
  username: string,
  password: string,
): Promise<boolean> {
  const expected = adminPasswordExpected();
  if (!expected) return false;

  const givenPass = normalizeAdminSecret(password);
  const wantUser = adminUsername();
  const givenUser = normalizeAdminSecret(username || wantUser);

  return givenUser === wantUser && givenPass === expected;
}

/** Token Bearer ou header legado x-admin-password. */
export async function isAdminAuthorized(request: Request): Promise<boolean> {
  const expected = adminPasswordExpected();
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
  if (await isAdminAuthorized(request)) return adminUsername();
  return null;
}
