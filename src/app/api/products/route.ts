import { NextResponse } from "next/server";
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
