import { products as seedProducts, type Product } from "@/data/products";

export type StoreProduct = Product & {
  active: boolean;
  sku?: string;
  cost?: number;
  /** IDs de produtos para oferecer no checkout (upsell) */
  complementaryIds?: string[];
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
};

const complementaryDefaults: Record<string, string[]> = {
  "1": ["3", "5"], // luminária → tomada, sensor
  "2": ["6", "8"], // organizador → cabides, dispenser
  "3": ["1", "5"], // tomada → luminária, sensor
  "4": ["8", "2"],
  "5": ["3", "7"],
  "6": ["2"],
  "7": ["5", "3"],
  "8": ["4", "2"],
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
  };
}
