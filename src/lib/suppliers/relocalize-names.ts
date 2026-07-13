/**
 * Corrige nomes PT ruins a partir do título EN do fornecedor.
 */
import { prisma } from "@/lib/db";
import { localizeProductTitle } from "@/lib/translate-free";

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

export async function relocalizeProductNames(opts?: {
  limit?: number;
  onlyActive?: boolean;
}) {
  const limit = Math.min(Math.max(opts?.limit ?? 40, 1), 80);
  const onlyActive = opts?.onlyActive !== false;

  const rows = await prisma.product.findMany({
    where: {
      ...(onlyActive ? { active: true } : {}),
      supplierProduct: { isNot: null },
    },
    include: { supplierProduct: true },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });

  const updated: { id: string; before: string; after: string; slug: string }[] =
    [];
  const failed: { id: string; error: string }[] = [];

  for (const p of rows) {
    const en =
      p.supplierProduct?.rawTitle ||
      p.supplierProduct?.title ||
      "";
    if (!en.trim()) continue;

    try {
      const name = await localizeProductTitle(en);
      if (!name || name === p.name) continue;

      let slug = slugify(name) || p.slug;
      if (slug !== p.slug) {
        const clash = await prisma.product.findFirst({
          where: { slug, NOT: { id: p.id } },
          select: { id: true },
        });
        if (clash) slug = `${slug}-${p.id.slice(-4)}`;
      }

      await prisma.product.update({
        where: { id: p.id },
        data: {
          name,
          slug,
          seoTitle: `${name} | Compre online | Capitão Fantástico`.slice(0, 70),
        },
      });

      updated.push({ id: p.id, before: p.name, after: name, slug });
      await new Promise((r) => setTimeout(r, 400));
    } catch (e) {
      failed.push({
        id: p.id,
        error: e instanceof Error ? e.message : "erro",
      });
    }
  }

  return { updated, failed, scanned: rows.length };
}
