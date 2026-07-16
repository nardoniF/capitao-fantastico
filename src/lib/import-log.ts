import { prisma } from "@/lib/db";

export type ImportLogInput = {
  source: "cron" | "manual" | "force";
  status: "ok" | "skip" | "error" | "cap";
  message: string;
  pid?: string;
  productId?: string;
  slug?: string;
  name?: string;
};

export async function appendImportLog(entry: ImportLogInput) {
  if (!process.env.DATABASE_URL) return null;
  try {
    return await prisma.importLog.create({
      data: {
        source: entry.source,
        status: entry.status,
        message: entry.message.slice(0, 500),
        pid: entry.pid,
        productId: entry.productId,
        slug: entry.slug,
        name: entry.name?.slice(0, 120),
      },
    });
  } catch (e) {
    console.error("appendImportLog", e);
    return null;
  }
}

export async function listImportLogs(limit = 40) {
  if (!process.env.DATABASE_URL) return [];
  try {
    return await prisma.importLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });
  } catch {
    return [];
  }
}

export type ImportSummary = {
  lastRunAt: string | null;
  lastRunSource: string | null;
  lastSuccessAt: string | null;
  lastSuccessName: string | null;
  last24h: { ok: number; skip: number; error: number; cap: number };
  lastRoundMessage: string | null;
};

/** Resumo legível da última atividade de import (admin). */
export async function getImportSummary(): Promise<ImportSummary> {
  const empty: ImportSummary = {
    lastRunAt: null,
    lastRunSource: null,
    lastSuccessAt: null,
    lastSuccessName: null,
    last24h: { ok: 0, skip: 0, error: 0, cap: 0 },
    lastRoundMessage: null,
  };
  if (!process.env.DATABASE_URL) return empty;
  try {
    const since = new Date(Date.now() - 24 * 3600 * 1000);
    const [last, lastOk, lastRound, groups] = await Promise.all([
      prisma.importLog.findFirst({ orderBy: { createdAt: "desc" } }),
      prisma.importLog.findFirst({
        where: { status: "ok", name: { not: null } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.importLog.findFirst({
        where: { status: "ok", message: { startsWith: "Rodada:" } },
        orderBy: { createdAt: "desc" },
      }),
      prisma.importLog.groupBy({
        by: ["status"],
        where: { createdAt: { gte: since } },
        _count: true,
      }),
    ]);
    const last24h = { ok: 0, skip: 0, error: 0, cap: 0 };
    for (const g of groups) {
      if (g.status === "ok") last24h.ok = g._count;
      else if (g.status === "skip") last24h.skip = g._count;
      else if (g.status === "error") last24h.error = g._count;
      else if (g.status === "cap") last24h.cap = g._count;
    }
    return {
      lastRunAt: last?.createdAt.toISOString() ?? null,
      lastRunSource: last?.source ?? null,
      lastSuccessAt: lastOk?.createdAt.toISOString() ?? null,
      lastSuccessName: lastOk?.name ?? null,
      last24h,
      lastRoundMessage: lastRound?.message ?? null,
    };
  } catch {
    return empty;
  }
}

/** Teto de catálogo na vitrine (meta fixa 200; override via CATALOG_CAP). */
export function catalogCap() {
  return Math.min(
    Math.max(Number(process.env.CATALOG_CAP || 200) || 200, 50),
    200,
  );
}

/** Produtos visíveis na vitrine (com estoque vendável). */
export async function countStorefrontProducts() {
  if (!process.env.DATABASE_URL) return 0;
  try {
    const { listStorefrontProducts } = await import("@/lib/catalog");
    return (await listStorefrontProducts()).length;
  } catch {
    return 0;
  }
}

export async function countActiveProducts() {
  if (!process.env.DATABASE_URL) return 0;
  try {
    return await prisma.product.count({ where: { active: true } });
  } catch {
    return 0;
  }
}
