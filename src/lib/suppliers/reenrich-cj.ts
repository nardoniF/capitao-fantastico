/**
 * Reenche galeria, variantes, opções e medidas a partir da CJ
 * nos produtos já cadastrados (corrige imports “magros”).
 */
import { prisma } from "@/lib/db";
import { importCJProductFull } from "@/lib/suppliers/import-cj";

export type ReenrichResult = {
  ok: number;
  fail: number;
  skipped: number;
  details: { pid: string; slug?: string; status: string; error?: string }[];
};

export async function reenrichCatalogFromCj(opts?: {
  limit?: number;
  onlyThin?: boolean;
}): Promise<ReenrichResult> {
  const limit = Math.min(Math.max(opts?.limit ?? 40, 1), 80);
  const onlyThin = opts?.onlyThin !== false;

  const linked = await prisma.supplierProduct.findMany({
    where: { supplier: { code: "cj" }, variantId: "" },
    include: { product: true },
    orderBy: { lastSyncedAt: "asc" },
    take: 200,
  });

  const targets = linked
    .filter((sp) => sp.product)
    .filter((sp) => {
      if (!onlyThin) return true;
      const g = Array.isArray(sp.product!.gallery)
        ? (sp.product!.gallery as unknown[])
        : [];
      const opts = sp.product!.options;
      const hasOpts =
        opts &&
        typeof opts === "object" &&
        !Array.isArray(opts) &&
        Object.keys(opts as object).length > 0;
      const desc = (sp.product!.description || "").trim();
      // “Magro”: 0–1 foto, sem opções, ou descrição genérica curta
      return g.length <= 1 || !hasOpts || desc.length < 80;
    })
    .slice(0, limit);

  const details: ReenrichResult["details"] = [];
  let ok = 0;
  let fail = 0;
  let skipped = linked.length - targets.length;

  for (const sp of targets) {
    const pid = sp.externalId;
    try {
      const result = await importCJProductFull({
        cjProductId: pid,
        isNew: sp.product?.isNew,
      });
      ok += 1;
      details.push({
        pid,
        slug: result.product.slug,
        status: `ok · ${result.galleryCount} fotos · ${result.variantCount} variantes`,
      });
    } catch (e) {
      fail += 1;
      details.push({
        pid,
        slug: sp.product?.slug,
        status: "fail",
        error: e instanceof Error ? e.message : "erro",
      });
    }
  }

  return { ok, fail, skipped, details };
}
