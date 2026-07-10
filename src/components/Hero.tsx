import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

export function Hero() {
  return (
    <section
      id="topo"
      className="relative isolate overflow-hidden bg-black pt-24 text-white md:pt-28"
    >
      <div className="absolute inset-0 -z-10">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="https://images.unsplash.com/photo-1556912173-46c336c7fd55?auto=format&fit=crop&w=1800&q=70"
          alt=""
          className="h-full w-full object-cover opacity-35"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-black via-black/85 to-black" />
      </div>

      <div className="mx-auto max-w-[1200px] px-5 py-16 md:px-6 md:py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
          {siteConfig.brand}
        </p>
        <h1 className="mt-3 max-w-2xl font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight md:text-5xl">
          Lar mais fácil. Tech que obedece.
        </h1>
        <p className="mt-4 max-w-lg text-base text-muted md:text-lg">
          Utilidades do lar e tecnologia inteligente — sem complicação.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/produtos"
            className="inline-flex rounded-md bg-gold px-6 py-3 text-sm font-bold text-black hover:bg-gold-deep"
          >
            Ver produtos
          </Link>
          <Link
            href="/#vitrine"
            className="inline-flex rounded-md border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
          >
            Ver vitrine
          </Link>
        </div>
      </div>
    </section>
  );
}
