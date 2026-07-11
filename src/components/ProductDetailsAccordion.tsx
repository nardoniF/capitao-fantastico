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

  if (details.measurements?.length) {
    sections.push({
      id: "medidas",
      title: "Medidas e tamanho",
      body: (
        <ul className="space-y-2">
          {details.measurements.map((m) => (
            <li
              key={m.label}
              className="flex justify-between gap-4 border-b border-[#2a2a2a] pb-2 text-sm"
            >
              <span className="text-muted">{m.label}</span>
              <span className="font-medium text-white">{m.value}</span>
            </li>
          ))}
          {details.sizeNote ? (
            <li className="pt-1 text-sm text-[#888]">{details.sizeNote}</li>
          ) : null}
          {details.adjustable ? (
            <li className="text-sm text-gold">Ajustável — adapta ao uso.</li>
          ) : null}
        </ul>
      ),
    });
  } else if (details.sizes?.length || details.adjustable || details.sizeNote) {
    sections.push({
      id: "tamanhos",
      title: "Tamanhos",
      body: (
        <div className="space-y-2 text-sm text-[#aaa]">
          {details.sizes?.length ? (
            <p>
              Disponíveis:{" "}
              <strong className="text-white">{details.sizes.join(" · ")}</strong>
            </p>
          ) : null}
          {details.adjustable ? <p className="text-gold">Produto ajustável.</p> : null}
          {details.sizeNote ? <p>{details.sizeNote}</p> : null}
        </div>
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
