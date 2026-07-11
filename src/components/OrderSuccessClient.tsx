"use client";

import Link from "next/link";
import { useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

export function OrderSuccessClient() {
  const { clear } = useCart();
  const searchParams = useSearchParams();
  const demo = searchParams.get("demo") === "1";
  const pending = searchParams.get("pending") === "1";
  const pedido = searchParams.get("pedido") || "";

  useEffect(() => {
    clear();
  }, [clear]);

  return (
    <div className="mx-auto max-w-2xl px-5 py-20 text-center md:px-8">
      <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
        {siteConfig.brand}
      </p>
      <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
        {pending ? "Pagamento em análise" : "Pedido recebido"}
      </h1>
      {pedido ? (
        <p className="mt-3 font-mono text-sm text-gold">Pedido {pedido}</p>
      ) : null}
      <p className="mt-4 text-muted">
        {demo
          ? "Modo demo: configure MP_ACCESS_TOKEN para receber de verdade via Mercado Pago."
          : pending
            ? "Assim que o Pix/cartão confirmar, preparamos o envio. Acompanhe o status no rastreio do site — suporte em português até chegar."
            : "Obrigado! Estamos preparando o seu pedido. Acompanhe o status ao vivo no site; o código de rastreio aparece assim que despacharmos."}
      </p>
      <div className="mt-10 flex flex-wrap justify-center gap-3">
        {pedido ? (
          <Link
            href={`/pedido/rastreio?pedido=${encodeURIComponent(pedido)}`}
            className="inline-flex rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black hover:bg-gold-deep"
          >
            Acompanhar pedido
          </Link>
        ) : null}
        <Link
          href="/produtos"
          className="inline-flex rounded-md border border-line px-6 py-3.5 text-sm font-semibold text-white hover:border-gold hover:text-gold"
        >
          Continuar comprando
        </Link>
        <a
          href={whatsappUrl(
            pedido
              ? `Olá! Acabei de fazer o pedido ${pedido} na ${siteConfig.brand}.`
              : `Olá! Acabei de comprar na ${siteConfig.brand}.`,
          )}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex rounded-md border border-line px-6 py-3.5 text-sm font-semibold text-white hover:border-gold hover:text-gold"
        >
          Suporte em português
        </a>
      </div>
    </div>
  );
}
