import { prisma } from "@/lib/prisma";
import { Header } from "@/components/header";
import { ProductCard } from "@/components/product-card";
import { Suspense } from "react";
import { ProductFilters } from "@/components/product-filters";

type SearchParams = Promise<{
  q?: string;
  categoria?: string;
  tamanho?: string;
  ordem?: string;
}>;

type PecaCard = {
  id: string; titulo: string; slug: string; precoCentavos: number;
  tamanho: string | null; fotos: { url: string }[];
  categoria: { slug: string } | null;
};

async function getPecas(params: {
  q?: string; categoria?: string; tamanho?: string; ordem?: string;
}): Promise<PecaCard[]> {
  const { q, categoria, tamanho, ordem } = params;

  const orderBy = (() => {
    switch (ordem) {
      case "preco-asc":  return { precoCentavos: "asc" as const };
      case "preco-desc": return { precoCentavos: "desc" as const };
      case "nome":       return { titulo: "asc" as const };
      default:           return { criadaEm: "desc" as const };
    }
  })();

  const rows = await prisma.peca.findMany({
    where: {
      status: "DISPONIVEL",
      ...(categoria ? { categoria: { slug: categoria } } : {}),
      ...(tamanho ? { tamanho } : {}),
      ...(q ? {
        OR: [
          { titulo: { contains: q, mode: "insensitive" } },
          { marca: { contains: q, mode: "insensitive" } },
          { descricao: { contains: q, mode: "insensitive" } },
        ],
      } : {}),
    },
    include: {
      fotos: { orderBy: { ordem: "asc" }, take: 1 },
      categoria: { select: { slug: true } },
    },
    orderBy,
    take: 96,
  });
  return rows as unknown as PecaCard[];
}

async function getCategorias() {
  return prisma.categoria.findMany({ orderBy: { nome: "asc" } });
}

async function getTamanhos(): Promise<string[]> {
  const result = await prisma.peca.findMany({
    where: { status: "DISPONIVEL", tamanho: { not: null } },
    select: { tamanho: true },
    distinct: ["tamanho"],
  });

  const tamOrder = ["PP", "P", "M", "G", "GG", "XGG"];
  return result
    .map((r) => r.tamanho!)
    .sort((a, b) => {
      const ia = tamOrder.indexOf(a);
      const ib = tamOrder.indexOf(b);
      if (ia !== -1 && ib !== -1) return ia - ib;
      if (ia !== -1) return -1;
      if (ib !== -1) return 1;
      return a.localeCompare(b, "pt-BR", { numeric: true });
    });
}

export default async function ProdutosPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const [pecas, categorias, tamanhos] = await Promise.all([
    getPecas(sp),
    getCategorias(),
    getTamanhos(),
  ]);

  const catalogItems = pecas.map((p) => ({
    id: p.id,
    titulo: p.titulo,
    slug: p.slug,
    precoCentavos: p.precoCentavos,
    fotoUrl: p.fotos[0]?.url ?? null,
    tamanho: p.tamanho,
    categoriaSlug: p.categoria?.slug ?? null,
  }));

  const categoriaAtiva = categorias.find((c) => c.slug === sp.categoria);

  return (
    <>
      <Header />

      <main className="flex-1 pt-14 sm:pt-16">
        {/* Topo da página */}
        <div className="border-b" style={{ borderColor: "#E5D5B5", background: "#F4ECD8" }}>
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
            <h1 className="font-display italic mb-1" style={{ fontSize: "clamp(2rem, 7vw, 3.5rem)", color: "#4A3728" }}>
              {categoriaAtiva ? categoriaAtiva.nome : "Catálogo"}
            </h1>
            <p className="text-sm" style={{ color: "#7A5C48" }}>
              Peças únicas selecionadas com curadoria
            </p>
          </div>
        </div>

        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-5 sm:py-8">
          {/* Filtros — client component envolto em Suspense */}
          <Suspense fallback={
            <div className="h-24 rounded-2xl animate-pulse" style={{ background: "#E5D5B5" }} />
          }>
            <ProductFilters
              categorias={categorias}
              tamanhos={tamanhos}
              total={catalogItems.length}
            />
          </Suspense>

          {/* Grade de produtos */}
          <div className="mt-6">
            {catalogItems.length > 0 ? (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-4 lg:gap-5">
                {catalogItems.map((peca, i) => (
                  <ProductCard key={peca.id} peca={peca} index={i} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 gap-4 text-center">
                <span style={{ fontSize: 52 }}>🌿</span>
                <h2 className="font-display italic text-2xl" style={{ color: "#7A5C48" }}>
                  Nenhuma peça encontrada
                </h2>
                <p className="text-sm max-w-xs" style={{ color: "#B8A898" }}>
                  Tente ajustar os filtros ou buscar por outro termo.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-16 py-8 px-5 text-center border-t" style={{ borderColor: "#E5D5B5" }}>
          <p className="font-display italic text-2xl mb-1" style={{ color: "#4A3728" }}>✦ Suspiro</p>
          <p className="text-xs" style={{ color: "#B8A898" }}>© {new Date().getFullYear()} Suspiro Brechó</p>
        </footer>
      </main>
    </>
  );
}
