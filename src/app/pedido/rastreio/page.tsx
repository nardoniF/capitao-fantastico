import { Suspense } from "react";
import { OrderTrackingClient } from "@/components/OrderTrackingClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Rastreio do pedido | Capitão Fantástico",
  description:
    "Acompanhe seu pedido com status ao vivo. Suporte em português até a entrega.",
};

type Props = { searchParams: Promise<{ pedido?: string }> };

export default async function PedidoRastreioPage({ searchParams }: Props) {
  const { pedido } = await searchParams;
  return (
    <div className="bg-bg min-h-[70vh]">
      <Suspense
        fallback={
          <p className="px-5 py-20 text-center text-muted">Carregando…</p>
        }
      >
        <OrderTrackingClient initialPedido={pedido || ""} />
      </Suspense>
    </div>
  );
}
