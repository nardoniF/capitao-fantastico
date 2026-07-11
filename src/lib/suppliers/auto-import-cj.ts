/**
 * Auto-import Capitão:
 * - Descobre sozinho (trending/virais primeiro)
 * - Publica direto
 * - Para no teto ~150 ativos
 * - Já existe → ignora
 */
import type { ProductCategory } from "@/data/products";
import { prisma } from "@/lib/db";
import { mapCjCategoryToStore } from "@/lib/categories";
import {
  appendImportLog,
  catalogCap,
  countActiveProducts,
} from "@/lib/import-log";
import { getCJSupplier } from "@/lib/suppliers/cj";
import type { CjSearchHit } from "@/lib/suppliers/cj-types";
import { importCJProductFull } from "@/lib/suppliers/import-cj";

const BLOCK =
  /statue|buddha|snake|christmas|wig|earring|sex |adult |furniture|cabinet|bike conversion|bearing hub|lingerie|vibrator/i;

const NICHES: {
  keyword: string;
  storeCategory: ProductCategory;
  catMatch: RegExp;
  quota: number;
}[] = [
  { keyword: "Pet", storeCategory: "pet", catMatch: /Pet|Dog|Cat|Animal/i, quota: 5 },
  { keyword: "Car", storeCategory: "auto", catMatch: /Car|Vehicle|Auto|Interior|Exterior/i, quota: 4 },
  { keyword: "Kitchen", storeCategory: "casa", catMatch: /Kitchen|Home|Household|Storage|Clean/i, quota: 5 },
  { keyword: "Facial", storeCategory: "beauty", catMatch: /Facial|Skin|Beauty|Care/i, quota: 4 },
  { keyword: "Massage", storeCategory: "fit", catMatch: /Massage|Sport|Fitness|Outdoor|Camp/i, quota: 4 },
  { keyword: "USB", storeCategory: "gadgets", catMatch: /Phone|Computer|Digital|Electronics|USB|Gadget|Fan/i, quota: 5 },
  { keyword: "Baby", storeCategory: "kids", catMatch: /Baby|Kids|Child/i, quota: 3 },
];

function isGoodCandidate(h: CjSearchHit, minUsd: number, maxUsd: number) {
  if (!h.pid || !h.title) return false;
  if (BLOCK.test(h.title)) return false;
  if (h.priceUsd < minUsd || h.priceUsd > maxUsd) return false;
  return true;
}

export type AutoImportResult = {
  selected: number;
  activeCount: number;
  catalogCap: number;
  slotsLeft: number;
  imported: {
    pid: string;
    name: string;
    slug: string;
    category: string;
    salePrice: number;
  }[];
  skipped: { pid: string; reason: string }[];
  errors: { pid: string; error: string }[];
};

/**
 * Descobre virais/novos CJ e publica até preencher o teto do catálogo.
 */
