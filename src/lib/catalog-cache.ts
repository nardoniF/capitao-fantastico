/**
 * Snapshot do catálogo no Upstash — vitrine sobrevive se o Postgres oscilar.
 * Gratuito via Vercel → Upstash Redis (integração marketplace).
 */
import type { StorefrontProduct } from "@/lib/catalog";

const CATALOG_KEY = "cf:catalog:v1";
const CATALOG_TTL_SEC = 60 * 60 * 24 * 7; // 7 dias

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

  const res = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(command),
    cache: "no-store",
  });

  if (!res.ok) {
    console.error("catalog-cache Upstash", res.status);
    return null;
  }

  const data = (await res.json()) as { result?: T };
  return data.result ?? null;
}

export async function readCatalogCache(): Promise<StorefrontProduct[] | null> {
  if (!redisConfigured()) return null;
  const raw = await redisCommand<string | null>(["GET", CATALOG_KEY]);
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as StorefrontProduct[];
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : null;
  } catch {
    return null;
  }
}

export async function writeCatalogCache(products: StorefrontProduct[]) {
  if (!redisConfigured() || products.length === 0) return;
  const json = JSON.stringify(products);
  await redisCommand<string>(["SET", CATALOG_KEY, json, "EX", CATALOG_TTL_SEC]);
}

export function isCatalogCacheEnabled() {
  return redisConfigured();
}
