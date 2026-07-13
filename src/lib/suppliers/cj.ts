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
    /** Estoque mínimo na CJ (ex.: 1 = só com estoque) */
    startInventory?: number;
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
    if (opts.startInventory != null) {
      params.set("startInventory", String(opts.startInventory));
    }

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
    // enable_video = vídeos; countryCode omitido = todas as variantes/estoques
    const data = await cjFetch<Record<string, unknown>>(
      `/product/query?pid=${encodeURIComponent(externalId)}&features=enable_video`,
      { token },
    );
    if (!data) return null;

    // Às vezes a CJ embrulha o produto
    const product =
      data.pid || data.productNameEn || data.variants
        ? data
        : data.product && typeof data.product === "object"
          ? (data.product as Record<string, unknown>)
          : data;

    const variants = variantsFromCjRaw(product);
    // product/query costuma vir sem inventories — busca estoque real por VID
    if (variants.length && variants.every((v) => v.stock <= 0)) {
      await this.hydrateVariantStocks(variants, {
        maxVariants: 8,
        stopAfterInStock: 3,
      });
    }
    const gallery = galleryFromCjRaw(
      product,
      String(product.bigImage || product.productImage || ""),
    );
    const specs = specsFromCjRaw(product);
    const videoUrl = videoFromCjRaw(product);
    const descriptionHtml = String(
      product.description || product.productDescription || "",
    );
    const prices = variants.map((v) => v.priceUsd).filter((n) => n > 0);
    const minPrice = prices.length
      ? Math.min(...prices)
      : Number(product.sellPrice ?? product.nowPrice ?? 0);
    const stock =
      variants.reduce((s, v) => s + v.stock, 0) ||
      Number(product.totalInventory ?? 0);

    const options: Record<string, string[]> = {};
    for (const v of variants) {
      for (const [k, val] of Object.entries(v.optionValues)) {
        if (!options[k]) options[k] = [];
        if (val && !options[k].includes(val)) options[k].push(val);
      }
    }

    return {
      pid: String(product.pid || externalId),
      titleEn: String(
        product.productNameEn || product.productName || "Produto CJ",
      ),
      descriptionHtml,
      descriptionText: stripHtml(descriptionHtml).slice(0, 8000),
      imageUrl: normalizeImageUrl(
        gallery[0] || product.bigImage || product.productImage,
        "/brand/logo-mark.png",
      ),
      gallery: gallery.length
        ? gallery
        : [
            normalizeImageUrl(
              product.bigImage || product.productImage,
              "/brand/logo-mark.png",
            ),
          ],
      videoUrl,
      categoryName:
        typeof product.categoryName === "string"
          ? product.categoryName
          : undefined,
      priceUsd:
        Number.isFinite(minPrice) && minPrice > 0
          ? minPrice
          : Number(product.sellPrice ?? product.nowPrice ?? 0) || 0,
      stock,
      sku: typeof product.productSku === "string" ? product.productSku : undefined,
      variants,
      specs,
      options,
      raw: product,
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
      const data = await cjFetch<
        | Array<{
            totalInventoryNum?: number;
            cjInventoryNum?: number;
            storageNum?: number;
            factoryInventoryNum?: number;
          }>
        | {
            inventory?: number;
            totalInventory?: number;
            totalInventoryNum?: number;
          }
      >(`/product/stock/queryByVid?vid=${encodeURIComponent(variantIdOrSku)}`, {
        token,
      });
      if (Array.isArray(data)) {
        return data.reduce((sum, row) => {
          const n = Number(
            row.totalInventoryNum ??
              row.storageNum ??
              row.cjInventoryNum ??
              row.factoryInventoryNum ??
              0,
          );
          return sum + (Number.isFinite(n) ? Math.max(0, n) : 0);
        }, 0);
      }
      return Number(
        data?.totalInventoryNum ??
          data?.totalInventory ??
          data?.inventory ??
          0,
      );
    } catch {
      const data = await cjFetch<
        | Array<{ totalInventoryNum?: number; inventory?: number }>
        | { inventory?: number; totalInventoryNum?: number }
      >(`/product/stock/queryBySku?sku=${encodeURIComponent(variantIdOrSku)}`, {
        token,
      });
      if (Array.isArray(data)) {
        return data.reduce(
          (sum, row) =>
            sum + Number(row.totalInventoryNum ?? row.inventory ?? 0),
          0,
        );
      }
      return Number(data?.totalInventoryNum ?? data?.inventory ?? 0);
    }
  }

  /**
   * product/query muitas vezes vem sem inventories — hidrata via stock/queryByVid.
   */
  async hydrateVariantStocks(
    variants: import("@/lib/media").CjParsedVariant[],
    opts?: { maxVariants?: number; stopAfterInStock?: number },
  ) {
    const max = Math.min(opts?.maxVariants ?? 8, variants.length);
    const stopAfter = opts?.stopAfterInStock ?? 3;
    let found = 0;
    for (let i = 0; i < max; i++) {
      const v = variants[i];
      if (v.stock > 0) {
        found += 1;
        if (found >= stopAfter) break;
        continue;
      }
      try {
        const n = await this.getStock(v.vid);
        v.stock = Number.isFinite(n) ? Math.max(0, n) : 0;
        if (v.stock > 0) {
          found += 1;
          if (found >= stopAfter) break;
        }
      } catch {
        /* segue */
      }
    }
    return found > 0;
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

      const code = String(data?.trackingNumber || data?.trackNumber || "").trim();
      let status = String(data?.status ?? data?.orderStatus ?? "");
      let carrier = data?.logisticName;
      let events: SupplierTracking["events"];

      // Detalhe logístico CJ (incluído na conta — custo zero)
      if (code) {
        try {
          const track = await cjFetch<
            | {
                trackingNumber?: string;
                logisticName?: string;
                trackingStatus?: string;
                lastMileCarrier?: string;
                lastTrackNumber?: string;
                deliveryTime?: string;
                trackingFrom?: string;
                trackingTo?: string;
              }[]
            | {
                trackingNumber?: string;
                logisticName?: string;
                trackingStatus?: string;
                lastMileCarrier?: string;
                lastTrackNumber?: string;
                deliveryTime?: string;
                trackingFrom?: string;
                trackingTo?: string;
              }
          >(
            `/logistic/trackInfo?trackNumber=${encodeURIComponent(code)}`,
            { token },
          );
          const row = Array.isArray(track) ? track[0] : track;
          if (row) {
            if (row.trackingStatus) status = String(row.trackingStatus);
            carrier = row.logisticName || row.lastMileCarrier || carrier;
            events = [
              {
                at: row.deliveryTime || undefined,
                description: String(row.trackingStatus || status || "Atualização"),
                location: [row.trackingFrom, row.trackingTo]
                  .filter(Boolean)
                  .join(" → ") || undefined,
              },
            ];
            if (row.lastTrackNumber && row.lastTrackNumber !== code) {
              events.push({
                description: `Última milha: ${row.lastTrackNumber}`,
                location: row.lastMileCarrier,
              });
            }
          }
        } catch {
          // trackInfo opcional — orderDetail já basta
        }
      }

      if (!code && !status) {
        return data
          ? { code: "", carrier, status, raw: data }
          : null;
      }

      return {
        code,
        carrier,
        status,
        events,
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
