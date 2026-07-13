import type { ProductDetails } from "@/lib/product-details";
import {
  localizeOptions,
  localizeProductTitle,
  translateOptionKey,
  translateToPt,
} from "@/lib/translate-free";

export type ProductCopyInput = {
  titleEn: string;
  descriptionText: string;
  specs: { label: string; value: string }[];
  options: Record<string, string[]>;
  categoryHint?: string;
};

export type ProductCopy = {
  name: string;
  slug: string;
  blurb: string;
  description: string;
  seoTitle: string;
  seoDescription: string;
  details: ProductDetails;
  /** Opções já em PT (Cor / Tamanho) */
  optionsPt: Record<string, string[]>;
};

function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 80);
}

/** Blurb curto e útil a partir do nome — sem lero-lero de marca. */
function blurbFromTitle(name: string): string {
  const n = name.toLowerCase();
  if (/carregador/.test(n) && /3\s*em\s*1|3-in-1|3in1/.test(n)) {
    return "Os 3: celular + relógio + fones — carregando juntos.";
  }
  if (/hub/.test(n) && /usb/.test(n)) {
    return "Várias portas em um hub só — notebook e tablet.";
  }
  if (/organizador/.test(n) && /cabo/.test(n)) {
    return "Cabos no lugar — mesa e parede sem nó.";
  }
  if (/rastreador|airtag|tracker|localizador/.test(n)) {
    return "Ache chave, bolsa ou mala pelo app.";
  }
  return "";
}

function fallbackDescriptionFromTitle(
  name: string,
  colors: string[],
  sizes: string[],
  measurements: { label: string; value: string }[],
): string {
  const n = name.toLowerCase();
  const bits: string[] = [];

  if (/carregador/.test(n) && /3\s*em\s*1|3-in-1|3in1/.test(n)) {
    bits.push(
      `${name}: estação para carregar celular, relógio e fones ao mesmo tempo — um cabo na tomada, três dispositivos.`,
    );
  } else if (/carregador|charger/.test(n)) {
    bits.push(`${name}: carregamento prático no dia a dia.`);
  } else {
    bits.push(`${name}.`);
  }

  if (colors.length) bits.push(`Cores: ${colors.slice(0, 6).join(", ")}.`);
  if (sizes.length) bits.push(`Tamanhos: ${sizes.slice(0, 6).join(", ")}.`);
  if (measurements.length) {
    bits.push(
      measurements
        .slice(0, 4)
        .map((m) => `${m.label} ${m.value}`)
        .join(" · ") + ".",
    );
  }

  return bits.join(" ").slice(0, 1500);
}

/**
 * Gera anúncio pronto em PT: nome, descrição, SEO, cores, tamanhos, medidas.
 * Sem OpenAI — tradução gratuita + specs da CJ.
 */
