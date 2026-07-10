import type { Metadata } from "next";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Privacidade",
};

export default function PrivacidadePage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-12 md:px-8 md:py-16">
      <h1 className="font-[family-name:var(--font-syne)] text-3xl font-bold text-white md:text-4xl">
        Política de privacidade
      </h1>
      <p className="mt-2 text-sm text-muted">
        LGPD · {siteConfig.company}
      </p>
      <div className="mt-8 space-y-6 text-sm leading-relaxed text-[#bbb]">
        <p>
          Coletamos nome, e-mail, telefone/WhatsApp e endereço de entrega para
          processar pedidos, pagamento (via Mercado Pago) e envio pelo fornecedor.
        </p>
        <p>
          Dados de pagamento (cartão) são tratados pelo Mercado Pago — não
          armazenamos número de cartão em nossos servidores.
        </p>
        <p>
          Usamos cookies/localStorage apenas para carrinho e preferências da loja.
          Cliques em WhatsApp podem ser registrados para melhorar o atendimento.
        </p>
        <p>
          Você pode solicitar acesso, correção ou exclusão dos seus dados pelo
          e-mail {siteConfig.email}.
        </p>
        <p>
          Controladora: {siteConfig.company}, CNPJ {siteConfig.cnpj}.
        </p>
      </div>
      <Link href="/" className="mt-10 inline-block text-sm font-semibold text-gold">
        ← Voltar
      </Link>
    </div>
  );
}
