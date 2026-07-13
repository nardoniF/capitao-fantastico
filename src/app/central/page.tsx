import { Suspense } from "react";
import { CaptainCentral } from "@/components/CaptainCentral";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Central do Capitão",
  description:
    "Onde está meu pedido, troca, devolução, garantia, cancelar, alterar endereço e falar com o Capitão.",
};

type Props = {
  searchParams: Promise<{ pedido?: string; missao?: string }>;
};

export default async function CentralPage({ searchParams }: Props) {
  const { pedido, missao } = await searchParams;
  return (
    <div className="bg-bg min-h-[70vh]">
      <Suspense
        fallback={
          <p className="px-5 py-20 text-center text-muted">Abrindo a Central…</p>
        }
      >
        <CaptainCentral
          initialPedido={pedido || ""}
          initialMission={missao || ""}
        />
      </Suspense>
    </div>
  );
}
