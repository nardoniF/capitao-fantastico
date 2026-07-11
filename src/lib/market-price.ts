/**
 * Referência de preço no mercado BR (Mercado Livre) — best-effort, sem API paga.
 * Cache opcional via Upstash Redis.
 */
import { isRedisEnabled } from "@/lib/redis-store";

const CACHE_TTL_SEC = 60 * 60 * 12; // 12h

function redisConfigured() {
  return Boolean(
    process.env.UPSTASH_REDIS_REST_URL?.trim() &&
      process.env.UPSTASH_REDIS_REST_TOKEN?.trim(),
  );
}

async function redisCommand<T>(command: (string | number)[]): Promise<T | null> {
  const url = process.env.UPSTASH_REDIS_REST_URL?.trim();
  const token = process.env.UPSTASH_REDIS_REST_TOKEN?.trim();
  if (!url || !token) return null;
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(command),
      cache: "no-store",
    });
    if (!res.ok) return null;
    const data = (await res.json()) as { result?: T };
    return data.result ?? null;
  } catch {
    return null;
  }
}

function cacheKey(q: string) {
  return `cf:mlref:${q.toLowerCase().slice(0, 80)}`;
}

function normalizeQuery(name: string) {
  return name
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, 90);
}

function parsePricesFromHtml(html: string): number[] {
  const prices: number[] = [];
  // priceAmount / price_amount em JSON embutido
  const reAmount =
    /"priceAmount"\s*:\s*(\d+(?:\.\d+)?)|"price"\s*:\s*(\d+(?:\.\d+)?)|"amount"\s*:\s*(\d+(?:\.\d+)?)/gi;
  let m: RegExpExecArray | null;
  while ((m = reAmount.exec(html))) {
    const n = Number(m[1] || m[2] || m[3]);
    if (Number.isFinite(n) && n >= 15 && n <= 5000) prices.push(n);
  }
  // R$ 199,90 em texto
  const reBrl = /R\$\s*([\d.]+),(\d{2})/g;
  while ((m = reBrl.exec(html))) {
    const whole = m[1].replace(/\./g, "");
    const n = Number(`${whole}.${m[2]}`);
    if (Number.isFinite(n) && n >= 15 && n <= 5000) prices.push(n);
  }
  return prices;
}

/**
 * Menor preço “novo” razoável no ML para o termo, ou null se falhar.
 */
export async function lookupMercadoLivreRef(
  productName: string,
): Promise<number | null> {
  const q = normalizeQuery(productName);
  if (q.length < 4) return null;

  const key = cacheKey(q);
  if (isRedisEnabled() || redisConfigured()) {
    const cached = await redisCommand<string>(["GET", key]);
    if (cached != null) {
      const n = Number(cached);
      if (Number.isFinite(n) && n > 0) return n;
      if (cached === "null") return null;
    }
  }

  let ref: number | null = null;
  try {
    const url = `https://lista.mercadolivre.com.br/${encodeURIComponent(q.replace(/\s+/g, "-"))}`;
    const ctrl = AbortSignal.timeout(6500);
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; CapitaoFantasticoBot/1.0; +https://www.capitaofantastico.com.br)",
        Accept: "text/html",
        "Accept-Language": "pt-BR,pt;q=0.9",
      },
      signal: ctrl,
      cache: "no-store",
      redirect: "follow",
    });
    if (res.ok) {
      const html = await res.text();
      const prices = parsePricesFromHtml(html).sort((a, b) => a - b);
      // usa percentil baixo (evita outlier promocional absurdo)
      if (prices.length >= 3) {
        ref = prices[Math.min(2, prices.length - 1)] ?? null;
      } else if (prices.length) {
        ref = prices[0] ?? null;
      }
    }
  } catch {
    ref = null;
  }

  if (redisConfigured()) {
    await redisCommand([
      "SET",
      key,
      ref == null ? "null" : String(ref),
      "EX",
      CACHE_TTL_SEC,
    ]);
  }

  return ref;
}
