"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Product } from "@/data/products";
import type { StorefrontVariant } from "@/lib/catalog";

export type CartItem = {
  productId: string;
  qty: number;
  size?: string;
  supplierVariantId?: string;
  unitPrice?: number;
  sku?: string;
};

export type CartLine = {
  key: string;
  product: Product & {
    variants?: StorefrontVariant[];
  };
  qty: number;
  size?: string;
  supplierVariantId?: string;
  sku?: string;
  unitPrice: number;
  lineTotal: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  lines: CartLine[];
  catalogReady: boolean;
  add: (
    productId: string,
    qty?: number,
    size?: string,
    meta?: {
      supplierVariantId?: string;
      unitPrice?: number;
      sku?: string;
    },
  ) => void;
  setQty: (productId: string, qty: number, size?: string) => void;
  remove: (productId: string, size?: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cf-cart-v4";

function lineKey(productId: string, size?: string, variantId?: string) {
  if (variantId) return `${productId}::v:${variantId}`;
  return size ? `${productId}::${size}` : productId;
}

function sameLine(a: CartItem, productId: string, size?: string, variantId?: string) {
  if (variantId || a.supplierVariantId) {
    return (
      a.productId === productId &&
      (a.supplierVariantId || "") === (variantId || "")
    );
  }
  return a.productId === productId && (a.size || "") === (size || "");
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<
    (Product & { variants?: StorefrontVariant[] })[]
  >([]);
  const [catalogReady, setCatalogReady] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw) as CartItem[]);
    } catch {
      /* ignore */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    void fetch("/api/products")
      .then((r) => r.json())
      .then((d: { products?: (Product & { variants?: StorefrontVariant[] })[] }) => {
        if (d.products?.length) setCatalog(d.products);
      })
      .catch(() => {
        /* keep empty until ready */
      })
      .finally(() => setCatalogReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback(
    (
      productId: string,
      qty = 1,
      size?: string,
      meta?: {
        supplierVariantId?: string;
        unitPrice?: number;
        sku?: string;
      },
    ) => {
      setItems((prev) => {
        const existing = prev.find((i) =>
          sameLine(i, productId, size, meta?.supplierVariantId),
        );
        if (existing) {
          return prev.map((i) =>
            sameLine(i, productId, size, meta?.supplierVariantId)
              ? { ...i, qty: i.qty + qty }
              : i,
          );
        }
        return [
          ...prev,
          {
            productId,
            qty,
            size: size || undefined,
            supplierVariantId: meta?.supplierVariantId,
            unitPrice: meta?.unitPrice,
            sku: meta?.sku,
          },
        ];
      });
    },
    [],
  );

  const setQty = useCallback((productId: string, qty: number, size?: string) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => !sameLine(i, productId, size));
      return prev.map((i) =>
        sameLine(i, productId, size) ? { ...i, qty } : i,
      );
    });
  }, []);

  const remove = useCallback((productId: string, size?: string) => {
    setItems((prev) => prev.filter((i) => !sameLine(i, productId, size)));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const byId = useMemo(() => {
    const map = new Map(catalog.map((p) => [p.id, p]));
    return map;
  }, [catalog]);

  const lines = useMemo(() => {
    return items
      .map((item) => {
        const product = byId.get(item.productId);
        if (!product) return null;
        const unitPrice =
          item.unitPrice ??
          product.variants?.find(
            (v) => v.supplierVariantId === item.supplierVariantId,
          )?.salePrice ??
          product.price;
        return {
          key: lineKey(item.productId, item.size, item.supplierVariantId),
          product,
          qty: item.qty,
          size: item.size,
          supplierVariantId: item.supplierVariantId,
          sku: item.sku,
          unitPrice,
          lineTotal: unitPrice * item.qty,
        };
      })
      .filter(Boolean) as CartLine[];
  }, [items, byId]);

  const count = useMemo(
    () => items.reduce((sum, i) => sum + i.qty, 0),
    [items],
  );
  const subtotal = useMemo(
    () => lines.reduce((sum, l) => sum + l.lineTotal, 0),
    [lines],
  );

  const value = useMemo(
    () => ({
      items,
      count,
      subtotal,
      lines,
      catalogReady,
      add,
      setQty,
      remove,
      clear,
    }),
    [items, count, subtotal, lines, catalogReady, add, setQty, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
