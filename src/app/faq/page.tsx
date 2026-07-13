import { CaptainStrip } from "@/components/CaptainStrip";
import { faqItems } from "@/data/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Perguntas frequentes",
  description:
    "Dúvidas sobre pedidos, entrega e pagamento — Capitão Fantástico.",
};

export default function FaqPage() {
  return (
    <div className="bg-bg py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Ajuda do Capitão
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
          Perguntas frequentes
        </h1>
        <div className="mt-6">
          <CaptainStrip message="Fale conosco em português. Acompanhamos do pagamento ao rastreio — até o pedido chegar." />
        </div>
        <div className="mt-10 space-y-3">
          {faqItems.map((item) => (
            <details
              key={item.q}
              className="faq-item group rounded-xl border border-line bg-card open:border-gold/40"
            >
              <summary className="cursor-pointer list-none px-5 py-4 font-[family-name:var(--font-syne)] text-lg font-bold text-white marker:content-none">
                {item.q}
              </summary>
              <p className="border-t border-line px-5 py-4 text-sm leading-relaxed text-muted">
                {item.a}
              </p>
            </details>
          ))}
        </div>
      </div>
    </div>
  );
}
