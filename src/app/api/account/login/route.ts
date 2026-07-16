import { NextResponse } from "next/server";
import {
  createCustomerSession,
  loginCustomer,
  publicCustomerView,
} from "@/lib/customer-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as { email?: string; password?: string };
    const customer = await loginCustomer(
      String(body.email || ""),
      String(body.password || ""),
    );
    const session = createCustomerSession(customer.id);
    return NextResponse.json({
      ok: true,
      ...session,
      user: publicCustomerView(customer),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no login" },
      { status: 401 },
    );
  }
}
