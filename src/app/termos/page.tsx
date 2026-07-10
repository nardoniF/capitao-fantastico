import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Termos de uso",
};

export default function TermosPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
        Termos de uso
      </h1>
      <p className="mt-2 text-sm text-muted">
        {siteConfig.company} · CNPJ {siteConfig.cnpj}
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#bbb]">
        <p>
          Ao comprar na loja {siteConfig.brand}, você adquire produtos comercializados
          pela {siteConfig.company}. Após o pagamento, o pedido é preparado e enviado
          ao endereço informado no checkout.
        </p>
        <p>
          Preços, disponibilidade e prazos podem variar. O prazo de entrega é
          confirmado após a compra, conforme o produto e a sua região.
        </p>
        <p>
          Pagamentos são processados pelo Mercado Pago (Pix e cartão). Em caso de
          não aprovação do pagamento, o pedido não é enviado.
        </p>
        <p>
          Direito de arrependimento: 7 dias após o recebimento (CDC), com produto
          sem uso e na embalagem original. Contato: {siteConfig.email}.
        </p>
        <p>
          Nota fiscal emitida pela {siteConfig.company}, conforme legislação
          aplicável.
        </p>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm font-semibold text-gold">
        ← Voltar
      </Link>
    </div>
  );
}
