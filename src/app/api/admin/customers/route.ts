import { NextResponse } from "next/server";
import { isAdminAuthorized } from "@/lib/admin-auth";
import { listCustomers } from "@/lib/customer-auth";

export async function GET(request: Request) {
  if (!(await isAdminAuthorized(request))) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  const customers = await listCustomers(300);
  return NextResponse.json({
    customers: customers.map((c) => ({
      id: c.id,
      name: c.name,
      email: c.email,
      phone: c.phone,
      ordersCount: c._count.orders,
      createdAt: c.createdAt.toISOString(),
    })),
    total: customers.length,
  });
}
