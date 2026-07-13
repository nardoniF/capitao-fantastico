import { NextResponse } from "next/server";
import {
  listAdminOrders,
  listAdminProducts,
} from "@/lib/admin-data";
import { listClicks } from "@/lib/store-db";

function authorized(request: Request) {
  const expected = process.env.ADMIN_PASSWORD?.trim();
  if (!expected) return false;
  const header = request.headers.get("x-admin-password");
  return header === expected;
}

function csvEscape(v: unknown) {
  const s = v == null ? "" : String(v);
  if (/[",\n;]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function toCsv(rows: Record<string, unknown>[]) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const lines = [
    keys.join(","),
    ...rows.map((r) => keys.map((k) => csvEscape(r[k])).join(",")),
  ];
  return lines.join("\n");
}

/**
 * Export CSV: ?type=orders|clicks|products
 * Header: x-admin-password
 */
export async function GET(request: Request) {
  if (!authorized(request)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const type = new URL(request.url).searchParams.get("type") || "orders";
  let csv = "";
  let filename = "export.csv";

  if (type === "orders") {
    const orders = await listAdminOrders();
    csv = toCsv(
      orders.map((o) => ({
        orderId: o.orderId,
        createdAt: o.createdAt,
        status: o.status,
        nome: o.nome,
        email: o.email,
        charged: o.charged,
        costPaid: o.costPaid,
        mpFee: o.mpFee,
        commission: o.commission,
        paymentRef: o.paymentRef || "",
        tracking: o.supplierTracking || "",
      })),
    );
    filename = `vendas-${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (type === "clicks") {
    const clicks = await listClicks();
    csv = toCsv(
      clicks.map((c) => ({
        id: c.id,
        createdAt: c.createdAt,
        tipo: c.tipo,
        rotulo: c.rotulo || "",
        pagina: c.pagina || "",
        href: c.href || "",
        secao: c.secao || "",
      })),
    );
    filename = `cliques-${new Date().toISOString().slice(0, 10)}.csv`;
  } else if (type === "products") {
    const products = await listAdminProducts();
    csv = toCsv(
      products.map((p) => ({
        id: p.id,
        slug: p.slug,
        name: p.name,
        category: p.category,
        active: p.active,
        costUsd: p.costUsd,
        shippingUsd: p.shippingUsd,
        costBrl: p.costBrl,
        salePrice: p.salePrice,
        marginBrl: p.marginBrl,
        marginPct: p.marginPct,
        netAfterMpBrl: p.netAfterMpBrl,
      })),
    );
    filename = `produtos-${new Date().toISOString().slice(0, 10)}.csv`;
  } else {
    return NextResponse.json({ error: "type inválido" }, { status: 400 });
  }

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
