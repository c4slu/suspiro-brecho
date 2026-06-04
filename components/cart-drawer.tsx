"use client";

import Image from "next/image";
import Link from "next/link";
import { useCart } from "./cart-provider";
import { formatCentavos } from "@/lib/format";

export function CartDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { items, remove, total, count } = useCart();

  return (
    <>
      {/* Overlay */}
      {open && (
        <div
          className="fixed inset-0 z-40"
          style={{ background: "rgba(74,55,40,0.35)", backdropFilter: "blur(2px)" }}
          onClick={onClose}
        />
      )}

      {/* Drawer */}
      <aside
        className={`fixed top-0 right-0 h-full z-50 flex flex-col ${open ? "cart-drawer-enter" : "translate-x-full"}`}
        style={{ width: "min(420px, 100vw)", background: "#FBF6EE", boxShadow: "-8px 0 40px rgba(74,55,40,0.15)" }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-5 border-b"
          style={{ borderColor: "#E5D5B5" }}
        >
          <h2 className="font-display text-2xl italic" style={{ color: "#4A3728" }}>
            ✦ Meu Carrinho
          </h2>
          <button
            onClick={onClose}
            className="w-9 h-9 flex items-center justify-center rounded-full transition-colors hover:bg-bege-escuro"
            style={{ color: "#4A3728" }}
            aria-label="Fechar carrinho"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto py-4 px-6 space-y-4">
          {count === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 py-20">
              <span style={{ fontSize: 52 }}>🛍️</span>
              <p className="font-display text-xl italic" style={{ color: "#7A5C48" }}>
                Carrinho vazio
              </p>
              <p className="text-sm text-center" style={{ color: "#B8A898" }}>
                Encontre peças únicas no catálogo
              </p>
              <button onClick={onClose} className="btn-primary mt-2">
                Ver catálogo
              </button>
            </div>
          ) : (
            items.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 rounded-2xl"
                style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}
              >
                {/* Imagem */}
                <div className="relative w-20 h-24 rounded-xl overflow-hidden shrink-0" style={{ background: "#E5D5B5" }}>
                  {item.fotoUrl ? (
                    <Image src={item.fotoUrl} alt={item.titulo} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl">👗</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm leading-snug truncate" style={{ color: "#4A3728" }}>
                    {item.titulo}
                  </p>
                  {item.tamanho && (
                    <span className="text-xs mt-1 inline-block px-2 py-0.5 rounded-full" style={{ background: "#E5D5B5", color: "#4A3728" }}>
                      {item.tamanho}
                    </span>
                  )}
                  <p className="price-tag mt-2 text-sm inline-block">
                    {formatCentavos(item.precoCentavos)}
                  </p>
                </div>

                {/* Remove */}
                <button
                  onClick={() => remove(item.id)}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-full transition-colors hover:bg-rosa-claro"
                  style={{ color: "#C97B7B" }}
                  aria-label="Remover item"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 6h18M8 6V4h8v2M19 6l-1 14H6L5 6" />
                  </svg>
                </button>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {count > 0 && (
          <div className="border-t px-6 py-5 space-y-4" style={{ borderColor: "#E5D5B5" }}>
            <div className="flex justify-between items-center">
              <span className="font-semibold" style={{ color: "#7A5C48" }}>Total</span>
              <span className="font-display text-2xl italic" style={{ color: "#4A3728" }}>
                {formatCentavos(total)}
              </span>
            </div>
            <Link href="/checkout" onClick={onClose} className="btn-primary w-full text-center block">
              Finalizar compra
            </Link>
            <button
              onClick={onClose}
              className="btn-secondary w-full text-sm"
            >
              Continuar comprando
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
