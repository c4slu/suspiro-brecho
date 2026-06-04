"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "./cart-provider";
import { CartDrawer } from "./cart-drawer";

export function Header() {
  const { count } = useCart();
  const [cartOpen, setCartOpen] = useState(false);
  const pathname = usePathname();

  const navLinks = [
    { href: "/", label: "Início" },
    { href: "/produtos", label: "Produtos" },
  ];

  return (
    <>
      <header
        className="fixed top-0 left-0 right-0 z-30"
        style={{
          background: "rgba(244, 236, 216, 0.92)",
          backdropFilter: "blur(16px)",
          WebkitBackdropFilter: "blur(16px)",
          borderBottom: "1px solid rgba(229, 213, 181, 0.6)",
        }}
      >
        <nav className="max-w-7xl mx-auto px-4 h-14 sm:h-16 flex items-center justify-between gap-3">
          {/* Logo */}
          <Link
            href="/"
            className="font-display italic text-xl sm:text-2xl leading-none shrink-0"
            style={{ color: "#4A3728" }}
          >
            ✦ Suspiro
          </Link>

          {/* Nav links — visíveis em qualquer tela */}
          <div className="flex items-center gap-1 sm:gap-2">
            {navLinks.map(({ href, label }) => {
              const active = pathname === href;
              return (
                <Link
                  key={href}
                  href={href}
                  className="text-sm font-medium px-3 py-1.5 rounded-full transition-all"
                  style={active
                    ? { background: "#4A3728", color: "#F4ECD8" }
                    : { color: "#7A5C48" }}
                >
                  {label}
                </Link>
              );
            })}
          </div>

          {/* Cart button */}
          <button
            onClick={() => setCartOpen(true)}
            className="relative flex items-center gap-1.5 px-3 sm:px-4 py-2 rounded-full transition-all shrink-0 min-h-[44px]"
            style={{ background: "#4A3728", color: "#F4ECD8" }}
            aria-label="Abrir carrinho"
          >
            <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
              <path d="M3 6h18M16 10a4 4 0 01-8 0" />
            </svg>
            <span className="text-sm font-semibold hidden sm:inline">Sacola</span>
            {count > 0 && (
              <span
                className="absolute -top-1.5 -right-1.5 w-5 h-5 flex items-center justify-center rounded-full text-xs font-bold"
                style={{ background: "#D4888A", color: "#fff" }}
              >
                {count}
              </span>
            )}
          </button>
        </nav>
      </header>

      <CartDrawer open={cartOpen} onClose={() => setCartOpen(false)} />
    </>
  );
}
