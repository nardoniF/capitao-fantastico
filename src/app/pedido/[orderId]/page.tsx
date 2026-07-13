import { OrderHubClient } from "@/components/OrderHubClient";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ orderId: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { orderId } = await params;
  const code = decodeURIComponent(orderId);
  return {
    title: `Pedido ${code}`,
    description:
      "Acompanhe rastreio, nota fiscal, conversa, devolução, garantia e suporte em um só lugar.",
    robots: { index: false, follow: false },
  };
}

export default async function PedidoHubPage({ params }: Props) {
  const { orderId } = await params;
  return <OrderHubClient orderId={decodeURIComponent(orderId)} />;
}
