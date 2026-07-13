import type { Metadata } from "next";
import { MissionClient } from "@/components/MissionClient";

export const metadata: Metadata = {
  title: "Missão concluída?",
  description: "Conte ao Capitão se o pedido chegou bem.",
  robots: { index: false, follow: false },
};

export default function MissaoPage() {
  return <MissionClient />;
}
