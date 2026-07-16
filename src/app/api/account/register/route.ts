import { NextResponse } from "next/server";
import {
  createCustomerSession,
  loginCustomer,
  publicCustomerView,
  registerCustomer,
} from "@/lib/customer-auth";

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      phone?: string;
      password?: string;
    };
    const customer = await registerCustomer({
      name: String(body.name || ""),
      email: String(body.email || ""),
      phone: body.phone,
      password: String(body.password || ""),
    });
    const session = createCustomerSession(customer.id);
    return NextResponse.json({
      ok: true,
      ...session,
      user: publicCustomerView(customer),
    });
  } catch (e) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Falha no cadastro" },
      { status: 400 },
    );
  }
}
