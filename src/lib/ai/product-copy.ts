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

  const descSrc = input.descriptionText.replace(/\s+/g, " ").trim().slice(0, 900);
  let descriptionPt = "";
  if (descSrc) {
    const chunk = descSrc.slice(0, 400);
    descriptionPt = await translateToPt(chunk, 450);
  }
  if (!descriptionPt || descriptionPt === descSrc) {
    descriptionPt = `${name}. Produto selecionado pelo Capitão Fantástico — confira fotos, medidas e opções abaixo.`;
  } else {
    descriptionPt = `${name}. ${descriptionPt}`;
  }

  const specBits = measurements
    .slice(0, 3)
    .map((s) => `${s.label}: ${s.value}`)
    .join(" · ");

  const blurb = [
    colors.length ? `Cores: ${colors.slice(0, 4).join(", ")}` : "",
    sizes.length ? `Tamanhos: ${sizes.slice(0, 4).join(", ")}` : "",
    specBits,
    "Aprovado pelo Capitão.",
  ]
    .filter(Boolean)
    .join(" · ")
    .slice(0, 180);

  const highlights = [
    ...measurements.slice(0, 4).map((s) => `${s.label}: ${s.value}`),
    colors.length ? `Cores disponíveis: ${colors.slice(0, 8).join(", ")}` : "",
    sizes.length ? `Tamanhos: ${sizes.slice(0, 8).join(", ")}` : "",
    "Fotos e opções conforme o fornecedor",
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
      useCases: [
        `Ideal para ${cat.toLowerCase()} no dia a dia`,
        "Quem busca praticidade e bom custo-benefício",
      ],
      colors: colors.length ? colors : undefined,
      sizes: sizes.length ? sizes : undefined,
      measurements: measurements.length ? measurements : undefined,
      includes: ["Produto conforme fotos e opções selecionadas"],
      howToUse: "Siga as instruções do fabricante na embalagem.",
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

export type AiProductCopyInput = ProductCopyInput;
export type AiProductCopy = ProductCopy;
