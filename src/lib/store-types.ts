import {
  PRODUCTS_SEED_VERSION,
  products as seedProducts,
  type Product,
} from "@/data/products";

export type StoreProduct = Product & {
  active: boolean;
  sku?: string;
  /** SKU / código no fornecedor (para recompra no drop) */
  supplierSku?: string;
  /** IDs de produtos para oferecer no checkout (upsell) */
  complementaryIds?: string[];
};

export type ShippingAddress = {
  cep: string;
  rua: string;
  numero: string;
  complemento?: string;
  bairro: string;
  cidade: string;
  uf: string;
};

export type OrderItem = {
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type Order = {
  orderId: string;
  createdAt: string;
  status: "pending_payment" | "paid" | "cancelled" | "fulfilled";
  nome: string;
  email: string;
  telefone?: string;
  endereco?: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentRef?: string;
  notes?: string;
  /** Código de rastreio do fornecedor (dropshipping) */
  supplierTracking?: string;
};

export type ClickEvent = {
  id: string;
  createdAt: string;
  tipo: string;
  rotulo?: string;
  pagina?: string;
  href?: string;
  secao?: string;
};

export type StoreState = {
  products: StoreProduct[];
  orders: Order[];
  clicks: ClickEvent[];
  updatedAt: string;
  /** Quando muda, produtos são trocados pelo seed (pedidos permanecem) */
  seedVersion?: number;
};

/** Upsells por afinidade de categoria / uso */
const complementaryDefaults: Record<string, string[]> = {
  "1": ["14", "15", "28"],
  "2": ["10", "26"],
  "3": ["4", "30"],
  "4": ["3", "30"],
  "5": ["13", "18"],
  "6": ["16", "13"],
  "7": ["8"],
  "8": ["7", "18"],
  "9": ["19", "20"],
  "10": ["2", "26"],
  "11": ["12", "24"],
  "12": ["11", "25"],
  "13": ["5", "28"],
  "14": ["1", "15"],
  "15": ["1", "14", "17"],
  "16": ["6", "28"],
  "17": ["15", "13"],
  "18": ["22", "5"],
  "19": ["9", "20"],
  "20": ["9", "19"],
  "21": ["23", "22"],
  "22": ["18", "21"],
  "23": ["21", "6"],
  "24": ["11", "25"],
  "25": ["24", "12"],
  "26": ["10", "11"],
  "27": ["29", "30"],
  "28": ["1", "13", "16"],
  "29": ["27", "20"],
  "30": ["3", "4"],
};

export function seedStoreProducts(): StoreProduct[] {
  return seedProducts.map((p) => ({
    ...p,
    active: true,
    sku: `CF-${p.id.padStart(3, "0")}`,
    complementaryIds: complementaryDefaults[p.id] ?? [],
  }));
}

export function createEmptyStore(): StoreState {
  return {
    products: seedStoreProducts(),
    orders: [],
    clicks: [],
    updatedAt: new Date().toISOString(),
    seedVersion: PRODUCTS_SEED_VERSION,
  };
}

export function applySeedIfNeeded(state: StoreState): StoreState {
  if (state.seedVersion === PRODUCTS_SEED_VERSION) return state;
  return {
    ...state,
    products: seedStoreProducts(),
    seedVersion: PRODUCTS_SEED_VERSION,
    updatedAt: new Date().toISOString(),
  };
}

export function formatAddress(addr?: ShippingAddress) {
  if (!addr) return "";
  const line1 = `${addr.rua}, ${addr.numero}${addr.complemento ? ` — ${addr.complemento}` : ""}`;
  const line2 = `${addr.bairro} · ${addr.cidade}/${addr.uf} · CEP ${addr.cep}`;
  return `${line1}\n${line2}`;
}
