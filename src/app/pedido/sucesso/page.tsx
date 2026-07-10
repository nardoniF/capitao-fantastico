import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pedido recebido",
};

type Props = {
  searchParams: Promise<{ demo?: string; pending?: string }>;
};

export default async function OrderSuccessPage({ searchParams }: Props) {
  const q = await searchParams;
  const demo = q.demo === "1";
  const pending = q.pending === "1";

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center md:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-aqua-deep">
        Capitão Fantástico
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-bold text-ink">
        {pending ? "Pagamento em análise" : "Pedido recebido"}
      </h1>
      <p className="mt-4 text-ink-soft/90">
        {demo
          ? "Modo demo: configure MP_ACCESS_TOKEN no .env.local para receber de verdade via Mercado Pago."
          : pending
            ? "Assim que o Pix/cartão confirmar, seguimos com o envio."
            : "Obrigado! Em breve você recebe a confirmação por e-mail."}
      </p>
      <Link
        href="/produtos"
        className="mt-10 inline-flex rounded-md bg-signal px-6 py-3.5 text-sm font-bold text-ink hover:bg-signal-deep"
      >
        Continuar comprando
      </Link>
    </div>
  );
}
