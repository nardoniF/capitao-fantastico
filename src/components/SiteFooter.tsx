import { siteConfig, whatsappUrl } from "@/lib/site-config";
import Link from "next/link";

export function SiteFooter() {
  return (
    <footer className="bg-ink text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8 md:py-16">
        <div>
          <p className="font-[family-name:var(--font-syne)] text-3xl font-extrabold tracking-tight md:text-4xl">
            {siteConfig.brand}
          </p>
          <p className="mt-3 max-w-sm text-sm leading-relaxed text-white/65">
            {siteConfig.slogan}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/produtos"
              className="inline-flex rounded-md bg-signal px-5 py-3 text-sm font-bold text-ink transition hover:bg-signal-deep"
            >
              Comprar agora
            </Link>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md border border-white/25 px-5 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <div className="text-sm text-white/55">
          <p>{siteConfig.company}</p>
          <p className="mt-1">CNPJ {siteConfig.cnpj}</p>
          <p className="mt-1">
            <a
              className="underline-offset-2 hover:text-white hover:underline"
              href={`mailto:${siteConfig.email}`}
            >
              {siteConfig.email}
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
