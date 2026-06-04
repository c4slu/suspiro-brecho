"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

type Categoria = { id: string; nome: string; slug: string };

type Props = {
  categorias: Categoria[];
  tamanhos: string[];
  total: number;
};

const ORDEM_OPTS = [
  { value: "novos",      label: "Mais novos"   },
  { value: "preco-asc",  label: "Menor preço"  },
  { value: "preco-desc", label: "Maior preço"  },
  { value: "nome",       label: "A–Z"          },
];

export function ProductFilters({ categorias, tamanhos, total }: Props) {
  const router   = useRouter();
  const pathname = usePathname();
  const params   = useSearchParams();

  const categoria = params.get("categoria") ?? "";
  const tamanho   = params.get("tamanho")   ?? "";
  const ordem     = params.get("ordem")     ?? "novos";
  const q         = params.get("q")         ?? "";

  const [search,     setSearch]     = useState(q);
  const [navigating, setNavigating] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Mantém o input em sincronia quando a URL mudar externamente
  useEffect(() => { setSearch(q); }, [q]);
  // Reseta o spinner quando os params do servidor chegarem
  useEffect(() => { setNavigating(false); }, [params]);

  function go(overrides: Record<string, string>) {
    const next = new URLSearchParams();
    const merged: Record<string, string> = { q, categoria, tamanho, ordem, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v && v !== "novos") next.set(k, v); });
    // "novos" é o default — não precisa estar na URL
    if (merged.ordem && merged.ordem !== "novos") next.set("ordem", merged.ordem);
    const url = next.toString() ? `${pathname}?${next.toString()}` : pathname;
    setNavigating(true);
    router.push(url);
  }

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => go({ q: value }), 400);
  }

  const hasFilters = !!(categoria || tamanho || q || ordem !== "novos");

  function clearAll() {
    setSearch("");
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setNavigating(true);
    router.push(pathname);
  }

  return (
    <div className="space-y-3">
      {/* Busca + Ordenação */}
      <div className="flex gap-2">
        {/* Campo de busca */}
        <div className="relative flex-1">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="2">
            <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
          </svg>
          <input
            type="search"
            placeholder="Buscar peças, marcas..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="input-base pl-9"
            style={{ minHeight: 44 }}
          />
          {navigating && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-t-transparent animate-spin"
              style={{ borderColor: "#D4888A", borderTopColor: "transparent" }} />
          )}
        </div>

        {/* Ordenação */}
        <select
          value={ordem}
          onChange={(e) => go({ ordem: e.target.value })}
          className="input-base shrink-0"
          style={{
            minHeight: 44,
            width: "auto",
            cursor: "pointer",
            appearance: "none",
            paddingRight: "2.2rem",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A5C48' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat",
            backgroundPosition: "right 10px center",
          }}
          aria-label="Ordenar por"
        >
          {ORDEM_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Filtro por categoria */}
      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            onClick={() => go({ categoria: "" })}
            className="shrink-0 text-sm px-4 py-1.5 rounded-full font-medium whitespace-nowrap transition-all min-h-[36px]"
            style={!categoria
              ? { background: "#4A3728", color: "#F4ECD8" }
              : { background: "#E5D5B5", color: "#4A3728" }}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => go({ categoria: cat.slug === categoria ? "" : cat.slug })}
              className="shrink-0 text-sm px-4 py-1.5 rounded-full font-medium whitespace-nowrap transition-all min-h-[36px]"
              style={categoria === cat.slug
                ? { background: "#D4888A", color: "#fff" }
                : { background: "#E5D5B5", color: "#4A3728" }}
            >
              {cat.nome}
            </button>
          ))}
        </div>
      )}

      {/* Filtro por tamanho */}
      {tamanhos.length > 0 && (
        <div className="flex flex-wrap gap-2 -mx-1 px-1">
          {tamanhos.map((tam) => (
            <button
              key={tam}
              onClick={() => go({ tamanho: tam === tamanho ? "" : tam })}
              className="shrink-0 text-xs px-3 py-1 rounded-full font-bold whitespace-nowrap transition-all min-h-[32px] min-w-[44px]"
              style={tamanho === tam
                ? { background: "#7A9E7E", color: "#fff" }
                : { background: "#fff9f2", color: "#4A3728", border: "1px solid #E5D5B5" }}
            >
              {tam}
            </button>
          ))}
        </div>
      )}

      {/* Barra de status */}
      <div className="flex items-center justify-between min-h-[24px]">
        <p className="text-sm" style={{ color: "#7A5C48" }}>
          {navigating
            ? <span style={{ color: "#B8A898" }}>Buscando…</span>
            : <>{total} {total === 1 ? "peça encontrada" : "peças encontradas"}</>}
        </p>
        {hasFilters && (
          <button
            onClick={clearAll}
            className="text-xs font-medium flex items-center gap-1 transition-opacity hover:opacity-70"
            style={{ color: "#C97B7B" }}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
            Limpar filtros
          </button>
        )}
      </div>
    </div>
  );
}
