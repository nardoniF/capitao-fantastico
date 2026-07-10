import Image from "next/image";
import Link from "next/link";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-black text-white">
      <div className="mx-auto flex max-w-6xl flex-col gap-8 px-5 py-14 md:flex-row md:items-end md:justify-between md:px-8 md:py-16">
        <div>
          <Image
            src="/brand/logo.png"
            alt={siteConfig.brand}
            width={280}
            height={80}
            className="h-16 w-auto object-contain md:h-20"
          />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted">
            {siteConfig.slogan}
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/produtos"
              className="inline-flex rounded-md bg-gold px-5 py-3 text-sm font-bold text-black transition hover:bg-gold-deep"
            >
              Comprar agora
            </Link>
            <a
              href={whatsappUrl()}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex rounded-md border border-white/20 px-5 py-3 text-sm font-semibold text-white transition hover:border-gold hover:text-gold"
            >
              WhatsApp
            </a>
          </div>
        </div>
        <div className="text-sm text-muted">
          <p>{siteConfig.company}</p>
          <p className="mt-1">CNPJ {siteConfig.cnpj}</p>
          <p className="mt-1">
            <a
              className="underline-offset-2 hover:text-gold hover:underline"
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
