import Image from "next/image";
import Link from "next/link";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-black text-white">
      <div className="mx-auto flex max-w-[1200px] flex-col gap-8 px-5 py-12 md:flex-row md:items-center md:justify-between md:px-6">
        <div className="flex items-center gap-3">
          <Image
            src="/brand/logo-mark.png"
            alt=""
            width={48}
            height={48}
            className="h-12 w-12 rounded-full object-cover"
          />
          <div>
            <p className="font-black tracking-wide">
              CAPITÃO<span className="text-gold"> FANTÁSTICO</span>
            </p>
            <p className="text-sm text-[#888]">{siteConfig.slogan}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <Link
            href="/produtos"
            className="rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-black hover:bg-gold-deep"
          >
            Comprar
          </Link>
          <a
            href={whatsappUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-md border border-white/20 px-5 py-2.5 text-sm font-semibold hover:border-gold hover:text-gold"
          >
            WhatsApp
          </a>
        </div>
        <div className="text-sm text-[#888]">
          <p>{siteConfig.company}</p>
          <p>CNPJ {siteConfig.cnpj}</p>
          <a className="hover:text-gold" href={`mailto:${siteConfig.email}`}>
            {siteConfig.email}
          </a>
          <p className="mt-2 flex flex-wrap gap-3">
            <Link href="/sugestoes" className="hover:text-gold">
              Sugestões
            </Link>
            <Link href="/termos" className="hover:text-gold">
              Termos
            </Link>
            <Link href="/privacidade" className="hover:text-gold">
              Privacidade
            </Link>
            <Link href="/faq" className="hover:text-gold">
              FAQ
            </Link>
          </p>
        </div>
      </div>
    </footer>
  );
}
