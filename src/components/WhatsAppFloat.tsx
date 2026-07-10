"use client";

import { whatsappUrl } from "@/lib/site-config";

export function WhatsAppFloat() {
  return (
    <a
      href={whatsappUrl()}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="WhatsApp"
      data-evento="clique_whatsapp"
      onClick={() => {
        void fetch("/api/analytics/click", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            tipo: "whatsapp",
            rotulo: "WhatsApp float",
            secao: "float",
            pagina: typeof window !== "undefined" ? window.location.pathname : "",
          }),
        }).catch(() => undefined);
      }}
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-2xl text-white shadow-lg transition hover:scale-105"
    >
      ✆
    </a>
  );
}
