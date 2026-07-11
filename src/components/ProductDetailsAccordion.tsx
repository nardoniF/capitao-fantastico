"use client";

import { useState, type ReactNode } from "react";
import type { ProductDetails } from "@/lib/product-details";

type Section = {
  id: string;
  title: string;
  body: ReactNode;
};

export function ProductDetailsAccordion({
  description,
  details,
}: {
  description: string;
  details: ProductDetails;
}) {
  const sections: Section[] = [];

  if (details.useCases?.length) {
    sections.push({
      id: "casos",
      title: "Para que serve (casos de uso)",
      body: (
        <ul className="space-y-2">
          {details.useCases.map((u) => (
            <li key={u} className="flex gap-2 text-sm text-[#aaa]">
              <span className="text-gold" aria-hidden>
                →
              </span>
              <span>{u}</span>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (details.longDescription || description) {
    sections.push({
      id: "desc",
      title: "Descrição completa",
      body: (
        <p className="whitespace-pre-wrap leading-relaxed text-[#aaa]">
          {details.longDescription || description}
        </p>
      ),
    });
  }

  if (details.measurements?.length || details.colors?.length || details.sizes?.length) {
    sections.push({
      id: "medidas",
      title: "Medidas, cores e tamanhos",
      body: (
        <div className="space-y-4">
          {details.colors?.length ? (
            <p className="text-sm text-[#aaa]">
              <span className="text-muted">Cores: </span>
              <strong className="text-white">{details.colors.join(" · ")}</strong>
            </p>
          ) : null}
          {details.sizes?.length ? (
            <p className="text-sm text-[#aaa]">
              <span className="text-muted">Tamanhos: </span>
              <strong className="text-white">{details.sizes.join(" · ")}</strong>
            </p>
          ) : null}
          {details.measurements?.length ? (
            <ul className="space-y-2">
              {details.measurements.map((m) => (
                <li
                  key={m.label}
                  className="flex justify-between gap-4 border-b border-[#2a2a2a] pb-2 text-sm"
                >
                  <span className="text-muted">{m.label}</span>
                  <span className="text-right font-medium text-white">{m.value}</span>
                </li>
              ))}
            </ul>
          ) : null}
          {details.sizeNote ? (
            <p className="text-sm text-[#888]">{details.sizeNote}</p>
          ) : null}
          {details.adjustable ? (
            <p className="text-sm text-gold">Ajustável — adapta ao uso.</p>
          ) : null}
        </div>
      ),
    });
  }

  if (details.faqs?.length) {
    sections.push({
      id: "faq",
      title: "Dúvidas frequentes",
      body: (
        <ul className="space-y-4">
          {details.faqs.map((f) => (
            <li key={f.q}>
              <p className="text-sm font-semibold text-white">{f.q}</p>
              <p className="mt-1 text-sm leading-relaxed text-[#aaa]">{f.a}</p>
            </li>
          ))}
        </ul>
      ),
    });
  }

  if (details.includes?.length) {
    sections.push({
      id: "incluso",
      title: "O que vem na caixa",
      body: (
        <ul className="list-disc space-y-1 pl-5 text-sm text-[#aaa]">
          {details.includes.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      ),
    });
  }

  if (details.howToUse) {
    sections.push({
      id: "uso",
      title: "Como usar",
      body: (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#aaa]">
          {details.howToUse}
        </p>
      ),
    });
  }

  if (details.materials || details.care) {
    sections.push({
      id: "material",
      title: "Material e cuidados",
      body: (
        <div className="space-y-2 text-sm text-[#aaa]">
          {details.materials ? <p>{details.materials}</p> : null}
          {details.care ? <p>{details.care}</p> : null}
        </div>
      ),
    });
  }

  if (!sections.length) return null;

  return (
    <div className="mt-8 divide-y divide-[#333] rounded-[14px] border border-[#333] bg-[#1a1a1a]">
      {sections.map((section, index) => (
        <AccordionItem
          key={section.id}
          title={section.title}
          defaultOpen={index === 0}
        >
          {section.body}
        </AccordionItem>
      ))}
    </div>
  );
}

function AccordionItem({
  title,
  children,
  defaultOpen = false,
}: {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-3 px-4 py-4 text-left md:px-5"
        aria-expanded={open}
      >
        <span className="font-semibold text-white">{title}</span>
        <span
          className={`text-gold transition duration-200 ${open ? "rotate-180" : ""}`}
          aria-hidden
        >
          ▾
        </span>
      </button>
      {open ? <div className="px-4 pb-5 md:px-5">{children}</div> : null}
    </div>
  );
}
