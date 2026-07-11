import Image from "next/image";
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

      <div className="mx-auto grid max-w-[1200px] items-center gap-8 px-5 py-12 md:grid-cols-[1.15fr_0.85fr] md:gap-10 md:px-6 md:py-16 lg:py-20">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-gold">
            {siteConfig.brand}
          </p>
          <h1 className="mt-3 max-w-xl font-[family-name:var(--font-syne)] text-3xl font-bold leading-tight md:text-5xl">
            {siteConfig.slogan}
          </h1>
          <p className="mt-4 max-w-lg text-base text-muted md:text-lg">
            {siteConfig.positioning}
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/produtos"
              className="inline-flex rounded-md bg-gold px-6 py-3 text-sm font-bold text-black hover:bg-gold-deep"
            >
              Ver aprovados
            </Link>
            <Link
              href="/#novidades"
              className="inline-flex rounded-md border border-white/25 px-6 py-3 text-sm font-semibold text-white hover:border-gold hover:text-gold"
            >
              Novidades
            </Link>
          </div>
        </div>

        <div className="relative mx-auto w-full max-w-[280px] md:max-w-[320px] lg:max-w-[360px]">
          <div
            aria-hidden
            className="pointer-events-none absolute left-1/2 top-1/2 h-[78%] w-[78%] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/25 blur-3xl"
          />
          <Image
            src="/brand/logo.png"
            alt="Capitão Fantástico"
            width={1024}
            height={1024}
            priority
            className="relative h-auto w-full drop-shadow-[0_0_48px_rgba(255,193,7,0.28)]"
            sizes="(max-width: 768px) 280px, 360px"
          />
        </div>
      </div>
    </section>
  );
}
