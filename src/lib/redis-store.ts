/**
 * Persistência opcional via Upstash Redis REST (produção na Vercel).
 * Sem as env vars, cai no filesystem local / memória.
 */
const STORE_KEY = "cf:store:v1";

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
    console.error("Upstash error", res.status, await res.text());
    return null;
  }

  const data = (await res.json()) as { result?: T };
  return data.result ?? null;
}

export async function redisGetStoreJson(): Promise<string | null> {
  if (!redisConfigured()) return null;
  const result = await redisCommand<string | null>(["GET", STORE_KEY]);
  return typeof result === "string" ? result : null;
}

export async function redisSetStoreJson(json: string): Promise<boolean> {
  if (!redisConfigured()) return false;
  const result = await redisCommand<string>(["SET", STORE_KEY, json]);
  return result === "OK";
}

export function isRedisEnabled() {
  return redisConfigured();
}
