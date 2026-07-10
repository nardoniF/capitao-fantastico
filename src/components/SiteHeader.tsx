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
          ? "absolute inset-x-0 top-0 z-30 border-b border-white/10 bg-black/70 backdrop-blur-md"
          : "sticky top-0 z-30 border-b border-line bg-black/95 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3 md:px-8 md:py-3.5">
        <Link href="/" className="flex items-center gap-2" aria-label={siteConfig.brand}>
          <Image
            src="/brand/logo.png"
            alt={siteConfig.brand}
            width={200}
            height={56}
            className="h-11 w-auto object-contain md:h-12"
            priority
          />
        </Link>
        <nav className="flex items-center gap-4 text-sm font-medium text-white/80 md:gap-6">
          <Link href="/produtos" className="hidden transition hover:text-gold sm:inline">
            Produtos
          </Link>
          <Link href="/#lar" className="hidden transition hover:text-gold md:inline">
            Lar
          </Link>
          <Link href="/#tech" className="hidden transition hover:text-gold md:inline">
            Tech
          </Link>
          <Link
            href="/carrinho"
            className="relative rounded-md bg-gold px-3.5 py-2 font-semibold text-black transition hover:bg-gold-deep"
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
