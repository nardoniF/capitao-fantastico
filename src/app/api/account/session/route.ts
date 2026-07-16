import { NextResponse } from "next/server";
import {
  getCustomerFromRequest,
  publicCustomerView,
} from "@/lib/customer-auth";

export async function GET(request: Request) {
  const customer = await getCustomerFromRequest(request);
  if (!customer) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }
  return NextResponse.json({ ok: true, user: publicCustomerView(customer) });
}
