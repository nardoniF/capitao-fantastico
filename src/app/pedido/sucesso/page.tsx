import type { Metadata } from "next";
import { Suspense } from "react";
import { OrderSuccessClient } from "@/components/OrderSuccessClient";

export const metadata: Metadata = {
  title: "Pedido recebido",
};

export default function OrderSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-2xl px-5 py-20 text-center text-muted">
          Carregando…
        </div>
      }
    >
      <OrderSuccessClient />
    </Suspense>
  );
}
