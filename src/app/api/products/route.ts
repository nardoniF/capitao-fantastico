import { NextResponse } from "next/server";
import { listStorefrontComplementary } from "@/lib/catalog";
import { listActiveProducts, getProductById } from "@/lib/store-db";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const ids = url.searchParams.get("ids")?.split(",").filter(Boolean) ?? [];
  const cartIds = url.searchParams.get("cart")?.split(",").filter(Boolean) ?? [];

  if (ids.length) {
    const products = [];
    for (const id of ids) {
      const p = await getProductById(id);
      if (p?.active) products.push(p);
    }
    return NextResponse.json({ products });
  }

  // Upsell: complementares dos itens do carrinho, excluindo o que já está no carrinho
  if (cartIds.length) {
    const fromDb = await listStorefrontComplementary(cartIds);
    if (fromDb.length) {
      return NextResponse.json({
        products: fromDb.map((p) => ({ ...p, active: true, complementaryIds: [] })),
      });
    }

    const cartSet = new Set(cartIds);
    const suggestedIds = new Set<string>();
    for (const id of cartIds) {
      const p = await getProductById(id);
      for (const cid of p?.complementaryIds ?? []) {
        if (!cartSet.has(cid)) suggestedIds.add(cid);
      }
    }
    const products = [];
    for (const id of suggestedIds) {
      const p = await getProductById(id);
      if (p?.active) products.push(p);
    }
    return NextResponse.json({ products });
  }

  const products = await listActiveProducts();
  return NextResponse.json({ products });
}
