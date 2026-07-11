/**
 * Adapter CJ Dropshipping (API 2.0).
 * Docs: https://developers.cjdropshipping.com
 *
 * Env:
 * - CJ_EMAIL + CJ_API_KEY  → login e obtém access token
 * - ou CJ_ACCESS_TOKEN     → token já pronto
 */
import type {
  SupplierAdapter,
  SupplierCatalogItem,
  SupplierCreateOrderInput,
  SupplierCreateOrderResult,
  SupplierMoney,
  SupplierTracking,
} from "@/lib/suppliers/types";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

type CjAuthCache = {
  token: string;
  expiresAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __cjAuth: CjAuthCache | undefined;
}

async function cjFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown; token: string },
): Promise<T> {
  const res = await fetch(`${CJ_BASE}${path}`, {
    method: opts.method ?? "GET",
    headers: {
      "Content-Type": "application/json",
      "CJ-Access-Token": opts.token,
    },
    body: opts.body ? JSON.stringify(opts.body) : undefined,
    cache: "no-store",
  });

  const data = (await res.json()) as {
    code?: number;
    result?: boolean;
    message?: string;
    data?: T;
  };

  if (!res.ok || data.result === false || (data.code && data.code !== 200)) {
    throw new Error(
      `CJ API ${path}: ${data.message || res.statusText || "erro"}`,
    );
  }

  return data.data as T;
}

export class CJSupplier implements SupplierAdapter {
  readonly code = "cj";
  readonly name = "CJ Dropshipping";

  async ensureAuth(): Promise<void> {
    const direct = process.env.CJ_ACCESS_TOKEN?.trim();
    if (direct) {
      globalThis.__cjAuth = {
        token: direct,
        expiresAt: Date.now() + 1000 * 60 * 60 * 12,
      };
      return;
    }

    const cached = globalThis.__cjAuth;
    if (cached && cached.expiresAt > Date.now() + 60_000) return;

    const email = process.env.CJ_EMAIL?.trim();
    const apiKey = process.env.CJ_API_KEY?.trim();
    if (!email || !apiKey) {
      throw new Error(
        "Configure CJ_ACCESS_TOKEN ou CJ_EMAIL + CJ_API_KEY no ambiente",
      );
    }

    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password: apiKey }),
      cache: "no-store",
    });

    const json = (await res.json()) as {
      result?: boolean;
      message?: string;
      data?: { accessToken?: string; accessTokenExpiryDate?: string };
    };

    if (!json.data?.accessToken) {
      throw new Error(`CJ auth falhou: ${json.message || res.statusText}`);
    }

    globalThis.__cjAuth = {
      token: json.data.accessToken,
      expiresAt: json.data.accessTokenExpiryDate
        ? Date.parse(json.data.accessTokenExpiryDate)
        : Date.now() + 1000 * 60 * 60 * 12,
    };
  }

  private async token(): Promise<string> {
    await this.ensureAuth();
    const t = globalThis.__cjAuth?.token;
    if (!t) throw new Error("CJ sem token");
    return t;
  }

  async getProduct(externalId: string): Promise<SupplierCatalogItem | null> {
    const token = await this.token();
    const data = await cjFetch<{
      pid?: string;
      productNameEn?: string;
      productName?: string;
      productImage?: string;
      sellPrice?: number;
      nowPrice?: number;
      productSku?: string;
      variants?: {
        vid?: string;
        variantSku?: string;
        variantSellPrice?: number;
        variantInventory?: number;
      }[];
    }>(`/product/query?pid=${encodeURIComponent(externalId)}`, { token });

    if (!data) return null;

    const variant = data.variants?.[0];
    const priceAmt = Number(
      variant?.variantSellPrice ?? data.sellPrice ?? data.nowPrice ?? 0,
    );

    return {
      externalId: data.pid || externalId,
      variantId: variant?.vid,
      sku: variant?.variantSku || data.productSku,
      title: data.productNameEn || data.productName || "Produto CJ",
      imageUrl: data.productImage,
      price: { amount: priceAmt, currency: "USD" },
      shippingEstimate: { amount: 0, currency: "USD" },
      stock: Number(variant?.variantInventory ?? 0),
      raw: data,
    };
  }

  async getStock(variantIdOrSku: string): Promise<number> {
    const token = await this.token();
    try {
      const data = await cjFetch<{ inventory?: number; totalInventory?: number }>(
        `/product/stock/queryByVid?vid=${encodeURIComponent(variantIdOrSku)}`,
        { token },
      );
      return Number(data?.totalInventory ?? data?.inventory ?? 0);
    } catch {
      const data = await cjFetch<{ inventory?: number }>(
        `/product/stock/queryBySku?sku=${encodeURIComponent(variantIdOrSku)}`,
        { token },
      );
      return Number(data?.inventory ?? 0);
    }
  }

  async getPrice(variantIdOrSku: string): Promise<SupplierMoney | null> {
    // MVP: reconsulta produto via stock endpoints não traz preço — caller deve usar getProduct
    void variantIdOrSku;
    return null;
  }

  async createOrder(
    input: SupplierCreateOrderInput,
  ): Promise<SupplierCreateOrderResult> {
    const token = await this.token();
    const ship = input.shipTo;

    const data = await cjFetch<{ orderId?: string; orderNum?: string }>(
      "/shopping/order/createOrderV3",
      {
        method: "POST",
        token,
        body: {
          orderNumber: input.orderNumber,
          shippingCustomerName: ship.name,
          email: ship.email,
          shippingPhone: ship.phone || "",
          shippingZip: ship.cep.replace(/\D/g, ""),
          shippingCountry: "Brazil",
          shippingCountryCode: "BR",
          shippingProvince: ship.state,
          shippingCity: ship.city,
          shippingCounty: ship.neighborhood,
          shippingAddress: `${ship.street}, ${ship.number}`,
          shippingAddress2: ship.complement || "",
          fromCountryCode: "CN",
          products: input.lines.map((l) => ({
            vid: l.variantId,
            quantity: l.quantity,
            storeLineItemId: `${input.orderNumber}-${l.variantId}`,
          })),
        },
      },
    );

    const supplierOrderId = String(data?.orderId || data?.orderNum || "");
    if (!supplierOrderId) {
      throw new Error("CJ createOrder sem orderId");
    }

    return { supplierOrderId, raw: data };
  }

  async getTracking(supplierOrderId: string): Promise<SupplierTracking | null> {
    const token = await this.token();
    try {
      const data = await cjFetch<{
        trackingNumber?: string;
        trackNumber?: string;
        logisticName?: string;
        status?: string;
      }>(
        `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(supplierOrderId)}`,
        { token },
      );

      const code = data?.trackingNumber || data?.trackNumber;
      if (!code) return null;

      return {
        code,
        carrier: data?.logisticName,
        status: data?.status,
        raw: data,
      };
    } catch {
      return null;
    }
  }
}

export function getCJSupplier(): CJSupplier {
  return new CJSupplier();
}
