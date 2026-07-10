export type ProductCategory =
  | "tecnologia"
  | "casa"
  | "smart-home"
  | "seguranca"
  | "escritorio"
  | "automotivo"
  | "camping"
  | "cozinha"
  | "pet"
  | "apple"
  | "viagem"
  | "saude"
  | "organizacao";

export const categoryLabels: Record<ProductCategory, string> = {
  tecnologia: "Tecnologia",
  casa: "Casa",
  "smart-home": "Smart Home",
  seguranca: "Segurança",
  escritorio: "Escritório",
  automotivo: "Automotivo",
  camping: "Camping",
  cozinha: "Cozinha",
  pet: "Pet",
  apple: "Apple",
  viagem: "Viagem",
  saude: "Saúde",
  organizacao: "Organização",
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  blurb: string;
  description: string;
  /** Preço de venda (BRL) */
  price: number;
  /** Custo fornecedor (referência interna) */
  cost: number;
  compareAt?: number;
  /** Avaliação média (1–5) */
  rating: number;
  image: string;
  accent: string;
};

/** Versão do catálogo seed — ao subir, o store troca os produtos mantendo pedidos. */
export const PRODUCTS_SEED_VERSION = 3;

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

/**
 * Catálogo drop — custo → venda (sua tabela).
 * Fotos são placeholder; troque pelas do fornecedor no admin / neste arquivo.
 */
