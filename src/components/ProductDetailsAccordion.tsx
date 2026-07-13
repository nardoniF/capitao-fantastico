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
  productName,
}: {
  description: string;
  details: ProductDetails;
  productName?: string;
}) {
  const sections: Section[] = [];

  sections.push({
    id: "capitao",
    title: "O que o Capitão achou",
    body: (
      <p className="text-sm leading-relaxed text-[#aaa]">
        {productName
          ? `${productName} passou pelo filtro do Capitão: resolve de verdade, vale o preço e merece o selo.`
          : "Passou pelo filtro do Capitão: resolve de verdade, vale o preço e merece o selo."}{" "}
        Avaliação com nota alta e suporte em português até o pedido chegar.
      </p>
    ),
  });

  if (details.useCases?.length) {
    sections.push({
      id: "problema",
      title: "Qual problema resolve?",
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

  if (details.howToUse) {
    sections.push({
      id: "como",
      title: "Como funciona?",
      body: (
        <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#aaa]">
          {details.howToUse}
        </p>
      ),
    });
  }

  if (details.includes?.length) {
    sections.push({
      id: "incluso",
      title: "O que acompanha",
      body: (
        <ul className="list-disc space-y-1 pl-5 text-sm text-[#aaa]">
          {details.includes.map((item) => (
            <li key={item}>{item}</li>
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

  if (
    details.measurements?.length ||
    details.colors?.length ||
    details.sizes?.length
  ) {
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
                  <span className="text-right font-medium text-white">
                    {m.value}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ),
    });
  }

  sections.push({
    id: "avaliacao",
    title: "Avaliação do Capitão",
    body: (
      <p className="text-sm text-[#aaa]">
        Nota 9,8 · ★★★★★ — curadoria própria. Se não resolve, não entra.
      </p>
    ),
  });

  if (details.faqs?.length) {
    sections.push({
      id: "faq",
      title: "Perguntas frequentes",
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
