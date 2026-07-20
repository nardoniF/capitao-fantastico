import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Manutenção — Capitão Fantástico",
  description: "Estamos ajustando a loja. Voltamos em breve.",
  robots: { index: false, follow: false },
};

export default function ManutencaoPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-bg px-6 py-16 text-center text-text">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
        {siteConfig.brand}
      </p>
      <h1 className="mt-4 max-w-lg font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight md:text-4xl">
        Loja em manutenção
      </h1>
      <p className="mt-4 max-w-md text-muted">
        Estamos atualizando o catálogo e os sistemas para voltar com tudo
        funcionando. Nenhuma compra está disponível neste momento.
      </p>
      <p className="mt-2 text-sm text-muted">Voltamos em breve.</p>
      <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
        <a
          href={whatsappUrl(
            "Olá! Vi que a loja está em manutenção. Quando voltam?",
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="rounded-md bg-gold px-6 py-3 text-sm font-bold text-black hover:bg-gold-deep"
        >
          WhatsApp
        </a>
        <Link
          href="/admin"
          className="rounded-md border border-line px-6 py-3 text-sm font-semibold text-muted hover:border-gold hover:text-gold"
        >
          Admin
        </Link>
      </div>
      <p className="mt-12 text-xs text-muted">
        {siteConfig.company} · CNPJ {siteConfig.cnpj}
      </p>
    </main>
  );
}