export const products: Product[] = [
  {
    id: "1",
    slug: "kit-limpeza-7em1-eletronicos",
    name: "Kit limpeza 7 em 1 para eletrônicos",
    category: "tecnologia",
    blurb: "Limpa tela, fone e teclado sem risco.",
    description:
      "Kit completo com escovas, hastes e flanela para celulares, notebooks e fones. Ideal para quem quer higiene sem danificar componentes.",
    cost: 18,
    price: 99,
    compareAt: 149,
    rating: 5,
    image: img("photo-1511707171634-5f897ff02aa9"),
    accent: "#ffc107",
  },
  {
    id: "2",
    slug: "limpador-ultrassonico-portatil",
    name: "Limpador ultrassônico portátil",
    category: "casa",
    blurb: "Limpeza profunda por ultrassom, portátil.",
    description:
      "Tanque portátil com ondas ultrassônicas para joias, óculos, peças pequenas e utensílios. Compacto para bancada.",
    cost: 35,
    price: 179,
    compareAt: 249,
    rating: 5,
    image: img("photo-1581578731548-c64695cc6952"),
    accent: "#ffc107",
  },
  {
    id: "3",
    slug: "detector-vazamento-wifi",
    name: "Detector de vazamento Wi-Fi",
    category: "smart-home",
    blurb: "Alerta no celular se detectar água.",
    description:
      "Sensor Wi-Fi que avisa no app ao detectar umidade/vazamento. Protege piso, móveis e evita surpresa na conta de água.",
    cost: 28,
    price: 149,
    compareAt: 199,
    rating: 5,
    image: img("photo-1558002038-1055907df827"),
    accent: "#ffc107",
  },
  {
    id: "4",
    slug: "sensor-porta-inteligente",
    name: "Sensor de porta inteligente",
    category: "seguranca",
    blurb: "Notificação quando a porta abre.",
    description:
      "Sensor magnético com alerta no celular. Instalação simples em portas e janelas — mais tranquilidade em casa.",
    cost: 25,
    price: 139,
    compareAt: 189,
    rating: 5,
    image: img("photo-1557597774-9d273605dfa9"),
    accent: "#ffc107",
  },
  {
    id: "5",
    slug: "rastreador-bluetooth",
    name: "Rastreador Bluetooth",
    category: "tecnologia",
    blurb: "Ache chave, bolsa ou mala pelo app.",
    description:
      "Tag Bluetooth compacta para localizar itens pelo celular. Bateria durável e alerta de proximidade.",
    cost: 22,
    price: 129,
    compareAt: 179,
    rating: 5,
    image: img("photo-1523275335684-37898b6baf30"),
    accent: "#ffc107",
  },
  {
    id: "6",
    slug: "suporte-ergonomico-notebook",
    name: "Suporte ergonômico premium notebook",
    category: "escritorio",
    blurb: "Altura e ângulo certos no home office.",
    description:
      "Suporte premium que eleva o notebook, melhora a postura e libera espaço na mesa. Alumínio/estrutura reforçada.",
    cost: 32,
    price: 169,
    compareAt: 229,
    rating: 5,
    image: img("photo-1496181133206-80ce9b88a853"),
    accent: "#ffc107",
  },
  {
    id: "7",
    slug: "mini-compressor-portatil",
    name: "Mini compressor portátil",
    category: "automotivo",
    blurb: "Enche pneu no carro ou na garagem.",
    description:
      "Compressor compacto com display de pressão. Ideal para carro, moto e bicicleta — leva no porta-malas.",
    cost: 60,
    price: 249,
    compareAt: 329,
    rating: 5,
    image: img("photo-1486262715619-67b85e0b08d3"),
    accent: "#ffc107",
  },
  {
    id: "8",
    slug: "bomba-eletrica-portatil",
    name: "Bomba elétrica portátil",
    category: "camping",
    blurb: "Enche colchão e boia sem esforço.",
    description:
      "Bomba elétrica portátil para colchões infláveis, boias e artigos de camping. Rápida e fácil de guardar.",
    cost: 35,
    price: 149,
    compareAt: 199,
    rating: 4,
    image: img("photo-1504280390367-361c6d9f38f4"),
    accent: "#ffc107",
  },
  {
    id: "9",
    slug: "seladora-portatil-usb",
    name: "Seladora portátil USB",
    category: "cozinha",
    blurb: "Fecha embalagens e evita desperdício.",
    description:
      "Seladora USB compacta para fechar pacotes de alimentos. Recarregável e prática na cozinha ou viagem.",
    cost: 18,
    price: 89,
    compareAt: 129,
    rating: 4,
    image: img("photo-1556910103-1c02745aae4d"),
    accent: "#ffc107",
  },
  {
    id: "10",
    slug: "escova-eletrica-limpeza",
    name: "Escova elétrica limpeza",
    category: "casa",
    blurb: "Limpeza pesada com menos esforço.",
    description:
      "Escova elétrica com cabeças intercambiáveis para banheiro, azulejo e cantos difíceis.",
    cost: 40,
    price: 179,
    compareAt: 249,
    rating: 5,
    image: img("photo-1563453397536-e570addbe2be"),
    accent: "#ffc107",
  },
  {
    id: "11",
    slug: "removedor-pelos-pet",
    name: "Removedor de pelos pet reutilizável",
    category: "pet",
    blurb: "Tira pelo de sofá e roupa sem fita.",
    description:
      "Removedor reutilizável que captura pelos de cães e gatos em estofados, carpetes e tecidos.",
    cost: 15,
    price: 79,
    compareAt: 119,
    rating: 5,
    image: img("photo-1587300003388-59208cc962cb"),
    accent: "#ffc107",
  },
  {
    id: "12",
    slug: "bebedouro-portatil-pet",
    name: "Bebedouro portátil pet",
    category: "pet",
    blurb: "Água limpa no passeio e na viagem.",
    description:
      "Garrafa/bebedouro portátil para pets. Leve no passeio sem bagunça.",
    cost: 22,
    price: 99,
    compareAt: 139,
    rating: 5,
    image: img("photo-1548199973-03cce0bbc87b"),
    accent: "#ffc107",
  },
  {
    id: "13",
    slug: "organizador-magnetico-cabos",
    name: "Organizador magnético de cabos",
    category: "tecnologia",
    blurb: "Cabos alinhados na mesa e na parede.",
    description:
      "Clips magnéticos para organizar cabos USB, fones e carregadores. Mesa limpa em segundos.",
    cost: 8,
    price: 49,
    compareAt: 79,
    rating: 4,
    image: img("photo-1558618666-fcd25c85cd64"),
    accent: "#ffc107",
  },
  {
    id: "14",
    slug: "limpador-spray-telas",
    name: "Limpador spray de telas",
    category: "tecnologia",
    blurb: "Spray + flanela para TV e celular.",
    description:
      "Kit spray antisséptico/limpo para telas sensíveis: celular, notebook, TV e tablet.",
    cost: 12,
    price: 69,
    compareAt: 99,
    rating: 4,
    image: img("photo-1527443224154-c4a3942d3acf"),
    accent: "#ffc107",
  },
  {
    id: "15",
    slug: "kit-limpeza-airpods",
    name: "Kit limpeza AirPods",
    category: "tecnologia",
    blurb: "Limpa case e grade do fone.",
    description:
      "Kit específico para limpeza de AirPods e fones true wireless — haste, escova e flanela.",
    cost: 10,
    price: 59,
    compareAt: 89,
    rating: 4,
    image: img("photo-1606220945770-b5b6c2c55bf1"),
    accent: "#ffc107",
  },
  {
    id: "16",
    slug: "luminaria-monitor-usb",
    name: "Luminária monitor USB",
    category: "escritorio",
    blurb: "Luz de leitura sem ofuscar a tela.",
    description:
      "Barra de LED USB que encaixa no monitor. Ilumina o teclado sem reflexo na tela.",
    cost: 25,
    price: 129,
    compareAt: 179,
    rating: 4,
    image: img("photo-1507473885765-e6ed057f782c"),
    accent: "#ffc107",
  },
  {
    id: "17",
    slug: "carregador-magnetico-3em1",
    name: "Carregador magnético 3 em 1",
    category: "apple",
    blurb: "iPhone, Watch e AirPods juntos.",
    description:
      "Base magnética 3 em 1 para carregar iPhone, Apple Watch e AirPods ao mesmo tempo.",
    cost: 45,
    price: 199,
    compareAt: 279,
    rating: 5,
    image: img("photo-1591290619762-c588f7e5ba6c"),
    accent: "#ffc107",
  },
  {
    id: "18",
    slug: "organizador-de-malas",
    name: "Organizador de malas",
    category: "viagem",
    blurb: "Mala organizada em cubos/bolsas.",
    description:
      "Kit organizador para separar roupas e acessórios na mala. Embarque e desembarque sem bagunça.",
    cost: 30,
    price: 139,
    compareAt: 189,
    rating: 4,
    image: img("photo-1565026057447-bc90a3dceb87"),
    accent: "#ffc107",
  },
  {
    id: "19",
    slug: "seladora-vacuo-portatil",
    name: "Seladora a vácuo portátil",
    category: "cozinha",
    blurb: "Conserva comida por mais tempo.",
    description:
      "Seladora a vácuo portátil com sacos reutilizáveis. Menos desperdício na geladeira e freezer.",
    cost: 50,
    price: 219,
    compareAt: 299,
    rating: 5,
    image: img("photo-1556911220-bff31c875dba"),
    accent: "#ffc107",
  },
  {
    id: "20",
    slug: "escorredor-retratil",
    name: "Escorredor retrátil",
    category: "cozinha",
    blurb: "Escorre e some da pia.",
    description:
      "Escorredor retrátil/dobrável para louças e legumes. Economiza espaço na pia.",
    cost: 20,
    price: 89,
    compareAt: 129,
    rating: 4,
    image: img("photo-1556912173-46c336c7fd55"),
    accent: "#ffc107",
  },
  {
    id: "21",
    slug: "massageador-cervical",
    name: "Massageador cervical",
    category: "saude",
    blurb: "Alívio no pescoço e ombros.",
    description:
      "Massageador cervical elétrico para aliviar tensão do home office e do dia a dia.",
    cost: 55,
    price: 249,
    compareAt: 329,
    rating: 5,
    image: img("photo-1544367567-0f2fcb009e0b"),
    accent: "#ffc107",
  },
  {
    id: "22",
    slug: "travesseiro-ergonomico-viagem",
    name: "Travesseiro ergonômico viagem",
    category: "viagem",
    blurb: "Conforto no avião, carro e ônibus.",
    description:
      "Travesseiro de viagem ergonômico com apoio cervical. Compacto e fácil de levar.",
    cost: 30,
    price: 129,
    compareAt: 179,
    rating: 4,
    image: img("photo-1520256862855-398228c41684"),
    accent: "#ffc107",
  },
  {
    id: "23",
    slug: "cinto-postura-inteligente",
    name: "Cinto postura inteligente",
    category: "saude",
    blurb: "Lembra de manter a coluna reta.",
    description:
      "Cinto/sensor de postura que vibra quando você se curva. Treino discreto no trabalho.",
    cost: 35,
    price: 149,
    compareAt: 199,
    rating: 4,
    image: img("photo-1571019614242-c5c5dee9f50b"),
    accent: "#ffc107",
  },
  {
    id: "24",
    slug: "escova-vapor-pet",
    name: "Escova vapor pet",
    category: "pet",
    blurb: "Escova e vapor para pelo macio.",
    description:
      "Escova a vapor para pets: desembaraça, hidrata e reduz pelos soltos.",
    cost: 28,
    price: 139,
    compareAt: 189,
    rating: 5,
    image: img("photo-1516734212186-a967f81a0b27"),
    accent: "#ffc107",
  },
  {
    id: "25",
    slug: "cortador-unha-pet-led",
    name: "Cortador unha pet LED",
    category: "pet",
    blurb: "Corta com luz pra ver o limite.",
    description:
      "Cortador de unha com LED para visualizar a veia e cortar com mais segurança.",
    cost: 20,
    price: 99,
    compareAt: 139,
    rating: 4,
    image: img("photo-1601758228041-f3b2795255f1"),
    accent: "#ffc107",
  },
  {
    id: "26",
    slug: "removedor-fiapos-eletrico",
    name: "Removedor de fiapos elétrico",
    category: "casa",
    blurb: "Tira bolinha de roupa e sofá.",
    description:
      "Removedor elétrico de fiapos e bolinhas em roupas, cobertores e estofados.",
    cost: 30,
    price: 129,
    compareAt: 179,
    rating: 4,
    image: img("photo-1489987707025-afc232f7ea62"),
    accent: "#ffc107",
  },
  {
    id: "27",
    slug: "trava-magnetica-infantil",
    name: "Trava magnética infantil",
    category: "casa",
    blurb: "Trava gaveta e armário sem furo.",
    description:
      "Travas magnéticas invisíveis para gavetas e armários — segurança infantil sem estragar o móvel.",
    cost: 12,
    price: 69,
    compareAt: 99,
    rating: 4,
    image: img("photo-1503454537195-1dcabb73ffb9"),
    accent: "#ffc107",
  },
  {
    id: "28",
    slug: "mini-aspirador-teclado",
    name: "Mini aspirador teclado",
    category: "tecnologia",
    blurb: "Aspira pó do teclado e mesa.",
    description:
      "Mini aspirador USB/portátil para teclado, mesa e cantos do setup gamer ou escritório.",
    cost: 35,
    price: 159,
    compareAt: 219,
    rating: 5,
    image: img("photo-1587829741301-dc798b83add3"),
    accent: "#ffc107",
  },
  {
    id: "29",
    slug: "organizador-gavetas-modular",
    name: "Organizador de gavetas modular",
    category: "organizacao",
    blurb: "Gaveta em ordem, módulos ajustáveis.",
    description:
      "Organizadores modulares para gavetas de cozinha, banheiro ou escritório.",
    cost: 20,
    price: 89,
    compareAt: 129,
    rating: 4,
    image: img("photo-1595428774223-ef52624120d2"),
    accent: "#ffc107",
  },
  {
    id: "30",
    slug: "lampada-led-sensor-presenca",
    name: "Lâmpada LED com sensor de presença",
    category: "casa",
    blurb: "Acende sozinha quando você passa.",
    description:
      "Lâmpada LED com sensor de presença/movimento. Corredor, garagem e área externa.",
    cost: 18,
    price: 99,
    compareAt: 139,
    rating: 5,
    image: img("photo-1565814329452-e1efa11c5b89"),
    accent: "#ffc107",
  },
];

export function formatBRL(value: number) {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
  });
}

export function getProductBySlug(slug: string) {
  return products.find((p) => p.slug === slug);
}

export function getProductById(id: string) {
  return products.find((p) => p.id === id);
}

export function marginOf(p: Product) {
  return p.price - p.cost;
}
