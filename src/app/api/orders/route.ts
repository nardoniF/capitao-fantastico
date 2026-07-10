import { NextResponse } from "next/server";
import { createOrder, getProductById } from "@/lib/store-db";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      nome?: string;
      email?: string;
      telefone?: string;
      items?: { productId: string; qty: number }[];
    };

    if (!body.nome || !body.email || !body.items?.length) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const lines = [];
    for (const item of body.items) {
      const product = await getProductById(item.productId);
      if (!product || !product.active) continue;
      lines.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        qty: Math.max(1, item.qty),
      });
    }

    if (!lines.length) {
      return NextResponse.json({ error: "Itens inválidos" }, { status: 400 });
    }

    const subtotal = lines.reduce((s, l) => s + l.price * l.qty, 0);
    const order = await createOrder({
      nome: body.nome,
      email: body.email,
      telefone: body.telefone,
      items: lines,
      subtotal,
      total: subtotal,
      status: "pending_payment",
      notes: "Dropshipping — frete/envio pelo fornecedor após pagamento",
    });

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Falha ao criar pedido" }, { status: 500 });
  }
}
