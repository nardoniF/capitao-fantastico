export type Product = {
  id: string;
  slug: string;
  name: string;
  category: "lar" | "tech";
  blurb: string;
  description: string;
  /** Preço de venda (BRL) — margem drop típica sobre custo fornecedor */
  price: number;
  /** Custo estimado fornecedor (referência interna) */
  cost: number;
  compareAt?: number;
  image: string;
  accent: string;
};

/**
 * Preços calibrados para drop BR (custo fornecedor → venda com margem).
 * Ajuste no /admin conforme sua tabela real do fornecedor.
 */
export const products: Product[] = [
  {
    id: "1",
    slug: "luminaria-smart-halo",
    name: "Luminária Smart Halo",
    category: "tech",
    blurb: "Luz quente/fria pelo app. Sala e home office.",
    description:
      "Controle de brilho e temperatura de cor pelo celular. Ideal para sala, quarto e home office.",
    cost: 38,
    price: 97.9,
    compareAt: 149.9,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=800&q=80",
    accent: "#ffc107",
  },
  {
    id: "2",
    slug: "organizador-giratorio-360",
    name: "Organizador Giratório 360°",
    category: "lar",
    blurb: "Despensa e armário em ordem — gira 360°.",
    description:
      "Base giratória reforçada para temperos e potes. Economiza espaço no armário.",
    cost: 22,
    price: 59.9,
    compareAt: 89.9,
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c875dba?auto=format&fit=crop&w=800&q=80",
    accent: "#ffc107",
  },
  {
    id: "3",
    slug: "tomada-inteligente-duo",
    name: "Tomada Inteligente Duo",
    category: "tech",
    blurb: "Liga/desliga à distância. Rotina no automático.",
    description:
      "Duas saídas com agendamento e controle remoto. Compatível com assistentes de voz.",
    cost: 28,
    price: 69.9,
    compareAt: 99.9,
    image:
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=800&q=80",
    accent: "#ffc107",
  },
  {
    id: "4",
    slug: "mop-spray-compacto",
    name: "Mop Spray Compacto",
    category: "lar",
    blurb: "Limpeza rápida sem balde. Reservatório no cabo.",
    description:
      "Spray no cabo, microfibra lavável. Limpeza úmida sem carregar balde.",
    cost: 32,
    price: 79.9,
    compareAt: 119.9,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=800&q=80",
    accent: "#ffc107",
  },
  {
    id: "5",
    slug: "sensor-porta",
    name: "Sensor de Porta",
    category: "tech",
    blurb: "Alerta no celular quando a porta abre.",
    description:
      "Sensor magnético discreto com notificação no app. Instalação em minutos.",
    cost: 18,
    price: 49.9,
    compareAt: 79.9,
    image:
      "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?auto=format&fit=crop&w=800&q=80",
    accent: "#ffc107",
  },
  {
    id: "6",
    slug: "kit-cabides-antideslizantes",
    name: "Kit 20 Cabides Antideslizantes",
    category: "lar",
    blurb: "Pack com 20 unidades reforçadas.",
    description:
      "Cabides antideslizantes. Guarda-roupa alinhado e menos amassado.",
    cost: 16,
    price: 44.9,
    compareAt: 69.9,
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=800&q=80",
    accent: "#ffc107",
  },
  {
    id: "7",
    slug: "camera-mini-indoor",
    name: "Câmera Mini Indoor",
    category: "tech",
    blurb: "Visão noturna e áudio bidirecional.",
    description:
      "Câmera compacta com visão noturna, movimento e áudio nos dois sentidos.",
    cost: 55,
    price: 139.9,
    compareAt: 199.9,
    image:
      "https://images.unsplash.com/photo-1557597774-9d273605dfa9?auto=format&fit=crop&w=800&q=80",
    accent: "#ffc107",
  },
  {
    id: "8",
    slug: "dispenser-automatico-sabao",
    name: "Dispenser Automático",
    category: "lar",
    blurb: "Sensor infravermelho. Mais higiene na pia.",
    description:
      "Acionamento por sensor, sem tocar no frasco. Cozinha ou banheiro.",
    cost: 24,
    price: 64.9,
    compareAt: 99.9,
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=800&q=80",
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
