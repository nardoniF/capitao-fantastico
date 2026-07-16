import { NextResponse } from "next/server";
import { getCustomerFromRequest, publicCustomerView } from "@/lib/customer-auth";
import { listOrdersByEmail } from "@/lib/store-db";

const STATUS: Record<string, string> = {
  pending_payment: "Aguardando pagamento",
  paid: "Pago",
  fulfilling: "Separando",
  shipped: "Enviado",
  fulfilled: "Entregue",
  cancelled: "Cancelado",
  failed: "Falhou",
};

export async function GET(request: Request) {
  const customer = await getCustomerFromRequest(request);
  if (!customer) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  const rows = await listOrdersByEmail(customer.email);
  return NextResponse.json({
    user: publicCustomerView(customer),
    orders: rows.map((o) => ({
      orderId: o.orderId,
      status: o.status,
      statusLabel: STATUS[o.status] || o.status,
      total: o.total,
      createdAt: o.createdAt,
      supplierTracking: o.supplierTracking,
      items: o.items.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    })),
  });
}
