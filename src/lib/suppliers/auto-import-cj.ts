/**
 * Auto-import Capitão:
 * - Top listagens / trending da CJ (proxy de vendas)
 * - Só publica com estoque real (pula zerado e tenta o próximo)
 * - Para no teto do catálogo (~150–200)
 * - Já ativo → ignora
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

/** Score: listagens (vendas) + viral + preço com margem. */
function candidateScore(h: CjSearchHit, viral: boolean, nicheBoost = 0) {
  const listed = h.listedNum || 0;
  const cheapBoost = Math.round(80 / Math.max(h.priceUsd, 0.5));
  return (viral ? 3000 : 0) + listed * 5 + cheapBoost + nicheBoost;
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
 * Descobre top/trending CJ com estoque e publica até o lote ou o teto.
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

  // Lote pedido (máx 30) limitado às vagas do teto
  const batchAsk = Math.min(Math.max(opts?.limit ?? 30, 1), 30);
  const targetImports = Math.min(batchAsk, slotsLeft || 0);
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
  const pause = (ms = 900) => new Promise((r) => setTimeout(r, ms));

  // 1) VIRALS / trending primeiro
  try {
    const trending = await cj.searchProducts({
      searchType: 2,
      orderBy: "listedNum",
      sort: "desc",
      page: 1,
      pageSize: 50,
      minPrice: minUsd,
      maxPrice: maxUsd,
      startInventory: 1,
    });
    for (const h of trending.list) {
      if (!isGoodCandidate(h, minUsd, maxUsd)) continue;
      if (already.has(h.pid)) continue;
      const storeCategory = mapCjCategoryToStore(h.categoryName, h.title);
      const score = candidateScore(h, true);
      byPid.set(h.pid, { ...h, storeCategory, score, viral: true });
    }
  } catch (e) {
    console.warn("trending search failed", e);
  }

  await pause();

  // 2) Mais listados por nicho
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
        startInventory: 1,
      });
      let taken = 0;
      for (const h of list) {
        if (taken >= niche.quota * 3) break;
        if (!isGoodCandidate(h, minUsd, maxUsd)) continue;
        if (already.has(h.pid)) continue;
        const catOk =
          niche.catMatch.test(h.categoryName || "") ||
          niche.catMatch.test(h.title);
        if (!catOk) continue;
        const score = candidateScore(h, false, 40 - taken);
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

  // Mais listados = mais vendas → primeiro
  const ranked = [...byPid.values()].sort((a, b) => {
    if (a.viral !== b.viral) return a.viral ? -1 : 1;
    return b.score - a.score;
  });

  // Pool grande: muitos top-vendas estão zerados; pulamos e seguimos
  const poolSize = Math.min(ranked.length, Math.max(targetImports * 6, 60));
  const pool = ranked.slice(0, poolSize);

  const result: AutoImportResult = {
    selected: pool.length,
    activeCount,
    catalogCap: cap,
    slotsLeft,
    imported: [],
    skipped: [],
    errors: [],
  };

  if (dryRun) {
    for (const c of pool.slice(0, targetImports)) {
      result.skipped.push({
        pid: c.pid,
        reason: `dry-run · ${c.viral ? "viral" : "top"} · listed ${c.listedNum ?? 0} · ${c.storeCategory}`,
      });
    }
    return result;
  }

  await appendImportLog({
    source,
    status: "ok",
    message: `Rodada: alvo ${targetImports} com estoque · pool ${pool.length} · ativos ${activeCount}/${cap}`,
  });

  for (const c of pool) {
    if (result.imported.length >= targetImports) break;

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
      result.skipped.push({ pid: c.pid, reason: "já ativo na vitrine" });
      continue;
    }

    try {
      await pause(1100);
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
        message: `${c.viral ? "Viral" : "Top"} · listed ${c.listedNum ?? 0} · ${c.storeCategory} · R$ ${Number(r.product.salePrice).toFixed(2)}`,
        pid: c.pid,
        productId: r.product.id,
        slug: r.product.slug,
        name: r.product.name,
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "erro";
      const isSkip =
        /sem estoque|sem margem|origem\/prazo|não publicado/i.test(msg);
      if (isSkip) {
        result.skipped.push({ pid: c.pid, reason: msg.slice(0, 120) });
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
