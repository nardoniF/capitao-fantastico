"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { siteConfig } from "@/lib/site-config";
import { useCart } from "@/components/CartProvider";

export function SiteHeader({ variant = "solid" }: { variant?: "solid" | "hero" }) {
  const { count } = useCart();
  const pathname = usePathname();
  const onHero = variant === "hero" && pathname === "/";

  return (
    <header
      className={
        onHero
          ? "absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-black/90 backdrop-blur-md"
          : "sticky top-0 z-30 border-b border-line bg-black/95 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-[1200px] items-center gap-4 px-5 py-2 md:px-6">
        <Link href="/" className="flex min-w-0 items-center gap-3" aria-label={siteConfig.brand}>
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={56}
            height={56}
            className="h-12 w-12 shrink-0 rounded-full object-cover md:h-14 md:w-14"
            priority
          />
          <span className="min-w-0 leading-tight">
            <span className="block truncate text-[1.05rem] font-black tracking-wide text-white md:text-[1.25rem]">
              CAPITÃO<span className="text-gold"> FANTÁSTICO</span>
            </span>
            <span className="hidden text-[0.72rem] italic text-[#c4c4c4] sm:block">
              Só entra o que o Capitão aprova.
            </span>
          </span>
        </Link>
        <nav className="ml-auto flex shrink-0 items-center gap-3 text-sm font-medium text-white/80 md:gap-5">
          <Link href="/produtos" className="hidden transition hover:text-gold sm:inline">
            Produtos
          </Link>
          <Link href="/central" className="hidden transition hover:text-gold sm:inline">
            Central
          </Link>
          <Link href="/sobre" className="hidden transition hover:text-gold md:inline">
            Quem somos
          </Link>
          <Link href="/faq" className="hidden transition hover:text-gold md:inline">
            FAQ
          </Link>
          <Link href="/contato" className="hidden transition hover:text-gold lg:inline">
            Contato
          </Link>
          <Link href="/sugestoes" className="hidden transition hover:text-gold xl:inline">
            Sugestões
          </Link>
          <Link
            href="/carrinho"
            data-evento="clique_carrinho"
            data-rotulo="Header Carrinho"
            data-secao="header"
            className="relative rounded-md bg-gold px-3 py-2 font-semibold text-black transition hover:bg-gold-deep"
          >
            Carrinho
            {count > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-white px-1 text-[11px] font-bold text-black">
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
