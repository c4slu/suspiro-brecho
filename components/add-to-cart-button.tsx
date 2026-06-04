"use client";

import { useState } from "react";
import { useCart, CartItem } from "./cart-provider";
import Link from "next/link";

export function AddToCartButton({ item }: { item: CartItem }) {
  const { add, items } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = items.some((i) => i.id === item.id);

  const handleAdd = () => {
    if (inCart) return;
    add(item);
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <div className="flex flex-col gap-3">
      <button
        onClick={handleAdd}
        disabled={inCart}
        className="btn-primary w-full text-base"
        style={{
          background: inCart ? "#7A9E7E" : undefined,
          padding: "1rem 2rem",
        }}
      >
        {inCart ? "✓ Na sacola" : added ? "Adicionado! ✦" : "Adicionar à sacola"}
      </button>

      {inCart && (
        <Link href="/checkout" className="btn-verde w-full text-center text-base" style={{ padding: "1rem 2rem" }}>
          Finalizar compra →
        </Link>
      )}
    </div>
  );
}
