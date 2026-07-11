"use client";

import { whatsappUrl } from "@/lib/site-config";

function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M17.472 14.382c-.297-.139-1.633-.807-1.886-.899-.253-.093-.437-.139-.62.14-.184.279-.713.899-.873 1.084-.16.184-.32.209-.593.07-.272-.14-1.148-.423-2.186-1.35-.808-.719-1.353-1.608-1.512-1.88-.16-.272-.017-.42.122-.558.126-.125.279-.326.418-.489.139-.163.185-.279.278-.465.093-.186.047-.348-.023-.488-.07-.139-.62-1.495-.85-2.047-.224-.54-.451-.466-.62-.475l-.528-.01c-.186 0-.488.07-.744.348-.255.279-.977.954-.977 2.33 0 1.377 1.001 2.705 1.14 2.891.139.186 2.155 3.293 5.22 4.614.729.315 1.298.504 1.741.645.732.233 1.398.2 1.925.121.587-.088 1.633-.668 1.863-1.313.23-.645.23-1.198.16-1.313-.07-.116-.255-.186-.553-.325m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
    </svg>
  );
}

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
      className="fixed bottom-6 right-6 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25d366] text-white shadow-lg transition hover:scale-105 hover:bg-[#20bd5a]"
    >
      <WhatsAppIcon className="h-8 w-8" />
    </a>
  );
}
