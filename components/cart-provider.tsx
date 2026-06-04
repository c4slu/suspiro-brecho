"use client";

import { createContext, useContext, useEffect, useState } from "react";

export type CartItem = {
  id: string;
  titulo: string;
  slug: string;
  precoCentavos: number;
  fotoUrl: string | null;
  tamanho: string | null;
};

type CartContextType = {
  items: CartItem[];
  add: (item: CartItem) => void;
  remove: (id: string) => void;
  clear: () => void;
  total: number;
  count: number;
};

const CartContext = createContext<CartContextType | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    const stored = localStorage.getItem("suspiro-cart");
    if (stored) setItems(JSON.parse(stored));
  }, []);

  useEffect(() => {
    localStorage.setItem("suspiro-cart", JSON.stringify(items));
  }, [items]);

  const add = (item: CartItem) => {
    setItems((prev) =>
      prev.find((i) => i.id === item.id) ? prev : [...prev, item]
    );
  };

  const remove = (id: string) => setItems((prev) => prev.filter((i) => i.id !== id));
  const clear = () => setItems([]);

  const total = items.reduce((acc, i) => acc + i.precoCentavos, 0);
  const count = items.length;

  return (
    <CartContext.Provider value={{ items, add, remove, clear, total, count }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
