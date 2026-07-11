import type { Metadata } from "next";
import { SuggestionForm } from "@/components/SuggestionForm";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Sugestões",
  description:
    "Sugira produtos, diga o que faltou no site ou envie uma reclamação para o Capitão Fantástico.",
};

export default function SugestoesPage() {
  return (
    <div className="bg-bg py-12 md:py-16">
      <div className="mx-auto max-w-2xl px-5 md:px-6">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Ouvidoria do Capitão
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
          Sugestões e reclamações
        </h1>
        <p className="mt-4 text-muted">
          Não achou o produto? Tem ideia do que vender? Algo faltou no site?
          Conta pra gente — nome, e-mail e a mensagem. A {siteConfig.brand} lê
          tudo.
        </p>

        <div className="mt-8">
          <SuggestionForm />
        </div>
      </div>
    </div>
  );
}
