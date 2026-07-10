import { NextResponse } from "next/server";
import {
  getStore,
  listClicks,
  listOrders,
  saveStore,
  updateOrder,
  upsertProduct,
} from "@/lib/store-db";
import type { StoreProduct } from "@/lib/store-types";

function unauthorized() {
  return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
}

function checkAuth(request: Request) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  const header = request.headers.get("x-admin-password") || "";
  return header === expected;
}

export async function GET(request: Request) {
  if (!checkAuth(request)) return unauthorized();
  const store = await getStore();
  const url = new URL(request.url);
  const tab = url.searchParams.get("tab") || "all";

  if (tab === "orders") return NextResponse.json({ orders: await listOrders() });
  if (tab === "clicks") return NextResponse.json({ clicks: await listClicks() });
  if (tab === "products") return NextResponse.json({ products: store.products });

  return NextResponse.json({
    products: store.products,
    orders: store.orders,
    clicks: store.clicks.slice(0, 200),
    updatedAt: store.updatedAt,
  });
}

export async function PUT(request: Request) {
  if (!checkAuth(request)) return unauthorized();
  const body = (await request.json()) as {
    action?: string;
    product?: StoreProduct;
    orderId?: string;
    patch?: Record<string, unknown>;
  };

  if (body.action === "upsert_product" && body.product) {
    const product = await upsertProduct(body.product);
    return NextResponse.json({ product });
  }

  if (body.action === "update_order" && body.orderId && body.patch) {
    const order = await updateOrder(body.orderId, body.patch);
    if (!order) return NextResponse.json({ error: "Pedido não encontrado" }, { status: 404 });
    return NextResponse.json({ order });
  }

  if (body.action === "replace_products" && Array.isArray(body.product)) {
    // unused
  }

  if (body.action === "set_products" && Array.isArray((body as { products?: StoreProduct[] }).products)) {
    const store = await getStore();
    store.products = (body as { products: StoreProduct[] }).products;
    await saveStore(store);
    return NextResponse.json({ ok: true, count: store.products.length });
  }

  return NextResponse.json({ error: "Ação inválida" }, { status: 400 });
}
