import Link from "next/link";
import { captainSections } from "@/data/captain";

/** Faixa de destinos logo abaixo do banner. */
export function CaptainSectionNav() {
  return (
    <nav
      aria-label="Mundos do Capitão"
      className="border-b border-line bg-[#0d0d0d]"
    >
      <div className="mx-auto flex max-w-[1200px] gap-2 overflow-x-auto px-5 py-4 md:flex-wrap md:overflow-visible md:px-6">
        {captainSections.map((s) => (
          <Link
            key={s.id}
            href={s.href}
            className="shrink-0 rounded-md border border-[#333] bg-[#1a1a1a] px-3.5 py-2 text-sm font-semibold text-white transition hover:border-gold hover:text-gold"
          >
            {s.label}
          </Link>
        ))}
        <Link
          href="/sobre"
          className="shrink-0 rounded-md border border-gold/40 px-3.5 py-2 text-sm font-semibold text-gold transition hover:bg-gold hover:text-black"
        >
          Quem Somos
        </Link>
        <Link
          href="/contato"
          className="shrink-0 rounded-md border border-[#333] px-3.5 py-2 text-sm font-semibold text-muted transition hover:border-gold hover:text-gold"
        >
          Contato
        </Link>
      </div>
    </nav>
  );
}
