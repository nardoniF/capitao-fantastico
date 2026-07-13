import { redirect } from "next/navigation";
import type { Metadata } from "next";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Acompanhar pedido | Capitão Fantástico",
  description:
    "Abra a página do seu pedido: rastreio, NF, conversa, devolução, garantia e suporte.",
};

type Props = { searchParams: Promise<{ pedido?: string }> };

async function openPedido(formData: FormData) {
  "use server";
  const code = String(formData.get("code") || "").trim();
  if (code) redirect(`/pedido/${encodeURIComponent(code)}`);
}

export default async function PedidoRastreioPage({ searchParams }: Props) {
  const { pedido } = await searchParams;
  if (pedido?.trim()) {
    redirect(`/pedido/${encodeURIComponent(pedido.trim())}`);
  }

  return (
    <div className="mx-auto max-w-lg px-5 py-16 md:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
        Pedido
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-syne)] text-3xl font-bold text-white">
        Abrir página do pedido
      </h1>
      <p className="mt-3 text-sm text-muted">
        Digite o código que enviamos por e-mail. Lá você encontra rastreio, NF,
        conversa, devolução, garantia e suporte.
      </p>
      <form action={openPedido} className="mt-8 flex flex-wrap gap-2">
        <input
          name="code"
          required
          placeholder="Código do pedido"
          className="min-w-[200px] flex-1 rounded-md border border-[#333] bg-[#141414] px-4 py-3 text-sm text-white outline-none focus:border-gold"
        />
        <button
          type="submit"
          className="rounded-md bg-gold px-5 py-3 text-sm font-bold text-black hover:bg-gold-deep"
        >
          Abrir
        </button>
      </form>
      <p className="mt-8 text-sm text-muted">
        Exemplo:{" "}
        <span className="font-mono text-white">
          capitaofantastico.com.br/pedido/8FH29JK
        </span>
      </p>
      <Link
        href="/contato"
        className="mt-6 inline-block text-sm text-gold hover:underline"
      >
        Não achou o código? Fale conosco
      </Link>
    </div>
  );
}
