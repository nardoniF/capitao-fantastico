import { promises as fs } from "fs";
import path from "path";
import {
  getStorefrontById,
  getStorefrontBySlug,
  listStorefrontProducts,
  type StorefrontProduct,
} from "@/lib/catalog";
import { prisma } from "@/lib/db";
import {
  applySeedIfNeeded,
  createEmptyStore,
  type ClickEvent,
  type ClickEventInput,
  type Order,
  type StoreProduct,
  type StoreState,
} from "@/lib/store-types";
import {
  isRedisEnabled,
  redisGetStoreJson,
  redisSetStoreJson,
} from "@/lib/redis-store";
import { generateOrderId } from "@/lib/order-id";

function toStoreProduct(p: StorefrontProduct): StoreProduct {
  return {
    ...p,
    active: true,
    complementaryIds: [],
  };
}

async function dbCatalogCount(): Promise<number> {
  if (!process.env.DATABASE_URL) return 0;
  try {
    return await prisma.product.count({ where: { active: true } });
  } catch {
    return 0;
  }
}

const DATA_PATH = path.join(process.cwd(), "data", "store-runtime.json");

declare global {
  // eslint-disable-next-line no-var
  var __cfStore: StoreState | undefined;
}

async function readFromDisk(): Promise<StoreState | null> {
  try {
    const raw = await fs.readFile(DATA_PATH, "utf8");
    return JSON.parse(raw) as StoreState;
  } catch {
    return null;
  }
}

async function writeToDisk(state: StoreState) {
  try {
    await fs.mkdir(path.dirname(DATA_PATH), { recursive: true });
    await fs.writeFile(DATA_PATH, JSON.stringify(state, null, 2), "utf8");
  } catch {
    // Vercel/serverless sem Redis: disco pode ser read-only
  }
}

async function loadState(): Promise<{ state: StoreState; reseeding: boolean }> {
  let state: StoreState | null = null;

  if (isRedisEnabled()) {
    const raw = await redisGetStoreJson();
    if (raw) {
      try {
        state = JSON.parse(raw) as StoreState;
      } catch {
        /* fall through */
      }
    }
  }

  if (!state && globalThis.__cfStore) state = globalThis.__cfStore;
  if (!state) {
    const disk = await readFromDisk();
    state = disk ?? createEmptyStore();
  }

  const next = applySeedIfNeeded(state);
  return { state: next, reseeding: next !== state };
}

export async function getStore(): Promise<StoreState> {
  const { state, reseeding } = await loadState();
  globalThis.__cfStore = state;
  if (reseeding) {
    state.updatedAt = new Date().toISOString();
    const json = JSON.stringify(state);
    if (isRedisEnabled()) {
      await redisSetStoreJson(json);
    } else {
      await writeToDisk(state);
    }
  }
  return state;
}

export async function saveStore(state: StoreState) {
  state.updatedAt = new Date().toISOString();
  globalThis.__cfStore = state;
  const json = JSON.stringify(state);

  if (isRedisEnabled()) {
    const ok = await redisSetStoreJson(json);
    if (!ok) console.error("Falha ao gravar store no Redis");
    return;
  }

  await writeToDisk(state);
}

export async function listActiveProducts(): Promise<StoreProduct[]> {
  const fromDb = await listStorefrontProducts();
  if (fromDb.length > 0) return fromDb.map(toStoreProduct);

  const store = await getStore();
  return store.products.filter((p) => p.active);
}

export async function getProductById(id: string) {
  const fromDb = await getStorefrontById(id);
  if (fromDb) return toStoreProduct(fromDb);

  if ((await dbCatalogCount()) > 0) return undefined;

  const store = await getStore();
  return store.products.find((p) => p.id === id);
}

export async function getProductBySlug(slug: string) {
  const fromDb = await getStorefrontBySlug(slug);
  if (fromDb) return toStoreProduct(fromDb);

  if ((await dbCatalogCount()) > 0) return undefined;

  const store = await getStore();
  return store.products.find((p) => p.slug === slug && p.active);
}

export async function upsertProduct(product: StoreProduct) {
  const store = await getStore();
  const idx = store.products.findIndex((p) => p.id === product.id);
  if (idx >= 0) store.products[idx] = product;
  else store.products.push(product);
  await saveStore(store);
  return product;
}

export async function createOrder(
  input: Omit<Order, "orderId" | "createdAt" | "status"> & {
    status?: Order["status"];
  },
) {
  const store = await getStore();
  const now = new Date().toISOString();
  let orderId = generateOrderId();
  for (let i = 0; i < 5; i++) {
    if (!store.orders.some((o) => o.orderId === orderId)) break;
    orderId = generateOrderId();
  }
  const order: Order = {
    ...input,
    orderId,
    createdAt: now,
    updatedAt: now,
    status: input.status ?? "pending_payment",
    messages: input.messages || [],
    documents: input.documents || [],
    returnStatus: input.returnStatus || "none",
    warrantyStatus: input.warrantyStatus || "none",
    trackingEvents: input.trackingEvents?.length
      ? input.trackingEvents
      : [
          {
            at: now,
            label: "Aguardando pagamento",
            detail: "Pedido criado na loja",
          },
        ],
  };
  store.orders.unshift(order);
  store.orders = store.orders.slice(0, 2000);
  await saveStore(store);
  return order;
}

export async function updateOrder(orderId: string, patch: Partial<Order>) {
  const store = await getStore();
  const idx = store.orders.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return null;
  store.orders[idx] = {
    ...store.orders[idx],
    ...patch,
    updatedAt: new Date().toISOString(),
  };
  await saveStore(store);
  return store.orders[idx];
}

