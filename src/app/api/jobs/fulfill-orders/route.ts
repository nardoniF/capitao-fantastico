import { NextResponse } from "next/server";
import { fulfillPaidOrder } from "@/lib/fulfill-order";
import { listOrders } from "@/lib/store-db";

function authorized(request: Request) {
  const secret = process.env.CRON_SECRET?.trim();
  if (!secret) return false;
  const header = request.headers.get("authorization");
  return header === `Bearer ${secret}`;
}

/**
 * Cron: pedidos pagos sem supplierOrderId → cria pedido na CJ.
 * GET/POST /api/jobs/fulfill-orders
 */
export async function GET(request: Request) {
  return run(request);
}

export async function POST(request: Request) {
  return run(request);
}

async function run(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const pending = (await listOrders()).filter(
    (o) =>
      (o.status === "paid" || o.status === "fulfilling") && !o.supplierOrderId,
  );

  const results = [];
  for (const o of pending.slice(0, 20)) {
    results.push(await fulfillPaidOrder(o.orderId));
    await new Promise((r) => setTimeout(r, 800));
  }

  return NextResponse.json({
    ok: true,
    pending: pending.length,
    processed: results.length,
    results,
  });
}
