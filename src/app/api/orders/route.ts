import { NextResponse } from "next/server";
import { createOrder, getProductById } from "@/lib/store-db";
import type { ShippingAddress } from "@/lib/store-types";

function normalizeCep(cep: string) {
  return cep.replace(/\D/g, "").slice(0, 8);
}

function parseAddress(raw: unknown): ShippingAddress | null {
  if (!raw || typeof raw !== "object") return null;
  const a = raw as Record<string, string>;
  const cep = normalizeCep(a.cep || "");
  const rua = (a.rua || "").trim();
  const numero = (a.numero || "").trim();
  const bairro = (a.bairro || "").trim();
  const cidade = (a.cidade || "").trim();
  const uf = (a.uf || "").trim().toUpperCase().slice(0, 2);
  if (cep.length !== 8 || !rua || !numero || !bairro || !cidade || uf.length !== 2) {
    return null;
  }
  return {
    cep: `${cep.slice(0, 5)}-${cep.slice(5)}`,
    rua,
    numero,
    complemento: (a.complemento || "").trim() || undefined,
    bairro,
    cidade,
    uf,
  };
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      nome?: string;
      email?: string;
      telefone?: string;
      endereco?: unknown;
      items?: { productId: string; qty: number }[];
    };

    if (!body.nome || !body.email || !body.items?.length) {
      return NextResponse.json({ error: "Dados incompletos" }, { status: 400 });
    }

    const endereco = parseAddress(body.endereco);
    if (!endereco) {
      return NextResponse.json(
        { error: "Endereço incompleto (CEP, rua, número, bairro, cidade, UF)" },
        { status: 400 },
      );
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
      nome: body.nome.trim(),
      email: body.email.trim().toLowerCase(),
      telefone: body.telefone?.trim(),
      endereco,
      items: lines,
      subtotal,
      total: subtotal,
      status: "pending_payment",
      notes: "Pedido loja — processar envio e colar rastreio no admin",
    });

    return NextResponse.json({ order });
  } catch {
    return NextResponse.json({ error: "Falha ao criar pedido" }, { status: 500 });
  }
}