export async function autoImportTopCjProducts(opts?: {
  limit?: number;
  minUsd?: number;
  maxUsd?: number;
  dryRun?: boolean;
  source?: "cron" | "manual" | "force";
}): Promise<AutoImportResult> {
  const source = opts?.source ?? "cron";
  const cap = catalogCap();
  const activeCount = await countActiveProducts();
  const slotsLeft = Math.max(0, cap - activeCount);

  const batchAsk = Math.min(Math.max(opts?.limit ?? 5, 1), 15);
  const limit = Math.min(batchAsk, slotsLeft || 0);
  const minUsd = opts?.minUsd ?? 1.5;
  const maxUsd = opts?.maxUsd ?? 35;
  const dryRun = opts?.dryRun === true;

  const empty: AutoImportResult = {
    selected: 0,
    activeCount,
    catalogCap: cap,
    slotsLeft,
    imported: [],
    skipped: [],
    errors: [],
  };

  if (slotsLeft <= 0) {
    await appendImportLog({
      source,
      status: "cap",
      message: `Teto atingido (${activeCount}/${cap}). Sem novos imports.`,
    });
    return empty;
  }

  const cj = getCJSupplier();
  // Só ignora PID que já está ATIVO na vitrine.
  // Inativo / só no supplier → pode tentar de novo se a CJ voltar estoque.
  const existing = await prisma.supplierProduct.findMany({
    where: { supplier: { code: "cj" } },
    select: {
      externalId: true,
      product: { select: { active: true } },
    },
  });
  const already = new Set(
    existing
      .filter((e) => e.product?.active === true)
      .map((e) => e.externalId),
  );

  type Candidate = CjSearchHit & {
    storeCategory: ProductCategory;
    score: number;
    viral: boolean;
  };
  const byPid = new Map<string, Candidate>();
  const pause = () => new Promise((r) => setTimeout(r, 1200));

  // 1) VIRALS / trending primeiro (prioridade máxima)
  try {
    const trending = await cj.searchProducts({
      searchType: 2,
      orderBy: "listedNum",
      sort: "desc",
      page: 1,
      pageSize: 50,
      minPrice: minUsd,
      maxPrice: maxUsd,
    });
    for (const h of trending.list) {
      if (!isGoodCandidate(h, minUsd, maxUsd)) continue;
      if (already.has(h.pid)) continue;
      const storeCategory = mapCjCategoryToStore(h.categoryName, h.title);
      const score = (h.listedNum || 0) + 5000; // virais no topo
      byPid.set(h.pid, { ...h, storeCategory, score, viral: true });
    }
  } catch (e) {
    console.warn("trending search failed", e);
  }

  await pause();

  // 2) Mais listados por nicho (novos / fortes)
  for (const niche of NICHES) {
    try {
      await pause();
      const { list } = await cj.searchProducts({
        keyword: niche.keyword,
        orderBy: "listedNum",
        sort: "desc",
        page: 1,
        pageSize: 40,
        minPrice: minUsd,
        maxPrice: maxUsd,
      });
      let taken = 0;
      for (const h of list) {
        if (taken >= niche.quota * 2) break;
        if (!isGoodCandidate(h, minUsd, maxUsd)) continue;
        if (already.has(h.pid)) continue;
        const catOk =
          niche.catMatch.test(h.categoryName || "") ||
          niche.catMatch.test(h.title);
        if (!catOk) continue;
        const score = (h.listedNum || 0) + 100 + (50 - taken);
        const prev = byPid.get(h.pid);
        if (!prev || score > prev.score) {
          byPid.set(h.pid, {
            ...h,
            storeCategory: niche.storeCategory,
            score,
            viral: prev?.viral ?? false,
          });
        }
        taken += 1;
      }
    } catch (e) {
      console.warn(`niche ${niche.keyword} failed`, e);
    }
  }

  // Virais primeiro, depois score
  const ranked = [...byPid.values()].sort((a, b) => {
    if (a.viral !== b.viral) return a.viral ? -1 : 1;
    return b.score - a.score;
  });

  const perCat = new Map<string, number>();
  const selected: Candidate[] = [];

  for (const c of ranked) {
    if (selected.length >= limit) break;
    const n = perCat.get(c.storeCategory) || 0;
    const niche = NICHES.find((x) => x.storeCategory === c.storeCategory);
    const maxQuota = niche?.quota ?? 5;
    if (!c.viral && n >= maxQuota && selected.length < limit - 2) continue;
    perCat.set(c.storeCategory, n + 1);
    selected.push(c);
  }

  if (selected.length < limit) {
    const ids = new Set(selected.map((s) => s.pid));
    for (const c of ranked) {
      if (selected.length >= limit) break;
      if (ids.has(c.pid)) continue;
      selected.push(c);
    }
  }

  const result: AutoImportResult = {
    selected: selected.length,
    activeCount,
    catalogCap: cap,
    slotsLeft,
    imported: [],
    skipped: [],
    errors: [],
  };

  if (dryRun) {
    for (const c of selected) {
      result.skipped.push({
        pid: c.pid,
        reason: `dry-run · ${c.viral ? "viral" : "top"} · ${c.storeCategory}`,
      });
    }
    return result;
  }

  await appendImportLog({
    source,
    status: "ok",
    message: `Rodada: ${selected.length} candidatos · ativos ${activeCount}/${cap} · vagas ${slotsLeft}`,
  });

  // Corrige até 3 produtos antigos ainda em inglês (dormiu e vende pronto)
  try {
    const stale = await prisma.product.findMany({
      where: {
        active: true,
        supplierProduct: { isNot: null },
      },
      include: { supplierProduct: true },
      orderBy: { updatedAt: "asc" },
      take: 8,
    });
    let fixed = 0;
    for (const p of stale) {
      if (fixed >= 3) break;
      const looksEn =
        /\b(the|and|with|for|portable|wireless|hot|new)\b/i.test(p.name) &&
        !/[áàâãéêíóôõúç]/i.test(p.name);
      if (!looksEn || !p.supplierProduct?.externalId) continue;
      try {
        await new Promise((r) => setTimeout(r, 800));
        await importCJProductFull({
          cjProductId: p.supplierProduct.externalId,
          category: p.category,
          isNew: p.isNew,
        });
        fixed += 1;
        await appendImportLog({
          source,
          status: "ok",
          message: `Relocalizado PT · ${p.slug}`,
          pid: p.supplierProduct.externalId,
          productId: p.id,
          slug: p.slug,
          name: p.name,
        });
      } catch {
        /* segue */
      }
    }
  } catch (e) {
    console.warn("relocalize skip", e);
  }

  for (const c of selected) {
    const currentActive = await countActiveProducts();
    if (currentActive >= cap) {
      await appendImportLog({
        source,
        status: "cap",
        message: `Parou no teto ${cap} durante a rodada`,
      });
      break;
    }

    if (already.has(c.pid)) {
      result.skipped.push({ pid: c.pid, reason: "já importado" });
      continue;
    }

    try {
      await new Promise((r) => setTimeout(r, 1300));
      const r = await importCJProductFull({
        cjProductId: c.pid,
        category: c.storeCategory,
        isNew: true,
      });
      already.add(c.pid);
      result.imported.push({
        pid: c.pid,
        name: r.product.name,
        slug: r.product.slug,
        category: c.storeCategory,
        salePrice: Number(r.product.salePrice),
      });
      await appendImportLog({
        source,
        status: "ok",
        message: `${c.viral ? "Viral" : "Novo"} · ${c.storeCategory} · R$ ${Number(r.product.salePrice).toFixed(2)}`,
        pid: c.pid,
        productId: r.product.id,
        slug: r.product.slug,
        name: r.product.name,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro";
      const isOos = /sem estoque/i.test(msg);
      if (isOos) {
        result.skipped.push({ pid: c.pid, reason: "sem estoque CJ" });
        await appendImportLog({
          source,
          status: "skip",
          message: msg.slice(0, 200),
          pid: c.pid,
        });
      } else {
        result.errors.push({ pid: c.pid, error: msg });
        await appendImportLog({
          source,
          status: "error",
          message: msg.slice(0, 200),
          pid: c.pid,
        });
      }
    }
  }

  result.activeCount = await countActiveProducts();
  result.slotsLeft = Math.max(0, cap - result.activeCount);
  return result;
}
