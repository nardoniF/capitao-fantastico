import { MercadoPagoConfig, Preference } from "mercadopago";
import { NextResponse } from "next/server";

type CheckoutItem = {
  id: string;
  title: string;
  quantity: number;
  unit_price: number;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as {
      name?: string;
      email?: string;
      orderId?: string;
      items?: CheckoutItem[];
    };

    const items = body.items?.filter(
      (i) => i.quantity > 0 && i.unit_price > 0 && i.title,
    );

    if (!items?.length) {
      return NextResponse.json({ error: "Carrinho inválido" }, { status: 400 });
    }

    if (!body.orderId) {
      return NextResponse.json({ error: "orderId obrigatório" }, { status: 400 });
    }

    const token = process.env.MP_ACCESS_TOKEN?.trim();
    const origin =
      process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ||
      request.headers.get("origin") ||
      "http://127.0.0.1:3001";

    if (!token) {
      return NextResponse.json({
        demo: true,
        message:
          "MP_ACCESS_TOKEN não configurado. Pedido simulado com sucesso.",
      });
    }

    const client = new MercadoPagoConfig({ accessToken: token });
    const preference = new Preference(client);

    const result = await preference.create({
      body: {
        items: items.map((i) => ({
          id: i.id,
          title: i.title,
          quantity: i.quantity,
          unit_price: Number(i.unit_price.toFixed(2)),
          currency_id: "BRL",
        })),
        payer: {
          name: body.name,
          email: body.email,
        },
        external_reference: body.orderId,
        notification_url: `${origin}/api/webhooks/mercadopago`,
        back_urls: {
          success: `${origin}/pedido/sucesso?pedido=${encodeURIComponent(body.orderId)}`,
          failure: `${origin}/checkout?status=failure`,
          pending: `${origin}/pedido/sucesso?pending=1&pedido=${encodeURIComponent(body.orderId)}`,
        },
        auto_return: "approved",
        statement_descriptor: "CAPITAO FANTASTICO",
        metadata: {
          order_id: body.orderId,
        },
      },
    });

    return NextResponse.json({
      id: result.id,
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });
  } catch (error) {
    console.error("checkout error", error);
    return NextResponse.json(
      { error: "Não foi possível criar o pagamento" },
      { status: 500 },
    );
  }
}
