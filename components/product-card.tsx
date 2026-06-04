"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart, CartItem } from "./cart-provider";
import { formatCentavos } from "@/lib/format";
import { useState } from "react";

type Props = {
  peca: CartItem & { categoriaSlug?: string | null };
  index?: number;
};

export function ProductCard({ peca, index = 0 }: Props) {
  const { add, items } = useCart();
  const [added, setAdded] = useState(false);
  const inCart = items.some((i) => i.id === peca.id);

  const rotations = ["rotate-[-1deg]", "rotate-[0.5deg]", "rotate-[1deg]", "rotate-[-0.5deg]"];
  const rotation = rotations[index % rotations.length];

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    if (inCart) return;
    add(peca);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    <Link href={`/peca/${peca.slug}`} className={`product-card block animate-fade-in ${rotation}`} style={{ animationDelay: `${index * 0.07}s` }}>
      {/* Imagem */}
      <div className="relative aspect-[3/4] overflow-hidden" style={{ background: "#EDE0C8" }}>
        {peca.fotoUrl ? (
          <Image
            src={peca.fotoUrl}
            alt={peca.titulo}
            fill
            className="object-cover transition-transform duration-500 group-hover:scale-105"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">👗</div>
        )}

        {/* Badge tamanho */}
        {peca.tamanho && (
          <span
            className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(244, 236, 216, 0.92)", color: "#4A3728", backdropFilter: "blur(4px)" }}
          >
            {peca.tamanho}
          </span>
        )}

        {/* Disco sparkle hover overlay */}
        <div
          className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-300 pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 50%, rgba(212,136,138,0.12), transparent 70%)" }}
        />
      </div>

      {/* Info */}
      <div className="p-4">
        <h3 className="font-semibold text-sm leading-snug line-clamp-2 mb-2" style={{ color: "#4A3728" }}>
          {peca.titulo}
        </h3>

        <div className="flex items-center justify-between gap-2">
          <span className="price-tag text-sm">{formatCentavos(peca.precoCentavos)}</span>

          <button
            onClick={handleAdd}
            disabled={inCart}
            className="shrink-0 w-9 h-9 flex items-center justify-center rounded-full transition-all"
            style={{
              background: inCart ? "#B8D4B8" : added ? "#7A9E7E" : "#D4888A",
              color: "#fff",
              transform: added ? "scale(1.15)" : "scale(1)",
            }}
            aria-label={inCart ? "No carrinho" : "Adicionar ao carrinho"}
          >
            {inCart ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M12 5v14M5 12h14" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </Link>
  );
}
