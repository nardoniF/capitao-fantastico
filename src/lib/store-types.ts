import {
  PRODUCTS_SEED_VERSION,
  products as seedProducts,
  type Product,
} from "@/data/products";
import type { StorefrontVariant } from "@/lib/catalog";

export type StoreProduct = Product & {
  active: boolean;
  sku?: string;
  supplierSku?: string;
  complementaryIds?: string[];
  variants?: StorefrontVariant[];
  videoUrl?: string | null;
  seoTitle?: string | null;
  seoDescription?: string | null;
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
  supplierVariantId?: string;
  supplierSku?: string;
  size?: string;
};

export type Order = {
  orderId: string;
  createdAt: string;
  status:
    | "pending_payment"
    | "paid"
    | "fulfilling"
    | "shipped"
    | "cancelled"
    | "fulfilled"
    | "failed";
  nome: string;
  email: string;
  telefone?: string;
  endereco?: ShippingAddress;
  items: OrderItem[];
  subtotal: number;
  total: number;
  paymentRef?: string;
  notes?: string;
  supplierOrderId?: string;
  supplierTracking?: string;
  trackingCarrier?: string;
  trackingEvents?: {
    at: string;
    label: string;
    detail?: string;
  }[];
  /** Índice de Missão — e-mail pós-entrega */
  missionToken?: string;
  missionAskedAt?: string;
  missionResponse?: "ok" | "help";
  missionRespondedAt?: string;
  updatedAt?: string;
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
  seedVersion?: number;
};

/** Upsells por afinidade de categoria */
const complementaryDefaults: Record<string, string[]> = {
  "1": ["2", "3", "7"],
  "2": ["1", "3", "6"],
  "3": ["2", "5", "1"],
  "4": ["1", "12"],
  "5": ["6", "3"],
  "6": ["5", "7"],
  "7": ["1", "6"],
  "8": ["15", "9"],
  "9": ["8", "12"],
  "10": ["11", "8"],
  "11": ["10", "2"],
  "12": ["8", "9"],
  "13": ["10", "14"],
  "14": ["13", "8"],
  "15": ["8", "11"],
  "16": ["17", "18"],
  "17": ["18", "22"],
  "18": ["16", "17"],
  "19": ["16", "23"],
  "20": ["23", "16"],
  "21": ["16", "18"],
  "22": ["17", "18"],
  "23": ["16", "20"],
  "24": ["25", "26"],
  "25": ["24", "26"],
  "26": ["27", "25"],
  "27": ["26", "28"],
  "28": ["29", "31"],
  "29": ["28", "30"],
  "30": ["29", "31"],
  "31": ["28", "30"],
  "32": ["35", "36"],
  "33": ["34", "38"],
  "34": ["33", "39"],
  "35": ["32", "36"],
  "36": ["32", "37"],
  "37": ["36", "32"],
  "38": ["33", "39"],
  "39": ["34", "38"],
  "40": ["41", "42"],
  "41": ["40", "45"],
  "42": ["43", "45"],
  "43": ["42", "44"],
  "44": ["43", "42"],
  "45": ["42", "41"],
  "46": ["49", "50"],
  "47": ["48", "50"],
  "48": ["47", "49"],
  "49": ["46", "50"],
  "50": ["46", "47"],
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
