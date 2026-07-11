/**
 * Enriquece produtos do Neon com galeria (CJ) + detalhes em português.
 * Uso: npx tsx scripts/enrich-product-details.ts
 */
import { prisma } from "../src/lib/db";
import { galleryFromCjRaw } from "../src/lib/media";
import type { ProductDetails } from "../src/lib/product-details";

const CURATED: Record<
  string,
  { description: string; details: ProductDetails }
> = {
  "colete-salva-vidas-pet": {
    description:
      "Colete flutuante para cães em praia, lago ou piscina. Ajuda o pet a nadar com mais segurança e facilita o resgate pela alça superior.",
    details: {
      highlights: [
        "Flutuação para nadar com mais segurança",
        "Alça superior para puxar o pet na água",
        "Ajuste por tiras — melhor encaixe no peito",
        "Várias cores e tamanhos (do XS ao XL)",
      ],
      sizes: ["XS", "S", "M", "L", "XL"],
      adjustable: true,
      sizeNote:
        "Meça o peito do cão (volta completa) e compare com a tabela. Em dúvida, escolha o tamanho maior e ajuste as tiras.",
      measurements: [
        { label: "Tamanhos", value: "XS · S · M · L · XL" },
        { label: "Ajuste", value: "Tiras reguláveis no peito e barriga" },
        { label: "Uso", value: "Praia, lago, piscina e barco" },
      ],
      includes: ["1 colete salva-vidas para pet"],
      materials: "Tecido resistente à água com espuma de flutuação.",
      howToUse:
        "Vista o colete, ajuste as tiras até ficar firme (sem apertar demais) e teste em água rasa antes de ir fundo.",
      care: "Enxágue com água doce após o mar e deixe secar à sombra.",
      longDescription:
        "Ideal para pets que ainda estão aprendendo a nadar ou para passeios aquáticos com mais tranquilidade. A alça no dorso ajuda a erguer o animal com segurança. Escolha o tamanho pelo peito — o colete deve ficar firme, sem girar.",
    },
  },
  "comedouro-elevado-duplo-caes": {
    description:
      "Comedouro elevado com dois bowls de silicone — água e ração na altura certa para cães médios e grandes. Dobrável para guardar ou viajar.",
    details: {
      highlights: [
        "Dois bowls (ração + água)",
        "Altura elevada — postura mais confortável",
        "Silicone fácil de limpar",
        "Estrutura dobrável / portátil",
      ],
      sizes: ["Único"],
      adjustable: true,
      sizeNote: "Altura ajustável conforme o porte do cão. Ideal para médios e grandes.",
      measurements: [
        { label: "Formato", value: "Duplo (2 bowls)" },
        { label: "Material bowls", value: "Silicone" },
        { label: "Uso", value: "Casa e viagem" },
      ],
      includes: ["1 estrutura elevada", "2 bowls de silicone"],
      materials: "Estrutura firme + bowls de silicone.",
      howToUse:
        "Monte na altura desejada, encaixe os bowls e sirva. Para guardar, dobre a estrutura.",
      care: "Lave os bowls com detergente neutro. Não use esponja abrasiva no silicone.",
      longDescription:
        "Comer e beber mais ereto pode ser mais confortável para cães maiores. O conjunto duplo organiza a área de alimentação e os bowls saem para lavar com facilidade.",
    },
  },
  "tapete-protetor-pet-carro": {
    description:
      "Tapete impermeável para o banco traseiro — protege de pelos, lama e arranhões quando o pet viaja no carro.",
    details: {
      highlights: [
        "Impermeável e fácil de limpar",
        "Protege banco e laterais",
        "Resistente a arranhões leves",
        "Instalação rápida com tiras/ganchos",
      ],
      sizes: ["Único (banco traseiro)"],
      adjustable: true,
      sizeNote: "Cobre o banco traseiro da maioria dos sedãs e SUVs. Ajuste as tiras ao cinto/apoio de cabeça.",
      measurements: [
        { label: "Cobertura", value: "Banco traseiro + laterais" },
        { label: "Proteção", value: "Água, pelos e sujeira" },
      ],
      includes: ["1 tapete protetor para pet"],
      materials: "Tecido impermeável com base antiderrapante.",
      howToUse:
        "Abra sobre o banco traseiro, prenda nas laterais/apoios de cabeça e acomode o pet.",
      care: "Passe pano úmido ou lave conforme a etiqueta. Seque antes de guardar.",
      longDescription:
        "Feito para quem leva o pet no carro sem querer sujar o banco. A superfície impermeável facilita limpar lama e pelos depois do passeio.",
    },
  },
  "massageador-eletrico-2-em-1": {
    description:
      "Massageador elétrico com duas funções para aliviar tensão em costas, ombros, pernas e pescoço no dia a dia.",
    details: {
      highlights: [
        "Duas funções de massagem",
        "Uso em casa, sem academia",
        "Alívio muscular pontual",
        "Fácil de manusear",
      ],
      sizes: ["Único"],
      adjustable: false,
      measurements: [
        { label: "Tipo", value: "Massageador elétrico portátil" },
        { label: "Funções", value: "2 modos" },
        { label: "Áreas", value: "Costas, ombros, pernas, pescoço" },
      ],
      includes: ["1 massageador elétrico", "Cabo / acessórios conforme o kit"],
      howToUse:
        "Ligue, escolha o modo e deslize sobre o músculo com pressão leve a moderada. Não use sobre ossos, feridas ou áreas inflamadas.",
      care: "Desligue da tomada após o uso. Limpe a superfície com pano seco.",
      longDescription:
        "Para quem sente tensão depois do trabalho ou treino. Use por poucos minutos por região — o objetivo é relaxar, não forçar.",
    },
  },
  "sabonete-facial-escova-silicone": {
    description:
      "Sabonete facial com escova de silicone integrada para limpeza mais profunda e massagem suave no banho.",
    details: {
      highlights: [
        "Escova de silicone integrada",
        "Limpeza + massagem no mesmo gesto",
        "Fórmula com açafrão (turmeric) na linha original",
        "Uso diário no banho",
      ],
      sizes: ["Único"],
      measurements: [
        { label: "Tipo", value: "Sabonete facial com escova" },
        { label: "Escova", value: "Silicone macio" },
      ],
      includes: ["1 sabonete facial com escova de silicone"],
      howToUse:
        "Molhe o rosto, faça espuma, massageie com a escova em movimentos circulares e enxágue. Evite contato com os olhos.",
      care: "Guarde em local seco. Faça teste de toque se a pele for sensível.",
      longDescription:
        "A escova ajuda a remover impurezas com mais eficiência do que só a mão. Use com cuidado se tiver pele muito sensível ou acne inflamada — nesses casos, prefira pressão bem leve.",
    },
  },
  "vedante-impermeavel-cozinha-banheiro": {
    description:
      "Revestimento vedante para áreas úmidas — cozinha, banheiro e paredes sujeitas a umidade e respingos.",
    details: {
      highlights: [
        "Ajuda a selar e proteger a parede",
        "Uso em cozinha e banheiro",
        "Aplicação doméstica",
        "Barreira contra umidade superficial",
      ],
      sizes: ["Único"],
      measurements: [
        { label: "Uso", value: "Cozinha, banheiro, áreas úmidas" },
        { label: "Função", value: "Vedação / impermeabilização superficial" },
      ],
      includes: ["1 unidade de vedante impermeável"],
      howToUse:
        "Limpe e seque a superfície. Aplique conforme as instruções da embalagem em camadas finas. Deixe secar completamente antes de molhar.",
      care: "Mantenha a embalagem fechada. Evite aplicar em superfície suja ou úmida.",
      longDescription:
        "Indicado para quem quer reforçar a proteção contra umidade em pontos críticos. O resultado depende da preparação da superfície — limpeza e secagem fazem diferença.",
    },
  },
  "desengordurante-po-cozinha": {
    description:
      "Pó desengordurante para coifa, cooktop, fogão e torneiras — remove gordura e sujeira pesada da cozinha.",
    details: {
      highlights: [
        "Foco em gordura de cozinha",
        "Uso em coifa, fogão e torneira",
        "Ação desengordurante",
        "Rendimento doméstico",
      ],
      sizes: ["Único"],
      measurements: [
        { label: "Formato", value: "Pó desengordurante" },
        { label: "Superfícies", value: "Coifa, cooktop, fogão, torneira" },
      ],
      includes: ["1 embalagem de desengordurante em pó"],
      howToUse:
        "Polvilhe na área úmida, esfregue com esponja e enxágue bem. Use luvas. Não misture com outros produtos químicos.",
      care: "Mantenha fora do alcance de crianças. Evite inalar o pó.",
      longDescription:
        "Para a gordura acumulada que detergente comum não resolve. Trabalhe por trechos e enxágue com cuidado para não deixar resíduo.",
    },
  },
};

