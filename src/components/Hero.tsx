import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Hero() {
  return (
    <section
      id="topo"
      className="relative isolate min-h-[100svh] overflow-hidden bg-black text-white"
    >
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=2400&q=80"
          alt="Ambiente de sala moderna"
          className="hero-media h-full w-full object-cover opacity-50"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black via-black/90 to-black/50" />
        <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/50" />
      </div>

      <div className="mx-auto flex min-h-[100svh] max-w-6xl flex-col justify-end px-5 pb-16 pt-28 md:justify-center md:px-8 md:pb-24 md:pt-32">
        <Image
          src="/brand/logo.png"
          alt={siteConfig.brand}
          width={720}
          height={200}
          priority
          className="animate-rise h-auto w-full max-w-xl object-contain md:max-w-2xl"
        />
        <div className="hero-rule mt-5 h-1 w-40 rounded-full bg-gold md:mt-6 md:w-56" />
        <h1 className="animate-rise-delay-1 mt-6 max-w-xl font-[family-name:var(--font-syne)] text-2xl font-bold leading-tight text-white md:text-3xl">
          Lar mais fácil. Tech que obedece.
        </h1>
        <p className="animate-rise-delay-2 mt-4 max-w-md text-base leading-relaxed text-muted md:text-lg">
          Produtos incríveis. Soluções inteligentes.
        </p>
        <div className="animate-rise-delay-3 mt-8 flex flex-wrap items-center gap-3">
          <Link
            href="/produtos"
            className="inline-flex items-center justify-center rounded-md bg-gold px-6 py-3.5 text-sm font-bold text-black transition hover:bg-gold-deep"
          >
            Ver produtos
          </Link>
          <Link
            href="/#vitrine"
            className="inline-flex items-center justify-center rounded-md border border-white/25 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-gold hover:text-gold"
          >
            Ver vitrine
          </Link>
        </div>
      </div>
    </section>
  );
}
