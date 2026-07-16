import {
  createHmac,
  randomBytes,
  scryptSync,
  timingSafeEqual,
} from "crypto";
import { prisma } from "@/lib/db";

const SESSION_DAYS = 30;

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return { salt, hash };
}

function verifyPassword(password: string, salt: string, hash: string) {
  const derived = scryptSync(password, salt, 64).toString("hex");
  const a = Buffer.from(derived, "hex");
  const b = Buffer.from(hash, "hex");
  return a.length === b.length && timingSafeEqual(a, b);
}

function sessionSecret() {
  return (
    process.env.ADMIN_PASSWORD?.trim() ||
    process.env.CRON_SECRET?.trim() ||
    "cf-customer-dev"
  );
}

function createCustomerToken(customerId: string, expiresAt: Date) {
  const payload = `${customerId}:${expiresAt.getTime()}`;
  const sig = createHmac("sha256", sessionSecret())
    .update(payload)
    .digest("base64url");
  return `cfc.${Buffer.from(payload, "utf8").toString("base64url")}.${sig}`;
}

function parseCustomerToken(token: string): { customerId: string } | null {
  if (!token.startsWith("cfc.")) return null;
  const rest = token.slice(4);
  const dot = rest.lastIndexOf(".");
  if (dot <= 0) return null;
  try {
    const payload = Buffer.from(rest.slice(0, dot), "base64url").toString(
      "utf8",
    );
    const sep = payload.lastIndexOf(":");
    if (sep <= 0) return null;
    const customerId = payload.slice(0, sep);
    const exp = Number(payload.slice(sep + 1));
    if (!customerId || !Number.isFinite(exp) || exp < Date.now()) return null;
    const expected = createHmac("sha256", sessionSecret())
      .update(payload)
      .digest("base64url");
    const a = Buffer.from(rest.slice(dot + 1));
    const b = Buffer.from(expected);
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return { customerId };
  } catch {
    return null;
  }
}

export function customerBearerToken(request: Request) {
  const h = request.headers.get("authorization") || "";
  if (h.startsWith("Bearer ")) return h.slice(7).trim();
  return null;
}

export async function registerCustomer(input: {
  name: string;
  email: string;
  phone?: string;
  password: string;
}) {
  const email = normalizeEmail(input.email);
  const name = input.name.trim();
  const phone = input.phone?.trim() || null;
  const password = input.password.trim();
  if (!email || !name || password.length < 6) {
    throw new Error("Informe nome, e-mail e senha (mín. 6 caracteres).");
  }
  const existing = await prisma.customer.findUnique({ where: { email } });
  if (existing) {
    throw new Error("Já existe conta com este e-mail. Faça login.");
  }
  const creds = hashPassword(password);
  return prisma.customer.create({
    data: {
      email,
      name,
      phone,
      passwordHash: creds.hash,
      passwordSalt: creds.salt,
    },
  });
}

export async function loginCustomer(email: string, password: string) {
  const row = await prisma.customer.findUnique({
    where: { email: normalizeEmail(email) },
  });
  if (!row || !verifyPassword(password.trim(), row.passwordSalt, row.passwordHash)) {
    throw new Error("E-mail ou senha incorretos.");
  }
  return row;
}

export function createCustomerSession(customerId: string) {
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000);
  return {
    token: createCustomerToken(customerId, expiresAt),
    expiresAt: expiresAt.toISOString(),
  };
}

export async function getCustomerFromRequest(request: Request) {
  const token = customerBearerToken(request);
  if (!token) return null;
  const parsed = parseCustomerToken(token);
  if (!parsed) return null;
  return prisma.customer.findUnique({ where: { id: parsed.customerId } });
}

export function publicCustomerView(c: {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  createdAt: Date;
}) {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone,
    createdAt: c.createdAt.toISOString(),
  };
}

export async function listCustomers(limit = 200) {
  return prisma.customer.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      createdAt: true,
      _count: { select: { orders: true } },
    },
  });
}
