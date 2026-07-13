"use client";

import { useState, type ReactNode } from "react";
import type { ProductDetails } from "@/lib/product-details";

type Section = {
  id: string;
  title: string;
  body: ReactNode;
};

function isGenericCaptainText(text: string) {
  const t = text.toLowerCase();
  return (
    t.includes("passou pelo filtro do capitão") ||
    t.includes("produto selecionado pelo capitão") ||
    t.includes("confira fotos, medidas e opções") ||
    t.includes("aprovado pelo capitão") && t.length < 80
  );
}

/**
 * Quebra descrições de fornecedor (texto corrido, sem parágrafos) em blocos
 * legíveis: separa marcadores de seção conhecidos, notas numeradas e limita o
 * tamanho de cada parágrafo.
 */
function formatDescription(text: string): string[] {
  let t = text.replace(/\s+/g, " ").trim();
  t = t.replace(/imagem do produto:?\s*$/i, "").trim();

  const markers = [
    "Visão geral:",
    "Informações do produto:",
    "Especificações:",
    "Especificação:",
    "Nota:",
    "Observações:",
    "Lista de embalagem:",
    "Como usar:",
  ];
  for (const m of markers) {
    t = t.replace(
      new RegExp(`\\s*(${m.replace(":", "\\s*:")})`, "gi"),
      `\n\n${m} `,
    );
  }
  // Notas numeradas ("1. ...", "2. ...") em linhas próprias
  t = t.replace(/\s(\d)\s*\.\s*(?=[A-ZÀ-Ú])/g, "\n$1. ");

  const blocks = t
    .split(/\n{2,}/)
    .map((b) => b.trim())
    .filter(Boolean);

  const out: string[] = [];
  for (const block of blocks) {
    const lines = block
      .split(/\n/)
      .map((l) => l.trim())
      .filter(Boolean);
    for (const line of lines) {
      if (line.length <= 280) {
        out.push(line);
        continue;
      }
      const sentences = line.split(/(?<=[.!?])\s+(?=[A-ZÀ-Ú0-9])/);
      let current = "";
      for (const s of sentences) {
        if (current && (current + " " + s).length > 260) {
          out.push(current.trim());
          current = s;
        } else {
          current = current ? `${current} ${s}` : s;
        }
      }
      if (current.trim()) out.push(current.trim());
    }
  }
  return out
    .map((p) => p.replace(/\s{2,}/g, " ").trim())
    .filter((p) => !(p.length < 25 && p.endsWith(":")));
}

const SECTION_MARKER =
  /^(Visão geral|Informações do produto|Especificaç(?:ões|ão)|Nota|Observações|Lista de embalagem|Como usar):\s*/i;

export function ProductDetailsAccordion({
  description,
  details,
}: {
  description: string;
  details: ProductDetails;
  /** @deprecated Capitão já aparece no selo/medalhas — não repetir no acordeão */
  productName?: string;
}) {
  const longText = (details.longDescription || description || "").trim();
  const showDescription =
    longText.length > 0 && !isGenericCaptainText(longText);

  const useCases = (details.useCases || []).filter(
    (u) => !isGenericCaptainText(u) && !/^ideal para .+ no dia a dia$/i.test(u),
  );

  const sections: Section[] = [];

  if (showDescription) {
    const paragraphs = formatDescription(longText);
    sections.push({
      id: "desc",
      title: "O que é este produto",
      body: (
        <div className="space-y-3">
          {paragraphs.map((p, i) => {
            const marker = p.match(SECTION_MARKER);
            return (
              <p
                key={`${i}-${p.slice(0, 24)}`}
                className="text-sm leading-relaxed text-[#ccc]"
              >
                {marker ? (
                  <>
                    <strong className="text-white">
                      {marker[0].trim()}
                    </strong>{" "}
                    {p.slice(marker[0].length)}
                  </>
                ) : (
                  p
                )}
              </p>
            );
          })}
        </div>
      ),
    });
  }

  if (useCases.length) {
    sections.push({
      id: "problema",
      title: "Para que serve",
      body: (
        <ul className="space-y-2">
          {useCases.map((u) => (
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

  if (
    details.howToUse &&
    !/^siga as instruções do fabricante/i.test(details.howToUse)
  ) {
    sections.push({
      id: "como",
      title: "Como usar",
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

  if (sections.length === 0) {
    return null;
  }

  return (
    <div className="mt-12 divide-y divide-[#333] rounded-[14px] border border-[#333] bg-[#1a1a1a] md:mt-14">
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
        className="flex w-full items-center justify-between gap-3 px-5 py-5 text-left md:px-6 md:py-5"
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
      {open ? (
        <div className="px-5 pb-6 md:px-6 md:pb-7">{children}</div>
      ) : null}
    </div>
  );
}