export async function generateProductCopy(
  input: ProductCopyInput,
): Promise<ProductCopy> {
  const optionsPt = await localizeOptions(input.options);
  const name = await localizeProductTitle(input.titleEn);
  const slug = slugify(name) || `produto-${Date.now().toString(36)}`;

  const colors = optionsPt.Cor || [];
  const sizes = optionsPt.Tamanho || optionsPt.Opção || [];

  const SPEC_LABEL: Record<string, string> = {
    weight: "Peso",
    "pack weight": "Peso embalagem",
    "pack weight (g)": "Peso embalagem (g)",
    length: "Comprimento",
    width: "Largura",
    height: "Altura",
    "pack length": "Comprimento",
    "pack width": "Largura",
    "pack height": "Altura",
    sku: "SKU",
    "categoria cj": "Categoria",
    category: "Categoria",
  };

  const measurements = input.specs.map((s) => ({
    label:
      SPEC_LABEL[s.label.toLowerCase()] ||
      translateOptionKey(s.label) ||
      s.label,
    value: s.value,
  }));

  const descSrc = input.descriptionText.replace(/\s+/g, " ").trim().slice(0, 2000);
  let descriptionPt = "";
  if (descSrc) {
    // Traduz em 2 chunks para não perder o anúncio
    const chunk1 = descSrc.slice(0, 450);
    const chunk2 = descSrc.slice(450, 900);
    const t1 = await translateToPt(chunk1, 500);
    const t2 = chunk2 ? await translateToPt(chunk2, 500) : "";
    descriptionPt = [t1, t2].filter(Boolean).join(" ").trim();
  }
  if (!descriptionPt || descriptionPt.length < 40) {
    descriptionPt =
      descSrc.length > 40
        ? `${name}. ${descSrc.slice(0, 700)}`
        : fallbackDescriptionFromTitle(name, colors, sizes, measurements);
  } else {
    descriptionPt = `${name}. ${descriptionPt}`;
  }

  const specBits = measurements
    .slice(0, 3)
    .map((s) => `${s.label}: ${s.value}`)
    .join(" · ");

  const blurb = (
    blurbFromTitle(name) ||
    [
      colors.length ? `Cores: ${colors.slice(0, 4).join(", ")}` : "",
      sizes.length ? `Tamanhos: ${sizes.slice(0, 4).join(", ")}` : "",
      specBits,
    ]
      .filter(Boolean)
      .join(" · ")
  ).slice(0, 180);

  const highlights = [
    ...measurements.slice(0, 4).map((s) => `${s.label}: ${s.value}`),
    colors.length ? `Cores disponíveis: ${colors.slice(0, 8).join(", ")}` : "",
    sizes.length ? `Tamanhos: ${sizes.slice(0, 8).join(", ")}` : "",
  ].filter(Boolean);

  const cat = input.categoryHint || "utilidades";
  const benefit =
    cat.toLowerCase().includes("pet")
      ? "para seu pet"
      : cat.toLowerCase().includes("auto")
        ? "para o carro"
        : cat.toLowerCase().includes("beauty")
          ? "para cuidados pessoais"
          : "para o dia a dia";

  const seoTitle = `${name} | Compre online | Capitão Fantástico`.slice(0, 70);
  const seoDescription = (
    `Compre ${name} ${benefit} com suporte em português e rastreio no site. ` +
    `${blurb}`
  ).slice(0, 155);

  return {
    name,
    slug,
    blurb,
    description: descriptionPt.slice(0, 1500),
    seoTitle,
    seoDescription,
    optionsPt,
    details: {
      highlights,
      useCases: useCasesFromTitle(name, cat),
      colors: colors.length ? colors : undefined,
      sizes: sizes.length ? sizes : undefined,
      measurements: measurements.length ? measurements : undefined,
      includes: ["Produto conforme fotos e opções selecionadas"],
      howToUse: howToUseFromTitle(name),
      faqs: [
        {
          q: "O preço já inclui frete?",
          a: "Não. O frete é calculado depois do pedido, conforme CEP.",
        },
        {
          q: "Como acompanhar o pedido?",
          a: "Pelo site em Pedido → Rastreio, com o número do pedido. O status atualiza sozinho até a entrega. Suporte em português no WhatsApp.",
        },
        {
          q: "O suporte é em português?",
          a: "Sim. Acompanhamos você do pagamento até o pedido chegar — WhatsApp e e-mail em português.",
        },
        {
          q: "Como escolher cor ou tamanho?",
          a: "Escolha a opção na página do produto antes de adicionar ao carrinho.",
        },
        {
          q: "As fotos são do produto real?",
          a: "Sim — usamos a galeria e variantes oficiais do fornecedor.",
        },
      ],
      longDescription: descriptionPt.slice(0, 2500),
    },
  };
}

function useCasesFromTitle(name: string, cat: string): string[] {
  const n = name.toLowerCase();
  if (/carregador/.test(n) && /3\s*em\s*1|3-in-1|3in1/.test(n)) {
    return [
      "Para quem cansa de plugar três carregadores na mesa",
      "Mesa, cabeceira ou home office — celular, relógio e fones no mesmo lugar",
    ];
  }
  if (/hub/.test(n) && /usb/.test(n)) {
    return [
      "Notebook sem portas suficientes",
      "Quem precisa de HDMI, USB e cartão sem carregador de maleta",
    ];
  }
  return [
    `Uso no dia a dia em ${cat.toLowerCase()}`,
    "Quem busca praticidade e bom custo-benefício",
  ];
}

function howToUseFromTitle(name: string): string {
  const n = name.toLowerCase();
  if (/carregador/.test(n) && /3\s*em\s*1|3-in-1|3in1/.test(n)) {
    return "Conecte a base na tomada. Encaixe o celular no pad magnético, o relógio no suporte e os fones na base. Os três carregam juntos.";
  }
  if (/magnet/.test(n) && /carregador|charger/.test(n)) {
    return "Encaixe o aparelho compatível no pad magnético e deixe carregar. Use o cabo indicado na embalagem.";
  }
  return "Siga as instruções do fabricante na embalagem.";
}

export type AiProductCopyInput = ProductCopyInput;
export type AiProductCopy = ProductCopy;
