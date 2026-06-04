"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useEffect, useRef, useState, useTransition } from "react";

type Categoria = { id: string; nome: string; slug: string };

type Props = {
  categorias: Categoria[];
  tamanhos: string[];
  total: number;
};

const ORDEM_OPTS = [
  { value: "novos", label: "Mais novos" },
  { value: "preco-asc", label: "Menor preço" },
  { value: "preco-desc", label: "Maior preço" },
  { value: "nome", label: "A–Z" },
];

export function ProductFilters({ categorias, tamanhos, total }: Props) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const categoria = params.get("categoria") ?? "";
  const tamanho = params.get("tamanho") ?? "";
  const ordem = params.get("ordem") ?? "novos";
  const q = params.get("q") ?? "";

  const [search, setSearch] = useState(q);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sincroniza search input com URL
  useEffect(() => { setSearch(q); }, [q]);

  function buildUrl(overrides: Record<string, string>) {
    const p = new URLSearchParams();
    const merged = { q, categoria, tamanho, ordem, ...overrides };
    Object.entries(merged).forEach(([k, v]) => { if (v) p.set(k, v); });
    return `${pathname}?${p.toString()}`;
  }

  function navigate(overrides: Record<string, string>) {
    startTransition(() => router.push(buildUrl(overrides), { scroll: false }));
  }

  function handleSearch(value: string) {
    setSearch(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      navigate({ q: value, categoria, tamanho, ordem });
    }, 350);
  }

  const hasFilters = !!(categoria || tamanho || q || ordem !== "novos");

  return (
    <div className="space-y-3">
      {/* Barra de busca + ordenação */}
      <div className="flex gap-2">
        {/* Search */}
        <div className="relative flex-1">
          <svg
            className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
            width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#B8A898" strokeWidth="2"
          >
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
          {isPending && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border-2 border-rosa border-t-transparent animate-spin" />
          )}
        </div>

        {/* Sort */}
        <select
          value={ordem}
          onChange={(e) => navigate({ ordem: e.target.value })}
          className="input-base shrink-0 pr-8"
          style={{ minHeight: 44, width: "auto", cursor: "pointer", appearance: "none",
            backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%237A5C48' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
            backgroundRepeat: "no-repeat", backgroundPosition: "right 12px center", paddingRight: "2.5rem" }}
          aria-label="Ordenar"
        >
          {ORDEM_OPTS.map((o) => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      </div>

      {/* Chips de categoria */}
      {categorias.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none">
          <button
            onClick={() => navigate({ categoria: "" })}
            className="shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap min-h-[36px]"
            style={!categoria
              ? { background: "#4A3728", color: "#F4ECD8" }
              : { background: "#E5D5B5", color: "#4A3728" }}
          >
            Todas
          </button>
          {categorias.map((cat) => (
            <button
              key={cat.id}
              onClick={() => navigate({ categoria: cat.slug === categoria ? "" : cat.slug })}
              className="shrink-0 text-sm px-4 py-1.5 rounded-full font-medium transition-all whitespace-nowrap min-h-[36px]"
              style={categoria === cat.slug
                ? { background: "#D4888A", color: "#fff" }
                : { background: "#E5D5B5", color: "#4A3728" }}
            >
              {cat.nome}
            </button>
          ))}
        </div>
      )}

      {/* Chips de tamanho */}
      {tamanhos.length > 0 && (
        <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1 scrollbar-none flex-wrap sm:flex-nowrap">
          {tamanhos.map((tam) => (
            <button
              key={tam}
              onClick={() => navigate({ tamanho: tam === tamanho ? "" : tam })}
              className="shrink-0 text-xs px-3 py-1 rounded-full font-bold transition-all whitespace-nowrap min-h-[32px] min-w-[44px]"
              style={tamanho === tam
                ? { background: "#7A9E7E", color: "#fff" }
                : { background: "#fff9f2", color: "#4A3728", border: "1px solid #E5D5B5" }}
            >
              {tam}
            </button>
          ))}
        </div>
      )}

      {/* Status bar */}
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: "#7A5C48" }}>
          {total} {total === 1 ? "peça encontrada" : "peças encontradas"}
          {isPending && <span className="ml-2 text-xs" style={{ color: "#B8A898" }}>atualizando…</span>}
        </p>
        {hasFilters && (
          <button
            onClick={() => { setSearch(""); navigate({ q: "", categoria: "", tamanho: "", ordem: "novos" }); }}
            className="text-xs font-medium transition-opacity hover:opacity-70 flex items-center gap-1"
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
