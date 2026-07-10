import { promises as fs } from "fs";
import path from "path";
import {
  createEmptyStore,
  type ClickEvent,
  type Order,
  type StoreProduct,
  type StoreState,
} from "@/lib/store-types";

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
    // Vercel/serverless: filesystem may be read-only — memory still works for the instance
  }
}

export async function getStore(): Promise<StoreState> {
  if (globalThis.__cfStore) return globalThis.__cfStore;
  const disk = await readFromDisk();
  const state = disk ?? createEmptyStore();
  globalThis.__cfStore = state;
  return state;
}

export async function saveStore(state: StoreState) {
  state.updatedAt = new Date().toISOString();
  globalThis.__cfStore = state;
  await writeToDisk(state);
}

export async function listActiveProducts(): Promise<StoreProduct[]> {
  const store = await getStore();
  return store.products.filter((p) => p.active);
}

export async function getProductById(id: string) {
  const store = await getStore();
  return store.products.find((p) => p.id === id);
}

export async function getProductBySlug(slug: string) {
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
  const order: Order = {
    ...input,
    orderId: `CF${Date.now().toString(36).toUpperCase()}`,
    createdAt: new Date().toISOString(),
    status: input.status ?? "pending_payment",
  };
  store.orders.unshift(order);
  store.orders = store.orders.slice(0, 2000);
  await saveStore(store);
  return order;
}

export async function updateOrder(
  orderId: string,
  patch: Partial<Order>,
) {
  const store = await getStore();
  const idx = store.orders.findIndex((o) => o.orderId === orderId);
  if (idx < 0) return null;
  store.orders[idx] = { ...store.orders[idx], ...patch };
  await saveStore(store);
  return store.orders[idx];
}

export async function listOrders() {
  const store = await getStore();
  return store.orders;
}

export async function logClick(input: Omit<ClickEvent, "id" | "createdAt">) {
  const store = await getStore();
  const click: ClickEvent = {
    ...input,
    id: `clk_${Date.now().toString(36)}`,
    createdAt: new Date().toISOString(),
  };
  store.clicks.unshift(click);
  store.clicks = store.clicks.slice(0, 2500);
  await saveStore(store);
  return click;
}

export async function listClicks() {
  const store = await getStore();
  return store.clicks;
}