function stripHtml(html: string) {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function sizesFromCjDescription(html: string): string[] | undefined {
  const text = stripHtml(html);
  const m = text.match(/Size:\s*([^\n]+)/i);
  if (!m) return undefined;
  return m[1]
    .split(/[,/]/)
    .map((s) => s.trim())
    .filter(Boolean)
    .slice(0, 12);
}

async function main() {
  const products = await prisma.product.findMany({
    include: { supplierProduct: true },
  });

  for (const p of products) {
    const curated = CURATED[p.slug];
    const raw = p.supplierProduct?.rawJson;
    const gallery = galleryFromCjRaw(raw, p.imageUrl);
    const cjSizes = typeof (raw as { description?: string } | null)?.description === "string"
      ? sizesFromCjDescription((raw as { description: string }).description)
      : undefined;

    const details: ProductDetails = {
      ...(curated?.details || {}),
      sizes: curated?.details.sizes || cjSizes || curated?.details.sizes,
    };

    // medidas aproximadas da 1ª variante CJ (mm do pacote)
    const v0 = Array.isArray((raw as { variants?: unknown[] } | null)?.variants)
      ? ((raw as { variants: Record<string, number>[] }).variants[0] as
          | { variantWidth?: number; variantHeight?: number; variantLength?: number }
          | undefined)
      : undefined;
    if (v0 && (v0.variantLength || v0.variantWidth || v0.variantHeight)) {
      const pack = [
        v0.variantLength ? `C ${v0.variantLength}` : null,
        v0.variantWidth ? `L ${v0.variantWidth}` : null,
        v0.variantHeight ? `A ${v0.variantHeight}` : null,
      ]
        .filter(Boolean)
        .join(" × ");
      details.measurements = [
        ...(details.measurements || []),
        { label: "Embalagem (aprox.)", value: `${pack} mm` },
      ];
    }

    await prisma.product.update({
      where: { id: p.id },
      data: {
        gallery,
        details,
        description: curated?.description || p.description,
        imageUrl: gallery[0] || p.imageUrl,
      },
    });

    console.log(p.slug, "gallery", gallery.length, "sizes", details.sizes?.join(",") || "-");
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
