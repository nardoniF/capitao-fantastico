import { ContactForm } from "@/components/ContactForm";
import { siteConfig, whatsappUrl } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato",
  description:
    "Fale com o Capitão Fantástico — suporte em português por WhatsApp e e-mail.",
};

export default function ContatoPage() {
  return (
    <div className="bg-bg py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Contato
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
          Fale conosco
        </h1>
        <p className="mt-4 text-muted">
          Atendimento da loja {siteConfig.brand} · suporte em português até o
          pedido chegar · {siteConfig.company}
        </p>

        <a
          href="/central"
          className="mt-8 flex items-center justify-between rounded-xl border border-gold/40 bg-gold/5 px-5 py-4 transition hover:border-gold"
        >
          <span>
            <span className="block text-sm font-semibold uppercase tracking-wider text-gold">
              🎩 Central do Capitão
            </span>
            <span className="mt-1 block text-sm text-muted">
              Pedido · troca · devolução · garantia · cancelar · endereço
            </span>
          </span>
          <span className="text-gold">→</span>
        </a>

        <div className="mt-10 grid gap-4 sm:grid-cols-2">
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-xl border border-line bg-card p-6 transition hover:border-gold"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">
              WhatsApp
            </p>
            <p className="mt-2 text-lg font-bold text-white">(11) 98421-5176</p>
          </a>
          <a
            href={`mailto:${siteConfig.email}?subject=${encodeURIComponent("Contato — Capitão Fantástico")}`}
            className="rounded-xl border border-line bg-card p-6 transition hover:border-gold"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">
              E-mail oficial
            </p>
            <p className="mt-2 text-lg font-bold text-white">{siteConfig.email}</p>
            <p className="mt-1 text-xs text-muted">Capitão Fantástico</p>
          </a>
        </div>

        <ContactForm />
      </div>
    </div>
  );
}
