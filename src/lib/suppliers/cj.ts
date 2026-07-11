/**
 * Adapter CJ Dropshipping (API 2.0).
 * Docs: https://developers.cjdropshipping.com
 *
 * Env:
 * - CJ_API_KEY           → POST /authentication/getAccessToken { apiKey }
 * - ou CJ_ACCESS_TOKEN   → token já pronto
 */
import type {
  SupplierAdapter,
  SupplierCatalogItem,
  SupplierCreateOrderInput,
  SupplierCreateOrderResult,
  SupplierMoney,
  SupplierTracking,
} from "@/lib/suppliers/types";
import type {
  CjFreightQuote,
  CjProductFull,
  CjSearchHit,
} from "@/lib/suppliers/cj-types";
import {
  galleryFromCjRaw,
  normalizeImageUrl,
  specsFromCjRaw,
  stripHtml,
  variantsFromCjRaw,
  videoFromCjRaw,
} from "@/lib/media";

const CJ_BASE = "https://developers.cjdropshipping.com/api2.0/v1";

type CjAuthCache = {
  token: string;
  expiresAt: number;
};

declare global {
  // eslint-disable-next-line no-var
  var __cjAuth: CjAuthCache | undefined;
  // eslint-disable-next-line no-var
  var __cjLastFetchAt: number | undefined;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

/** CJ limita ~1 req/s — fila global + retry em QPS. */
async function cjThrottle() {
  const last = globalThis.__cjLastFetchAt || 0;
  const wait = 1100 - (Date.now() - last);
  if (wait > 0) await sleep(wait);
  globalThis.__cjLastFetchAt = Date.now();
}

async function cjFetch<T>(
  path: string,
  opts: { method?: string; body?: unknown; token: string },
): Promise<T> {
  let lastErr: Error | null = null;

  for (let attempt = 0; attempt < 4; attempt++) {
    await cjThrottle();

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

    const msg = data.message || res.statusText || "erro";
    const isQps =
      res.status === 429 ||
      /too many requests|qps/i.test(msg) ||
      data.code === 1600200;

    if (isQps) {
      lastErr = new Error(`CJ API ${path}: ${msg}`);
      await sleep(1200 * (attempt + 1));
      continue;
    }

    if (!res.ok || data.result === false || (data.code && data.code !== 200)) {
      throw new Error(`CJ API ${path}: ${msg}`);
    }

    return data.data as T;
  }

  throw lastErr || new Error(`CJ API ${path}: QPS esgotado`);
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

    const apiKey = process.env.CJ_API_KEY?.trim();
    if (!apiKey) {
      throw new Error("Configure CJ_API_KEY ou CJ_ACCESS_TOKEN no ambiente");
    }

    const res = await fetch(`${CJ_BASE}/authentication/getAccessToken`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ apiKey }),
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

  async searchProducts(opts: {
    keyword?: string;
    categoryId?: string;
    page?: number;
    pageSize?: number;
    /** 0=all, 2=trending, 21=trending more */
    searchType?: number;
    /** createAt | listedNum */
    orderBy?: "createAt" | "listedNum";
    sort?: "asc" | "desc";
    minPrice?: number;
    maxPrice?: number;
  }): Promise<{ list: CjSearchHit[]; total: number }> {
    const token = await this.token();
    const page = opts.page ?? 1;
    const pageSize = Math.min(opts.pageSize ?? 20, 100);
    const params = new URLSearchParams({
      pageNum: String(page),
      pageSize: String(pageSize),
      sort: opts.sort ?? "desc",
      orderBy: opts.orderBy ?? "listedNum",
    });
    if (opts.keyword?.trim()) {
      params.set("productNameEn", opts.keyword.trim());
    }
    if (opts.categoryId?.trim()) {
      params.set("categoryId", opts.categoryId.trim());
    }
    if (opts.searchType != null) {
      params.set("searchType", String(opts.searchType));
    }
    if (opts.minPrice != null) params.set("minPrice", String(opts.minPrice));
    if (opts.maxPrice != null) params.set("maxPrice", String(opts.maxPrice));

    const data = await cjFetch<{
      list?: {
        pid?: string;
        productNameEn?: string;
        productName?: string;
        productImage?: string;
        sellPrice?: number | string;
        nowPrice?: number | string;
        categoryName?: string;
        listedNum?: number;
      }[];
      total?: number;
    }>(`/product/list?${params.toString()}`, { token });

    const parsePrice = (raw: unknown) => {
      if (typeof raw === "number") return raw;
      if (typeof raw === "string") {
        const n = Number(raw.split("--")[0].trim());
        return Number.isFinite(n) ? n : 0;
      }
      return 0;
    };

    const list: CjSearchHit[] = (data?.list || [])
      .map((row) => {
        const priceUsd = parsePrice(row.sellPrice ?? row.nowPrice);
        return {
          pid: String(row.pid || ""),
          title: row.productNameEn || row.productName || "Produto CJ",
          imageUrl: normalizeImageUrl(row.productImage, "/brand/logo-mark.png"),
          priceUsd: Number.isFinite(priceUsd) ? priceUsd : 0,
          categoryName: row.categoryName,
          listedNum: Number(row.listedNum ?? 0) || 0,
        };
      })
      .filter((h) => h.pid);

    return { list, total: Number(data?.total ?? list.length) };
  }

  async getProductFull(externalId: string): Promise<CjProductFull | null> {
    const token = await this.token();
    const data = await cjFetch<Record<string, unknown>>(
      `/product/query?pid=${encodeURIComponent(externalId)}`,
      { token },
    );
    if (!data) return null;

    const variants = variantsFromCjRaw(data);
    const gallery = galleryFromCjRaw(data, String(data.productImage || ""));
    const specs = specsFromCjRaw(data);
    const videoUrl = videoFromCjRaw(data);
    const descriptionHtml = String(
      data.description || data.productDescription || "",
    );
    const prices = variants.map((v) => v.priceUsd).filter((n) => n > 0);
    const minPrice = prices.length
      ? Math.min(...prices)
      : Number(data.sellPrice ?? data.nowPrice ?? 0);
    const stock = variants.reduce((s, v) => s + v.stock, 0) ||
      Number(data.totalInventory ?? 0);

    const options: Record<string, string[]> = {};
    for (const v of variants) {
      for (const [k, val] of Object.entries(v.optionValues)) {
        if (!options[k]) options[k] = [];
        if (val && !options[k].includes(val)) options[k].push(val);
      }
    }

    return {
      pid: String(data.pid || externalId),
      titleEn:
        String(data.productNameEn || data.productName || "Produto CJ"),
      descriptionHtml,
      descriptionText: stripHtml(descriptionHtml).slice(0, 8000),
      imageUrl: normalizeImageUrl(
        gallery[0] || data.productImage,
        "/brand/logo-mark.png",
      ),
      gallery: gallery.length ? gallery : [
        normalizeImageUrl(data.productImage, "/brand/logo-mark.png"),
      ],
      videoUrl,
      categoryName:
        typeof data.categoryName === "string" ? data.categoryName : undefined,
      priceUsd: Number.isFinite(minPrice) && minPrice > 0
        ? minPrice
        : Number(data.sellPrice ?? data.nowPrice ?? 0) || 0,
      stock,
      sku: typeof data.productSku === "string" ? data.productSku : undefined,
      variants,
      specs,
      options,
      raw: data,
    };
  }

  async getProduct(externalId: string): Promise<SupplierCatalogItem | null> {
    const full = await this.getProductFull(externalId);
    if (!full) return null;
    const first = full.variants[0];
    return {
      externalId: full.pid,
      variantId: first?.vid,
      sku: first?.sku || full.sku,
      title: full.titleEn,
      imageUrl: full.imageUrl,
      price: { amount: full.priceUsd, currency: "USD" },
      shippingEstimate: { amount: 0, currency: "USD" },
      stock: full.stock,
      raw: full.raw,
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
        orderStatus?: string | number;
      }>(
        `/shopping/order/getOrderDetail?orderId=${encodeURIComponent(supplierOrderId)}`,
        { token },
      );

      const code = data?.trackingNumber || data?.trackNumber;
      if (!code) {
        return data
          ? {
              code: "",
              carrier: data.logisticName,
              status: String(data.status ?? data.orderStatus ?? ""),
              raw: data,
            }
          : null;
      }

      return {
        code,
        carrier: data?.logisticName,
        status: String(data?.status ?? data?.orderStatus ?? ""),
        raw: data,
      };
    } catch {
      return null;
    }
  }

  /**
   * Frete estimado CJ → Brasil para 1 unidade do vid.
   * Tenta CN primeiro; se falhar, tenta IN (e marca origem).
   */
  async freightToBrazil(opts: {
    vid: string;
    preferredOrigin?: string;
  }): Promise<CjFreightQuote | null> {
    const token = await this.token();
    const origins = [
      opts.preferredOrigin?.toUpperCase(),
      "CN",
      "US",
      "IN",
    ].filter((c, i, arr): c is string => Boolean(c) && arr.indexOf(c) === i);

    for (const startCountryCode of origins) {
      try {
        const data = await cjFetch<
          | {
              logisticName?: string;
              freightAmount?: number | string;
              firstPostage?: number | string;
              postageAmount?: number | string;
              aging?: number | string;
              totalPostageAmount?: number | string;
            }[]
          | {
              list?: {
                logisticName?: string;
                freightAmount?: number | string;
                firstPostage?: number | string;
                postageAmount?: number | string;
                aging?: number | string;
                totalPostageAmount?: number | string;
              }[];
            }
        >("/logistic/freightCalculate", {
          method: "POST",
          token,
          body: {
            startCountryCode,
            endCountryCode: "BR",
            products: [{ vid: opts.vid, quantity: 1 }],
          },
        });

        const rows = Array.isArray(data)
          ? data
          : Array.isArray(data?.list)
            ? data.list
            : [];
        if (!rows.length) continue;

        const parsed = rows
          .map((row) => {
            const amount = Number(
              row.totalPostageAmount ??
                row.freightAmount ??
                row.postageAmount ??
                row.firstPostage ??
                0,
            );
            const days = Number(row.aging);
            return {
              amountUsd: Number.isFinite(amount) ? amount : 0,
              logisticName: row.logisticName,
              days: Number.isFinite(days) && days > 0 ? days : undefined,
              startCountryCode,
            } satisfies CjFreightQuote;
          })
          .filter((q) => q.amountUsd > 0)
          .sort((a, b) => a.amountUsd - b.amountUsd);

        if (parsed[0]) return parsed[0];
      } catch {
        /* tenta próxima origem */
      }
    }

    return null;
  }
}

export function getCJSupplier(): CJSupplier {
  return new CJSupplier();
}