export async function findOrderById(orderId: string) {
  const store = await getStore();
  return store.orders.find((o) => o.orderId === orderId) ?? null;
}

export async function listOrders() {
  const store = await getStore();
  return store.orders;
}

function mapClickRow(row: {
  id: string;
  createdAt: Date;
  clientTs?: Date | null;
  tipo: string;
  destino?: string | null;
  destinoLabel?: string | null;
  rotulo?: string | null;
  pagina?: string | null;
  tituloPagina?: string | null;
  href?: string | null;
  secao?: string | null;
  secaoLabel?: string | null;
  elemento?: string | null;
  visitanteId?: string | null;
  sessaoVisita?: string | null;
  sequencia?: number | null;
  pais?: string | null;
  estado?: string | null;
  cidade?: string | null;
  ipPrefix?: string | null;
  referrer?: string | null;
  dispositivo?: string | null;
  fuso?: string | null;
  idioma?: string | null;
  utmSource?: string | null;
  utmMedium?: string | null;
  utmCampaign?: string | null;
  origemTrafego?: string | null;
  origemTrafegoLabel?: string | null;
  clientEventId?: string | null;
}): ClickEvent {
  return {
    id: row.id,
    createdAt: row.createdAt.toISOString(),
    clientTs: row.clientTs?.toISOString(),
    tipo: row.tipo,
    destino: row.destino || undefined,
    destinoLabel: row.destinoLabel || undefined,
    rotulo: row.rotulo || undefined,
    pagina: row.pagina || undefined,
    tituloPagina: row.tituloPagina || undefined,
    href: row.href || undefined,
    secao: row.secao || undefined,
    secaoLabel: row.secaoLabel || undefined,
    elemento: row.elemento || undefined,
    visitanteId: row.visitanteId || undefined,
    sessaoVisita: row.sessaoVisita || undefined,
    sequencia: row.sequencia ?? undefined,
    pais: row.pais || undefined,
    estado: row.estado || undefined,
    cidade: row.cidade || undefined,
    ipPrefix: row.ipPrefix || undefined,
    referrer: row.referrer || undefined,
    dispositivo: row.dispositivo || undefined,
    fuso: row.fuso || undefined,
    idioma: row.idioma || undefined,
    utmSource: row.utmSource || undefined,
    utmMedium: row.utmMedium || undefined,
    utmCampaign: row.utmCampaign || undefined,
    origemTrafego: row.origemTrafego || undefined,
    origemTrafegoLabel: row.origemTrafegoLabel || undefined,
    clientEventId: row.clientEventId || undefined,
  };
}

function clickCreateData(input: ClickEventInput) {
  return {
    tipo: input.tipo.slice(0, 64),
    destino: input.destino?.slice(0, 48) || null,
    destinoLabel: input.destinoLabel?.slice(0, 80) || null,
    rotulo: input.rotulo?.slice(0, 120) || null,
    pagina: input.pagina?.slice(0, 200) || null,
    tituloPagina: input.tituloPagina?.slice(0, 120) || null,
    href: input.href?.slice(0, 500) || null,
    secao: input.secao?.slice(0, 60) || null,
    secaoLabel: input.secaoLabel?.slice(0, 80) || null,
    elemento: input.elemento?.slice(0, 24) || null,
    visitanteId: input.visitanteId?.slice(0, 64) || null,
    sessaoVisita: input.sessaoVisita?.slice(0, 64) || null,
    sequencia: input.sequencia ?? null,
    pais: input.pais?.slice(0, 12) || null,
    estado: input.estado?.slice(0, 80) || null,
    cidade: input.cidade?.slice(0, 80) || null,
    ipPrefix: input.ipPrefix?.slice(0, 24) || null,
    referrer: input.referrer?.slice(0, 200) || null,
    dispositivo: input.dispositivo?.slice(0, 80) || null,
    fuso: input.fuso?.slice(0, 60) || null,
    idioma: input.idioma?.slice(0, 24) || null,
    utmSource: input.utmSource?.slice(0, 48) || null,
    utmMedium: input.utmMedium?.slice(0, 32) || null,
    utmCampaign: input.utmCampaign?.slice(0, 64) || null,
    origemTrafego: input.origemTrafego?.slice(0, 32) || null,
    origemTrafegoLabel: input.origemTrafegoLabel?.slice(0, 80) || null,
    clientEventId: input.clientEventId?.slice(0, 64) || null,
    clientTs: input.clientTs || null,
  };
}

export async function logClick(input: ClickEventInput) {
  // Neon = fonte de verdade (Vercel não persiste JSON em disco)
  if (process.env.DATABASE_URL) {
    try {
      if (input.clientEventId) {
        const dup = await prisma.clickEvent.findFirst({
          where: { clientEventId: input.clientEventId },
        });
        if (dup) return mapClickRow(dup);
      }
      const row = await prisma.clickEvent.create({ data: clickCreateData(input) });
      return mapClickRow(row);
    } catch (e) {
      console.error("logClick prisma", e);
    }
  }

  const store = await getStore();
  const click: ClickEvent = {
    ...input,
    id: `clk_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
    clientTs: input.clientTs?.toISOString(),
  };
  store.clicks.unshift(click);
  store.clicks = store.clicks.slice(0, 2500);
  await saveStore(store);
  return click;
}

export async function listClicks(limit = 800) {
  if (process.env.DATABASE_URL) {
    try {
      const rows = await prisma.clickEvent.findMany({
        orderBy: { createdAt: "desc" },
        take: limit,
      });
      return rows.map(mapClickRow);
    } catch (e) {
      console.error("listClicks prisma", e);
    }
  }
  const store = await getStore();
  return store.clicks.slice(0, limit);
}
