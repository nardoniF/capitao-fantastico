import { aboutContent } from "@/data/content";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Quem somos",
  description: aboutContent.lead,
};

export default function SobrePage() {
  return (
    <div className="bg-bg py-14 md:py-20">
      <div className="mx-auto max-w-3xl px-5 md:px-8">
        <p className="text-sm font-semibold uppercase tracking-[0.18em] text-gold">
          Capitão Fantástico
        </p>
        <h1 className="mt-3 font-[family-name:var(--font-syne)] text-4xl font-bold text-white">
          {aboutContent.title}
        </h1>
        <p className="mt-4 text-lg text-muted">{aboutContent.lead}</p>
        <div className="mt-10 space-y-5 text-base leading-relaxed text-muted">
          {aboutContent.paragraphs.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
      </div>
    </div>
  );
}
