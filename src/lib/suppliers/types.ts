/**
 * Contrato de todo fornecedor (CJ, nacional, etc.).
 * Trocar fornecedor = novo adapter, mesma loja.
 */
export type SupplierMoney = {
  amount: number;
  currency: "USD" | "BRL" | string;
};

export type SupplierCatalogItem = {
  externalId: string;
  variantId?: string;
  sku?: string;
  title: string;
  imageUrl?: string;
  price: SupplierMoney;
  shippingEstimate?: SupplierMoney;
  stock: number;
  raw?: unknown;
};

export type SupplierShipTo = {
  name: string;
  email: string;
  phone?: string;
  cep: string;
  street: string;
  number: string;
  complement?: string;
  neighborhood: string;
  city: string;
  state: string;
  countryCode: string; // BR
};

export type SupplierCreateOrderInput = {
  orderNumber: string;
  shipTo: SupplierShipTo;
  lines: {
    variantId: string;
    sku?: string;
    quantity: number;
  }[];
};

export type SupplierCreateOrderResult = {
  supplierOrderId: string;
  raw?: unknown;
};

export type SupplierTracking = {
  code: string;
  carrier?: string;
  status?: string;
  raw?: unknown;
};

export interface SupplierAdapter {
  readonly code: string;
  readonly name: string;

  /** Auth / refresh token se necessário */
  ensureAuth(): Promise<void>;

  getProduct(externalId: string): Promise<SupplierCatalogItem | null>;

  getStock(variantIdOrSku: string): Promise<number>;

  getPrice(variantIdOrSku: string): Promise<SupplierMoney | null>;

  createOrder(input: SupplierCreateOrderInput): Promise<SupplierCreateOrderResult>;

  getTracking(supplierOrderId: string): Promise<SupplierTracking | null>;

  cancelOrder?(supplierOrderId: string): Promise<void>;
}
