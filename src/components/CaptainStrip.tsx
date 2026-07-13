import Image from "next/image";
import Link from "next/link";
import { siteConfig } from "@/lib/site-config";

/** Faixa do personagem — presença em páginas internas. */
export function CaptainStrip({
  message = "Suporte em português até chegar. Rastreio no site. Só o que o Capitão aprova.",
}: {
  message?: string;
}) {
  return (
    <div className="flex items-center gap-3 rounded-[14px] border border-gold/30 bg-gold/5 px-4 py-3">
      <Image
        src="/brand/logo-mark.png"
        alt=""
        width={40}
        height={40}
        className="h-10 w-10 shrink-0 rounded-full object-cover ring-1 ring-gold/40"
      />
      <div className="min-w-0">
        <p className="text-xs font-bold uppercase tracking-wider text-gold">
          {siteConfig.brand}
        </p>
        <p className="text-sm text-[#ccc]">{message}</p>
      </div>
      <Link
        href="/faq"
        className="ml-auto hidden shrink-0 text-xs font-semibold text-gold hover:underline sm:inline"
      >
        FAQ
      </Link>
    </div>
  );
}
