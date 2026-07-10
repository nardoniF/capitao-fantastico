"use client";

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
          ? "absolute inset-x-0 top-0 z-30"
          : "sticky top-0 z-30 border-b border-ink/10 bg-paper/95 backdrop-blur"
      }
    >
      <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 md:px-8">
        <Link
          href="/"
          className={`font-[family-name:var(--font-syne)] text-lg font-extrabold tracking-tight md:text-xl ${
            onHero ? "text-white" : "text-ink"
          }`}
        >
          {siteConfig.brand}
        </Link>
        <nav
          className={`flex items-center gap-4 text-sm font-medium md:gap-6 ${
            onHero ? "text-white/85" : "text-ink-soft"
          }`}
        >
          <Link href="/produtos" className="hidden transition hover:opacity-100 sm:inline opacity-90">
            Produtos
          </Link>
          <Link href="/#lar" className="hidden transition hover:opacity-100 md:inline opacity-90">
            Lar
          </Link>
          <Link href="/#tech" className="hidden transition hover:opacity-100 md:inline opacity-90">
            Tech
          </Link>
          <Link
            href="/carrinho"
            className={`relative rounded-md px-3.5 py-2 font-semibold transition ${
              onHero
                ? "bg-signal text-ink hover:bg-signal-deep"
                : "bg-ink text-white hover:bg-ink-soft"
            }`}
          >
            Carrinho
            {count > 0 ? (
              <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-signal px-1 text-[11px] font-bold text-ink">
                {count}
              </span>
            ) : null}
          </Link>
        </nav>
      </div>
    </header>
  );
}
