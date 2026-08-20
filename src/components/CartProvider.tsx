"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { CartLine } from "@/lib/types";

const KEY = "newstep.cart.v1";

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  ready: boolean;
  add: (line: CartLine) => void;
  setQty: (productId: string, size: number, qty: number) => void;
  remove: (productId: string, size: number) => void;
  clear: () => void;
  drawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [ready, setReady] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(KEY);
      if (raw) setLines(JSON.parse(raw) as CartLine[]);
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem(KEY, JSON.stringify(lines));
  }, [lines, ready]);

  const add = useCallback((line: CartLine) => {
    setLines((prev) => {
      const i = prev.findIndex(
        (l) => l.productId === line.productId && l.size === line.size,
      );
      if (i === -1) return [...prev, line];
      const next = [...prev];
      const merged = next[i]!;
      next[i] = {
        ...merged,
        qty: Math.min(merged.qty + line.qty, merged.maxQty),
      };
      return next;
    });
    setDrawerOpen(true);
  }, []);

  const setQty = useCallback((productId: string, size: number, qty: number) => {
    setLines((prev) =>
      prev.map((l) =>
        l.productId === productId && l.size === size
          ? { ...l, qty: Math.max(1, Math.min(qty, l.maxQty)) }
          : l,
      ),
    );
  }, []);

  const remove = useCallback((productId: string, size: number) => {
    setLines((prev) =>
      prev.filter((l) => !(l.productId === productId && l.size === size)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const value = useMemo<CartContextValue>(() => {
    const count = lines.reduce((n, l) => n + l.qty, 0);
    const subtotal = lines.reduce((n, l) => n + l.qty * l.price, 0);
    return {
      lines,
      count,
      subtotal,
      ready,
      add,
      setQty,
      remove,
      clear,
      drawerOpen,
      openDrawer: () => setDrawerOpen(true),
      closeDrawer: () => setDrawerOpen(false),
    };
  }, [lines, ready, add, setQty, remove, clear, drawerOpen]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
