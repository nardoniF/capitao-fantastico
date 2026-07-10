import { siteConfig, whatsappUrl } from "@/lib/site-config";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Contato",
  description: "Fale com o Capitão Fantástico — WhatsApp e e-mail.",
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
          Atendimento da loja Capitão Fantástico · {siteConfig.company}
        </p>

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
            href={`mailto:${siteConfig.email}`}
            className="rounded-xl border border-line bg-card p-6 transition hover:border-gold"
          >
            <p className="text-sm font-semibold uppercase tracking-wider text-gold">
              E-mail
            </p>
            <p className="mt-2 text-lg font-bold text-white">{siteConfig.email}</p>
          </a>
        </div>

        <form
          action={`https://formsubmit.co/${siteConfig.email}`}
          method="POST"
          className="mt-10 space-y-4 rounded-xl border border-line bg-card p-6"
        >
          <input type="hidden" name="_subject" value="Contato — Capitão Fantástico" />
          <input type="hidden" name="_captcha" value="false" />
          <label className="block text-sm text-white">
            Nome
            <input
              required
              name="name"
              className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white"
            />
          </label>
          <label className="block text-sm text-white">
            E-mail
            <input
              required
              type="email"
              name="email"
              className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white"
            />
          </label>
          <label className="block text-sm text-white">
            Mensagem
            <textarea
              required
              name="message"
              rows={4}
              className="mt-1 w-full rounded-md border border-line bg-card-2 px-3 py-2.5 text-white"
            />
          </label>
          <button
            type="submit"
            className="rounded-md bg-gold px-6 py-3 text-sm font-bold text-black hover:bg-gold-deep"
          >
            Enviar
          </button>
        </form>
      </div>
    </div>
  );
}
