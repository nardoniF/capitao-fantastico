import Image from "next/image";
import Link from "next/link";
import { siteConfig, whatsappUrl } from "@/lib/site-config";

export function SiteFooter() {
  return (
    <footer className="border-t border-line bg-black text-white">
      <div className="mx-auto max-w-[1200px] px-5 py-12 md:px-6">
        <div className="flex flex-col gap-8 md:flex-row md:items-start md:justify-between">
          <div className="flex items-center gap-3">
            <Image
              src="/brand/logo-mark.png"
              alt=""
              width={56}
              height={56}
              className="h-14 w-14 rounded-full object-cover ring-1 ring-gold/40"
            />
            <div>
              <p className="font-black tracking-wide">
                CAPITÃO<span className="text-gold"> FANTÁSTICO</span>
              </p>
              <p className="text-sm text-[#888]">{siteConfig.slogan}</p>
              <p className="mt-1 max-w-sm text-xs text-[#666]">
                {siteConfig.tagline} Suporte em português até chegar.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/produtos"
              className="rounded-md bg-gold px-5 py-2.5 text-sm font-bold text-black hover:bg-gold-deep"
            >
              Ver Produtos Aprovados
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
              <Link href="/sobre" className="hover:text-gold">
                Quem somos
              </Link>
              <Link href="/contato" className="hover:text-gold">
                Contato
              </Link>
              <Link href="/faq" className="hover:text-gold">
                FAQ
              </Link>
              <Link href="/pedido/rastreio" className="hover:text-gold">
                Rastreio
              </Link>
              <Link href="/sugestoes" className="hover:text-gold">
                Sugestões
              </Link>
              <Link href="/termos" className="hover:text-gold">
                Termos
              </Link>
              <Link href="/privacidade" className="hover:text-gold">
                Privacidade
              </Link>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
