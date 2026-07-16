export type ProductCategory =
  | "gadgets"
  | "auto"
  | "pet"
  | "kids"
  | "beauty"
  | "casa"
  | "fit";

export const categoryLabels: Record<ProductCategory, string> = {
  gadgets: "Gadgets Inteligentes",
  auto: "Capitão Auto",
  pet: "Capitão Pet",
  kids: "Capitão Kids",
  beauty: "Capitão Beauty",
  casa: "Capitão Casa",
  fit: "Capitão Fit",
};

export const categoryOrder: ProductCategory[] = [
  "gadgets",
  "auto",
  "pet",
  "kids",
  "beauty",
  "casa",
  "fit",
];

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  blurb: string;
  description: string;
  price: number;
  cost: number;
  compareAt?: number;
  rating: number;
  approved: boolean;
  isNew: boolean;
  image: string;
  accent: string;
  deliveryDays?: number;
};

/** Bump para forçar refresh do catálogo no store */
export const PRODUCTS_SEED_VERSION = 6;

const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=800&q=80`;

type Seed = {
  id: string;
  slug: string;
  name: string;
  category: ProductCategory;
  blurb: string;
  description: string;
  cost: number;
  price: number;
  compareAt: number;
  rating: number;
  isNew?: boolean;
  image: string;
};

const seed: Seed[] = [
  // —— Gadgets Inteligentes ——
  {
    id: "1",
    slug: "organizador-magnetico-cabos",
    name: "Organização de cabos magnética",
    category: "gadgets",
    blurb: "Cabos alinhados na mesa e na parede.",
    description:
      "Clips e guias magnéticos para organizar cabos USB, fones e carregadores. Mesa limpa em segundos.",
    cost: 8,
    price: 49,
    compareAt: 79,
    rating: 4,
    isNew: true,
    image: img("photo-1558618666-fcd25c85cd64"),
  },
  {
    id: "2",
    slug: "carregador-magnetico-3em1",
    name: "Carregador magnético 3 em 1",
    category: "gadgets",
    blurb: "Os 3: iPhone + Apple Watch + fones — ao mesmo tempo.",
    description:
      "Estação magnética 3 em 1: encaixa o celular, o relógio e os fones na mesma base. Um cabo na tomada, três dispositivos carregando juntos — sem trocar de carregador toda hora.",
    cost: 45,
    price: 199,
    compareAt: 279,
    rating: 5,
    isNew: true,
    image: img("photo-1591290619762-c588f7e5ba6c"),
  },
  {
    id: "3",
    slug: "hub-usb-c-multiporta",
    name: "Hub USB-C multiporta",
    category: "gadgets",
    blurb: "HDMI, USB e cartão em um hub só.",
    description:
      "Hub USB-C compacto com HDMI, portas USB e leitor de cartão. Ideal para notebook e tablet.",
    cost: 32,
    price: 149,
    compareAt: 199,
    rating: 5,
    image: img("photo-1614624532983-4ce03382d60d"),
  },
  {
    id: "4",
    slug: "rastreador-bluetooth",
    name: "Rastreador Bluetooth",
    category: "gadgets",
    blurb: "Ache chave, bolsa ou mala pelo app.",
    description:
      "Tag Bluetooth para localizar itens pelo celular. Alerta de proximidade e bateria durável.",
    cost: 22,
    price: 129,
    compareAt: 179,
    rating: 5,
    isNew: true,
    image: img("photo-1523275335684-37898b6baf30"),
  },
  {
    id: "5",
    slug: "suporte-ergonomico-notebook",
    name: "Suporte ergonômico para notebook",
    category: "gadgets",
    blurb: "Altura e ângulo certos no home office.",
    description:
      "Suporte que eleva o notebook, melhora a postura e libera espaço na mesa.",
    cost: 32,
    price: 169,
    compareAt: 229,
    rating: 5,
    image: img("photo-1496181133206-80ce9b88a853"),
  },
  {
    id: "6",
    slug: "luminaria-monitor-usb",
    name: "Luminária de monitor USB",
    category: "gadgets",
    blurb: "Luz de leitura sem ofuscar a tela.",
    description:
      "Barra de LED USB que encaixa no monitor. Ilumina o teclado sem reflexo.",
    cost: 25,
    price: 129,
    compareAt: 179,
    rating: 4,
    image: img("photo-1507473885765-e6ed057f782c"),
  },
  {
    id: "7",
    slug: "kit-limpeza-7em1-eletronicos",
    name: "Kit limpeza 7 em 1 para eletrônicos",
    category: "gadgets",
    blurb: "Limpa tela, fone e teclado sem risco.",
    description:
      "Kit com escovas, hastes e flanela para celulares, notebooks e fones.",
    cost: 18,
    price: 99,
    compareAt: 149,
    rating: 5,
    isNew: true,
    image: img("photo-1511707171634-5f897ff02aa9"),
  },

  // —— Capitão Auto ——
  {
    id: "8",
    slug: "compressor-portatil-carro",
    name: "Compressor portátil",
    category: "auto",
    blurb: "Enche pneu no carro ou na garagem.",
    description:
      "Compressor compacto com display de pressão. Ideal para carro, moto e bicicleta.",
    cost: 60,
    price: 249,
    compareAt: 329,
    rating: 5,
    isNew: true,
    image: img("photo-1486262715619-67b85e0b08d3"),
  },
  {
    id: "9",
    slug: "aspirador-automotivo",
    name: "Aspirador automotivo",
    category: "auto",
    blurb: "Limpa banco, carpete e porta-malas.",
    description:
      "Aspirador portátil 12V para o carro. Bicos para cantos e estofados.",
    cost: 38,
    price: 159,
    compareAt: 219,
    rating: 5,
    image: img("photo-1601362840469-51e4d8d58785"),
  },
  {
    id: "10",
    slug: "suporte-magnetico-celular-carro",
    name: "Suporte magnético para celular",
    category: "auto",
    blurb: "Celular firme no painel ou ventilação.",
    description:
      "Suporte magnético reforçado para usar GPS e apps com segurança no volante.",
    cost: 15,
    price: 79,
    compareAt: 119,
    rating: 4,
    image: img("photo-1512941937669-90a1b58e7e9c"),
  },
  {
    id: "11",
    slug: "carregador-veicular-rapido",
    name: "Carregador veicular rápido",
    category: "auto",
    blurb: "USB duplo com carga rápida.",
    description:
      "Carregador 12V com duas saídas USB e tecnologia de carga rápida.",
    cost: 18,
    price: 89,
    compareAt: 129,
    rating: 4,
    image: img("photo-1609091839311-b65de7691014"),
  },
  {
    id: "12",
    slug: "organizador-porta-malas",
    name: "Organizador de porta-malas",
    category: "auto",
    blurb: "Mala e compras no lugar certo.",
    description:
      "Organizador dobrável para porta-malas. Separadores para compras e equipamentos.",
    cost: 28,
    price: 129,
    compareAt: 179,
    rating: 4,
    image: img("photo-1449965408869-eaa3f722e40d"),
  },
  {
    id: "13",
    slug: "camera-re-veicular",
    name: "Câmera de ré",
    category: "auto",
    blurb: "Visão traseira na marcha a ré.",
    description:
      "Câmera de ré com visão noturna e linhas de guia. Instalação simples.",
    cost: 42,
    price: 179,
    compareAt: 249,
    rating: 5,
    image: img("photo-1492144534655-ae79c964c9d7"),
  },
  {
    id: "14",
    slug: "martelo-quebra-vidro",
    name: "Martelo quebra-vidro de emergência",
    category: "auto",
    blurb: "Segurança no carro em emergência.",
    description:
      "Ferramenta de emergência com ponta quebra-vidro e cortador de cinto.",
    cost: 12,
    price: 59,
    compareAt: 89,
    rating: 5,
    image: img("photo-1503376780353-7e6692767b70"),
  },
  {
    id: "15",
    slug: "inflador-pneus-digital",
    name: "Inflador de pneus digital",
    category: "auto",
    blurb: "Pressão certa com display digital.",
    description:
      "Inflador portátil com manômetro digital. Para carro, moto e bike.",
    cost: 48,
    price: 199,
    compareAt: 269,
    rating: 5,
    image: img("photo-1486262715619-67b85e0b08d3"),
  },

  // —— Capitão Pet ——
  {
    id: "16",
    slug: "bebedouro-portatil-pet",
    name: "Bebedouro portátil pet",
    category: "pet",
    blurb: "Água limpa no passeio e na viagem.",
    description:
      "Garrafa/bebedouro portátil para cães e gatos. Sem bagunça no passeio.",
    cost: 22,
    price: 99,
    compareAt: 139,
    rating: 5,
    isNew: true,
    image: img("photo-1548199973-03cce0bbc87b"),
  },
  {
    id: "17",
    slug: "escova-vapor-pet",
    name: "Escova a vapor pet",
    category: "pet",
    blurb: "Desembaraça e hidrata o pelo.",
    description:
      "Escova a vapor para pets: reduz pelos soltos e deixa o pelo macio.",
    cost: 28,
    price: 139,
    compareAt: 189,
    rating: 5,
    image: img("photo-1516734212186-a967f81a0b27"),
  },
  {
    id: "18",
    slug: "removedor-pelos-pet",
    name: "Removedor de pelos pet",
    category: "pet",
    blurb: "Tira pelo de sofá e roupa.",
    description:
      "Removedor reutilizável que captura pelos de cães e gatos em estofados e tecidos.",
    cost: 15,
    price: 79,
    compareAt: 119,
    rating: 5,
    image: img("photo-1587300003388-59208cc962cb"),
  },
  {
    id: "19",
    slug: "brinquedo-inteligente-pet",
    name: "Brinquedo inteligente pet",
    category: "pet",
    blurb: "Estimula e entretém sozinho.",
    description:
      "Brinquedo interativo com movimento/dispenser para manter o pet ativo.",
    cost: 30,
    price: 139,
    compareAt: 189,
    rating: 4,
    image: img("photo-1601758228041-f3b2795255f1"),
  },
  {
    id: "20",
    slug: "camera-para-pets",
    name: "Câmera para pets",
    category: "pet",
    blurb: "Veja e fale com o pet pelo app.",
    description:
      "Câmera Wi-Fi com áudio bidirecional e visão noturna para monitorar o pet.",
    cost: 55,
    price: 229,
    compareAt: 299,
    rating: 5,
    image: img("photo-1557597774-9d273605dfa9"),
  },
  {
    id: "21",
    slug: "coleira-led-pet",
    name: "Coleira LED",
    category: "pet",
    blurb: "Visível à noite no passeio.",
    description:
      "Coleira com LED recarregável. Mais segurança em passeios noturnos.",
    cost: 14,
    price: 69,
    compareAt: 99,
    rating: 4,
    image: img("photo-1548199973-03cce0bbc87b"),
  },
  {
    id: "22",
    slug: "cortador-unha-pet-led",
    name: "Cortador de unhas com LED",
    category: "pet",
    blurb: "Corta com luz pra ver o limite.",
    description:
      "Cortador com LED para visualizar a veia e cortar com mais segurança.",
    cost: 20,
    price: 99,
    compareAt: 139,
    rating: 4,
    image: img("photo-1601758228041-f3b2795255f1"),
  },
  {
    id: "23",
    slug: "alimentador-automatico-pet",
    name: "Alimentador automático",
    category: "pet",
    blurb: "Ração no horário certo, mesmo fora.",
    description:
      "Dispenser automático com agendamento. Porções controladas pelo app ou timer.",
    cost: 65,
    price: 269,
    compareAt: 349,
    rating: 5,
    image: img("photo-1587300003388-59208cc962cb"),
  },

  // —— Capitão Kids ——
  {
    id: "24",
    slug: "camera-baba-wifi",
    name: "Câmera babá Wi-Fi",
    category: "kids",
    blurb: "Monitora o quarto pelo celular.",
    description:
      "Babá eletrônica com visão noturna, áudio e alerta de movimento no app.",
    cost: 58,
    price: 249,
    compareAt: 329,
    rating: 5,
    isNew: true,
    image: img("photo-1557597774-9d273605dfa9"),
  },
  {
    id: "25",
    slug: "luz-noturna-infantil",
    name: "Luz noturna infantil",
    category: "kids",
    blurb: "Luz suave para dormir sem medo.",
    description:
      "Luminária noturna com brilho ajustável e desligamento automático.",
    cost: 16,
    price: 79,
    compareAt: 119,
    rating: 5,
    image: img("photo-1503454537195-1dcabb73ffb9"),
  },
  {
    id: "26",
    slug: "trava-gavetas-infantil",
    name: "Trava de gavetas",
    category: "kids",
    blurb: "Trava sem furar o móvel.",
    description:
      "Travas magnéticas/adesivas para gavetas e armários — segurança infantil.",
    cost: 12,
    price: 69,
    compareAt: 99,
    rating: 4,
    image: img("photo-1503454537195-1dcabb73ffb9"),
  },
  {
    id: "27",
    slug: "protetores-tomada",
    name: "Protetores de tomada",
    category: "kids",
    blurb: "Kit de segurança para tomadas.",
    description:
      "Protetores plásticos reforçados. Kit com várias unidades para a casa toda.",
    cost: 8,
    price: 39,
    compareAt: 59,
    rating: 4,
    image: img("photo-1558002038-1055907df827"),
  },
  {
    id: "28",
    slug: "organizador-brinquedos",
    name: "Organizador de brinquedos",
    category: "kids",
    blurb: "Quarto em ordem sem drama.",
    description:
      "Cestos/organizador modular para brinquedos. Fácil de montar e limpar.",
    cost: 25,
    price: 119,
    compareAt: 169,
    rating: 4,
    image: img("photo-1595428774223-ef52624120d2"),
  },
  {
    id: "29",
    slug: "tapete-educativo",
    name: "Tapete educativo",
    category: "kids",
    blurb: "Brincar e aprender no chão.",
    description:
      "Tapete macio com números, letras ou temas educativos. Fácil de dobrar.",
    cost: 35,
    price: 149,
    compareAt: 199,
    rating: 5,
    image: img("photo-1503454537195-1dcabb73ffb9"),
  },
  {
    id: "30",
    slug: "brinquedo-stem",
    name: "Brinquedo STEM",
    category: "kids",
    blurb: "Ciência e lógica na brincadeira.",
    description:
      "Kit STEM para montar, experimentar e desenvolver raciocínio lógico.",
    cost: 40,
    price: 169,
    compareAt: 229,
    rating: 5,
    image: img("photo-1587654780291-39c9404d746b"),
  },
  {
    id: "31",
    slug: "kit-desenho-lcd",
    name: "Kit de desenho LCD",
    category: "kids",
    blurb: "Desenha, apaga e desenha de novo.",
    description:
      "Prancheta LCD sem tinta e sem papel. Ideal para viagem e casa.",
    cost: 18,
    price: 89,
    compareAt: 129,
    rating: 4,
    image: img("photo-1513364776144-60967b0f800f"),
  },

  // —— Capitão Beauty ——
  {
    id: "32",
    slug: "escova-secadora",
    name: "Escova secadora",
    category: "beauty",
    blurb: "Seca e modela em um passo.",
    description:
      "Escova secadora 2 em 1 para secar e dar volume sem ferramentas extras.",
    cost: 48,
    price: 199,
    compareAt: 279,
    rating: 5,
    isNew: true,
    image: img("photo-1522338140262-f46f5913618a"),
  },
  {
    id: "33",
    slug: "escova-facial-eletrica",
    name: "Escova facial elétrica",
    category: "beauty",
    blurb: "Limpeza profunda da pele.",
    description:
      "Escova facial com cerdas macias e níveis de vibração para limpeza diária.",
    cost: 28,
    price: 129,
    compareAt: 179,
    rating: 4,
    image: img("photo-1596755389378-c31d21fd1273"),
  },
  {
    id: "34",
    slug: "massageador-facial",
    name: "Massageador facial",
    category: "beauty",
    blurb: "Relaxa e estimula a pele.",
    description:
      "Massageador facial elétrico para rotina de skincare e alívio de tensão.",
    cost: 32,
    price: 149,
    compareAt: 199,
    rating: 5,
    image: img("photo-1570172619644-dfd03ed5d881"),
  },
  {
    id: "35",
    slug: "modelador-cachos",
    name: "Modelador de cachos",
    category: "beauty",
    blurb: "Cachos definidos com menos esforço.",
    description:
      "Modelador automático/rotativo para cachos uniformes e duradouros.",
    cost: 42,
    price: 179,
    compareAt: 249,
    rating: 4,
    image: img("photo-1522338140262-f46f5913618a"),
  },
  {
    id: "36",
    slug: "espelho-led-maquiagem",
    name: "Espelho com LED",
    category: "beauty",
    blurb: "Luz certa para maquiagem.",
    description:
      "Espelho de bancada com LED e aumento. Ideal para make e skincare.",
    cost: 35,
    price: 159,
    compareAt: 219,
    rating: 5,
    image: img("photo-1596755389378-c31d21fd1273"),
  },
  {
    id: "37",
    slug: "organizador-maquiagem",
    name: "Organizador de maquiagem",
    category: "beauty",
    blurb: "Make à vista e sem bagunça.",
    description:
      "Organizador acrílico/modular para batons, pincéis e skincare.",
    cost: 22,
    price: 99,
    compareAt: 139,
    rating: 4,
    image: img("photo-1595428774223-ef52624120d2"),
  },
  {
    id: "38",
    slug: "removedor-cravos",
    name: "Removedor de cravos",
    category: "beauty",
    blurb: "Sugador elétrico para poros.",
    description:
      "Aparelho de limpeza por sucção com níveis de intensidade para cravos.",
    cost: 25,
    price: 119,
    compareAt: 169,
    rating: 4,
    image: img("photo-1570172619644-dfd03ed5d881"),
  },
  {
    id: "39",
    slug: "vaporizador-facial",
    name: "Vaporizador facial",
    category: "beauty",
    blurb: "Abre poros e hidrata a pele.",
    description:
      "Vaporizador facial portátil para preparar a pele antes da limpeza ou máscara.",
    cost: 38,
    price: 169,
    compareAt: 229,
    rating: 5,
    image: img("photo-1596755389378-c31d21fd1273"),
  },

  // —— Capitão Casa ——
  {
    id: "40",
    slug: "seladora-embalagens",
    name: "Seladora de embalagens",
    category: "casa",
    blurb: "Fecha pacotes e evita desperdício.",
    description:
      "Seladora portátil USB para fechar embalagens de alimentos com praticidade.",
    cost: 18,
    price: 89,
    compareAt: 129,
    rating: 4,
    isNew: true,
    image: img("photo-1556910103-1c02745aae4d"),
  },
  {
    id: "41",
    slug: "organizadores-modulares",
    name: "Organizadores modulares",
    category: "casa",
    blurb: "Gaveta e armário em ordem.",
    description:
      "Kit de organizadores modulares para cozinha, banheiro ou escritório.",
    cost: 20,
    price: 89,
    compareAt: 129,
    rating: 4,
    image: img("photo-1595428774223-ef52624120d2"),
  },
  {
    id: "42",
    slug: "smart-plug",
    name: "Smart Plug",
    category: "casa",
    blurb: "Liga e desliga pelo celular.",
    description:
      "Tomada inteligente Wi-Fi com agendamento e controle remoto pelo app.",
    cost: 28,
    price: 119,
    compareAt: 169,
    rating: 5,
    image: img("photo-1558002038-1055907df827"),
  },
  {
    id: "43",
    slug: "sensor-wifi-porta",
    name: "Sensor Wi-Fi de porta",
    category: "casa",
    blurb: "Alerta quando a porta abre.",
    description:
      "Sensor magnético Wi-Fi com notificação no celular. Instalação rápida.",
    cost: 25,
    price: 139,
    compareAt: 189,
    rating: 5,
    image: img("photo-1557597774-9d273605dfa9"),
  },
  {
    id: "44",
    slug: "detector-vazamento-wifi",
    name: "Detector de vazamento Wi-Fi",
    category: "casa",
    blurb: "Avisa no celular se detectar água.",
    description:
      "Sensor Wi-Fi de umidade/vazamento. Protege piso e evita surpresa na conta.",
    cost: 28,
    price: 149,
    compareAt: 199,
    rating: 5,
    image: img("photo-1558002038-1055907df827"),
  },
  {
    id: "45",
    slug: "iluminacao-inteligente-led",
    name: "Iluminação inteligente LED",
    category: "casa",
    blurb: "Luz com sensor ou controle no app.",
    description:
      "Lâmpada/fita LED inteligente com sensor de presença ou controle pelo celular.",
    cost: 18,
    price: 99,
    compareAt: 139,
    rating: 5,
    image: img("photo-1565814329452-e1efa11c5b89"),
  },

  // —— Capitão Fit ——
  {
    id: "46",
    slug: "massageador-cervical",
    name: "Massageador cervical",
    category: "fit",
    blurb: "Alívio no pescoço e ombros.",
    description:
      "Massageador cervical elétrico para tensão do home office e do dia a dia.",
    cost: 55,
    price: 249,
    compareAt: 329,
    rating: 5,
    image: img("photo-1544367567-0f2fcb009e0b"),
  },
  {
    id: "47",
    slug: "garrafa-termica",
    name: "Garrafa térmica",
    category: "fit",
    blurb: "Gelado ou quente por horas.",
    description:
      "Garrafa térmica em aço inox. Mantém a temperatura no treino e no trabalho.",
    cost: 22,
    price: 99,
    compareAt: 149,
    rating: 5,
    image: img("photo-1602143407151-7111542de6e8"),
  },
  {
    id: "48",
    slug: "mini-liquidificador-portatil",
    name: "Mini liquidificador portátil",
    category: "fit",
    blurb: "Shake e suco na hora, em qualquer lugar.",
    description:
      "Liquidificador portátil USB para vitaminas, shakes e sucos rápidos.",
    cost: 35,
    price: 149,
    compareAt: 199,
    rating: 4,
    image: img("photo-1570222094114-d054a817e56b"),
  },
  {
    id: "49",
    slug: "pistola-massageadora",
    name: "Pistola massageadora",
    category: "fit",
    blurb: "Recuperação muscular profunda.",
    description:
      "Massage gun com níveis de intensidade e cabeçotes intercambiáveis.",
    cost: 70,
    price: 299,
    compareAt: 399,
    rating: 5,
    isNew: true,
    image: img("photo-1571019614242-c5c5dee9f50b"),
  },
  {
    id: "50",
    slug: "faixas-elasticas",
    name: "Faixas elásticas",
    category: "fit",
    blurb: "Treino em casa com resistência.",
    description:
      "Kit de faixas elásticas com níveis de resistência para musculação e alongamento.",
    cost: 16,
    price: 79,
    compareAt: 119,
    rating: 4,
    image: img("photo-1599058917765-a780eda07a3e"),
  },
];


export const products: Product[] = seed.map((p) => ({
  ...p,
  approved: true,
  isNew: Boolean(p.isNew),
  accent: "#ffc107",
}));

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

export function productsByCategory(category: ProductCategory) {
  return products.filter((p) => p.category === category);
}

export function novidadesProducts() {
  return products.filter((p) => p.isNew);
}
