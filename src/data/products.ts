export type Product = {
  id: string;
  slug: string;
  name: string;
  category: "lar" | "tech";
  blurb: string;
  description: string;
  price: number;
  compareAt?: number;
  image: string;
  accent: string;
};

export const products: Product[] = [
  {
    id: "1",
    slug: "luminaria-smart-halo",
    name: "Luminária Smart Halo",
    category: "tech",
    blurb: "Luz quente ou fria pelo celular. Ideal para sala e home office.",
    description:
      "Controle brilho e temperatura de cor pelo app. Ideal para sala, quarto e home office. Instalação simples e uso diário sem complicação.",
    price: 149.9,
    compareAt: 199.9,
    image:
      "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=1200&q=80",
    accent: "#1FA7A0",
  },
  {
    id: "2",
    slug: "organizador-giratorio-360",
    name: "Organizador Giratório 360°",
    category: "lar",
    blurb: "Despensa e armário em ordem — gira e alcança tudo sem bagunça.",
    description:
      "Base giratória reforçada para temperos, latas e potes. Economiza espaço e evita bagunça no fundo do armário.",
    price: 79.9,
    image:
      "https://images.unsplash.com/photo-1556911220-bff31c875dba?auto=format&fit=crop&w=1200&q=80",
    accent: "#E85D04",
  },
  {
    id: "3",
    slug: "tomada-inteligente-duo",
    name: "Tomada Inteligente Duo",
    category: "tech",
    blurb: "Liga e desliga à distância. Economia e rotina no piloto automático.",
    description:
      "Duas saídas inteligentes com agendamento e controle remoto. Compatível com assistentes de voz mais comuns.",
    price: 89.9,
    compareAt: 119.9,
    image:
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    accent: "#2B6CB0",
  },
  {
    id: "4",
    slug: "mop-spray-compacto",
    name: "Mop Spray Compacto",
    category: "lar",
    blurb: "Limpeza rápida sem balde. Reservatório embutido e cabo ergonômico.",
    description:
      "Reservatório de spray no cabo, microfibra lavável e limpeza úmida sem carregar balde pela casa.",
    price: 119.9,
    image:
      "https://images.unsplash.com/photo-1581578731548-c64695cc6952?auto=format&fit=crop&w=1200&q=80",
    accent: "#C2410C",
  },
  {
    id: "5",
    slug: "sensor-porta",
    name: "Sensor de Porta",
    category: "tech",
    blurb: "Alerta no celular quando a porta abre. Instalação em minutos.",
    description:
      "Sensor magnético discreto com notificação no app. Ideal para porta de entrada, quarto ou escritório.",
    price: 69.9,
    image:
      "https://images.unsplash.com/photo-1558002038-1055907df827?auto=format&fit=crop&w=1200&q=80",
    accent: "#0F766E",
  },
  {
    id: "6",
    slug: "kit-cabides-antideslizantes",
    name: "Kit Cabides Antideslizantes",
    category: "lar",
    blurb: "Guarda-roupa alinhado. Pack com 20 unidades reforçadas.",
    description:
      "Pack com 20 cabides reforçados e antideslizantes. Roupas alinhadas e menos amassado.",
    price: 54.9,
    compareAt: 74.9,
    image:
      "https://images.unsplash.com/photo-1558769132-cb1aea458c5e?auto=format&fit=crop&w=1200&q=80",
    accent: "#B45309",
  },
  {
    id: "7",
    slug: "camera-mini-indoor",
    name: "Câmera Mini Indoor",
    category: "tech",
    blurb: "Visão noturna e áudio bidirecional. Monitoramento discreto.",
    description:
      "Câmera compacta com visão noturna, detecção de movimento e áudio nos dois sentidos.",
    price: 189.9,
    image:
      "https://images.unsplash.com/photo-1557324232-b8917d3c3dcb?auto=format&fit=crop&w=1200&q=80",
    accent: "#1D4ED8",
  },
  {
    id: "8",
    slug: "dispenser-automatico-sabao",
    name: "Dispenser Automático de Sabão",
    category: "lar",
    blurb: "Sensor infravermelho. Menos contato, mais higiene na pia.",
    description:
      "Acionamento por sensor, sem tocar no frasco. Ideal para pia da cozinha ou banheiro.",
    price: 99.9,
    image:
      "https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80",
    accent: "#047857",
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
