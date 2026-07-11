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

/** Teto de catálogo ativo (filosofia Capitão: 100–200). */
export function catalogCap() {
  return Math.min(
    Math.max(Number(process.env.CATALOG_CAP || 150) || 150, 50),
    200,
  );
}

export async function countActiveProducts() {
  if (!process.env.DATABASE_URL) return 0;
  try {
    return await prisma.product.count({ where: { active: true } });
  } catch {
    return 0;
  }
}
