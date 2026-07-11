/**
 * Importa 15 produtos CJ filtrando por categoryName (busca CJ é bagunçada).
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config({ path: ".env" });

import { prisma } from "../src/lib/db";
import { importCJProduct } from "../src/lib/suppliers/import-cj";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

type Hit = {
  pid: string;
  productNameEn?: string;
  sellPrice?: string;
  categoryName?: string;
};

const QUERIES: {
  keyword: string;
  category: string;
  catMatch: RegExp;
  take: number;
}[] = [
  { keyword: "Pet", category: "pet", catMatch: /Pet /i, take: 3 },
  { keyword: "Dog", category: "pet", catMatch: /Pet /i, take: 2 },
  { keyword: "Massage", category: "fit", catMatch: /Massage|Relaxation|Body Care/i, take: 2 },
  { keyword: "Car", category: "auto", catMatch: /Interior|Exterior|Car |Vehicle|Auto/i, take: 2 },
  { keyword: "Baby", category: "kids", catMatch: /Baby|Kids|Child|Maternity/i, take: 2 },
  { keyword: "Facial", category: "beauty", catMatch: /Facial|Skin|Beauty|Care/i, take: 2 },
  { keyword: "Kitchen", category: "casa", catMatch: /Kitchen|Home|Household|Storage/i, take: 2 },
  { keyword: "USB", category: "gadgets", catMatch: /Phone|Computer|Digital|Electronics|Cable|Charger|Audio/i, take: 2 },
];

const BLOCK =
  /statue|buddha|snake|christmas|wig|earring|sex |adult |furniture|cabinet|sofa|bike conversion|bearing hub/i;

async function getToken() {
  const j = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ apiKey: process.env.CJ_API_KEY }),
  }).then((r) => r.json());
  if (!j.data?.accessToken) throw new Error(JSON.stringify(j));
  return j.data.accessToken as string;
}

async function search(token: string, keyword: string): Promise<Hit[]> {
  const q = new URLSearchParams({
    pageNum: "1",
    pageSize: "40",
    productNameEn: keyword,
  });
  const j = await fetch(`${CJ_BASE}/product/list?${q}`, {
    headers: { "CJ-Access-Token": token },
  }).then((r) => r.json());
  return j.data?.list ?? [];
}

function priceOf(h: Hit) {
  const raw = String(h.sellPrice || "0");
  // "3.51 -- 5.64" → pega o menor
  const n = Number(raw.split("--")[0].trim());
  return Number.isFinite(n) ? n : 0;
}

async function main() {
  await prisma.product.deleteMany({});
  await prisma.supplierProduct.deleteMany({});

  const token = await getToken();
  const picked: { pid: string; category: string; title: string; price: number }[] =
    [];
  const seen = new Set<string>();

  for (const row of QUERIES) {
    const hits = await search(token, row.keyword);
    let taken = 0;
    for (const h of hits) {
      if (!h.pid || seen.has(h.pid)) continue;
      const title = h.productNameEn || "";
      const cat = h.categoryName || "";
      if (!title || BLOCK.test(title)) continue;
      if (!row.catMatch.test(cat) && !row.catMatch.test(title)) continue;
      const price = priceOf(h);
      if (price < 2 || price > 30) continue;

      seen.add(h.pid);
      picked.push({ pid: h.pid, category: row.category, title, price });
      taken += 1;
      if (taken >= row.take) break;
    }
    console.log(`${row.keyword} → ${taken}`);
  }

  // completa até 15 com Pet/Massage extras se faltar
  console.log("Selecionados", picked.length);

  let ok = 0;
  for (const p of picked.slice(0, 15)) {
    try {
      const r = await importCJProduct({
        cjProductId: p.pid,
        category: p.category,
        isNew: true,
        blurb: "Aprovado pelo Capitão — preço alinhado ao fornecedor.",
      });
      console.log(
        "OK",
        `[${p.category}]`,
        `$${p.price} → R$${Number(r.product.salePrice).toFixed(2)}`,
        p.title.slice(0, 50),
      );
      ok += 1;
    } catch (e) {
      console.error("FAIL", p.pid, e instanceof Error ? e.message : e);
    }
  }
  console.log("TOTAL", ok);
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
