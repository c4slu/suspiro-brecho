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

  const handleAdd = () => {
    if (inCart) return;
    add(peca);
    setAdded(true);
    setTimeout(() => setAdded(false), 1800);
  };

  return (
    // Card wrapper é div, não Link — evita conflito de clique button-dentro-de-anchor
    <div
      className={`product-card animate-fade-in ${rotation}`}
      style={{ animationDelay: `${index * 0.07}s` }}
    >
      {/* Imagem — link para a página da peça */}
      <Link href={`/peca/${peca.slug}`} className="block relative aspect-[3/4] overflow-hidden"
        style={{ background: "#EDE0C8" }}>
        {peca.fotoUrl ? (
          <Image
            src={peca.fotoUrl}
            alt={peca.titulo}
            fill
            className="object-cover transition-transform duration-500 hover:scale-105"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-5xl">👗</div>
        )}

        {peca.tamanho && (
          <span
            className="absolute top-3 left-3 text-xs font-bold px-2.5 py-1 rounded-full"
            style={{ background: "rgba(244,236,216,0.92)", color: "#4A3728", backdropFilter: "blur(4px)" }}
          >
            {peca.tamanho}
          </span>
        )}
      </Link>

      {/* Info */}
      <div className="p-3 sm:p-4">
        {/* Título — link para a página */}
        <Link href={`/peca/${peca.slug}`} className="block mb-2">
          <h3 className="font-semibold text-sm leading-snug line-clamp-2" style={{ color: "#4A3728" }}>
            {peca.titulo}
          </h3>
        </Link>

        <div className="flex items-center justify-between gap-2">
          <span className="price-tag text-sm">{formatCentavos(peca.precoCentavos)}</span>

          {/* Botão fora do Link — clique isolado sem conflito */}
          <button
            type="button"
            onClick={handleAdd}
            disabled={inCart}
            className="shrink-0 w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95"
            style={{
              background: inCart ? "#B8D4B8" : added ? "#7A9E7E" : "#D4888A",
              color: "#fff",
              transform: added ? "scale(1.15)" : "scale(1)",
              minWidth: 40,
              minHeight: 40,
            }}
            aria-label={inCart ? "Na sacola" : "Adicionar à sacola"}
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
    </div>
  );
}
