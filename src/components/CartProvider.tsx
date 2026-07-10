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
import { products as seedProducts, type Product } from "@/data/products";

export type CartItem = {
  productId: string;
  qty: number;
};

type CartContextValue = {
  items: CartItem[];
  count: number;
  subtotal: number;
  lines: { product: Product; qty: number; lineTotal: number }[];
  catalogReady: boolean;
  add: (productId: string, qty?: number) => void;
  setQty: (productId: string, qty: number) => void;
  remove: (productId: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "cf-cart-v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [catalog, setCatalog] = useState<Product[]>(seedProducts);
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
      .then((d: { products?: Product[] }) => {
        if (d.products?.length) setCatalog(d.products);
      })
      .catch(() => {
        /* keep seed */
      })
      .finally(() => setCatalogReady(true));
  }, []);

  useEffect(() => {
    if (!ready) return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, ready]);

  const add = useCallback((productId: string, qty = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.productId === productId);
      if (existing) {
        return prev.map((i) =>
          i.productId === productId ? { ...i, qty: i.qty + qty } : i,
        );
      }
      return [...prev, { productId, qty }];
    });
  }, []);

  const setQty = useCallback((productId: string, qty: number) => {
    setItems((prev) => {
      if (qty <= 0) return prev.filter((i) => i.productId !== productId);
      return prev.map((i) => (i.productId === productId ? { ...i, qty } : i));
    });
  }, []);

  const remove = useCallback((productId: string) => {
    setItems((prev) => prev.filter((i) => i.productId !== productId));
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
        return {
          product,
          qty: item.qty,
          lineTotal: product.price * item.qty,
        };
      })
      .filter(Boolean) as { product: Product; qty: number; lineTotal: number }[];
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
