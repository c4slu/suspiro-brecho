import { prisma } from "@/lib/prisma";
import Image from "next/image";
import Link from "next/link";
import { formatCentavos } from "@/lib/format";
import { criarCategoriaAction } from "./actions";
import { PecaActions } from "./_components/peca-actions";

async function getPecas() {
  const rows = await prisma.peca.findMany({
    include: {
      fotos: { orderBy: { ordem: "asc" }, take: 1 },
      categoria: { select: { nome: true } },
      _count: { select: { itensPedido: true } },
    },
    orderBy: { criadaEm: "desc" },
  });
  return rows as unknown as Array<{
    id: string; titulo: string; slug: string; precoCentavos: number;
    status: "DISPONIVEL" | "RESERVADO" | "VENDIDO"; tamanho: string | null;
    marca: string | null; criadaEm: Date;
    fotos: { url: string }[];
    categoria: { nome: string } | null;
    _count: { itensPedido: number };
  }>;
}

const STATUS_STYLE = {
  DISPONIVEL: { label: "Disponível", bg: "#EDF5EE", color: "#4A6B50" },
  RESERVADO:  { label: "Reservada",  bg: "#FBF6EE", color: "#C4973F" },
  VENDIDO:    { label: "Vendida",    bg: "#FBF3F3", color: "#C97B7B" },
};

export default async function AdminPage() {
  const pecas = await getPecas();

  const stats = {
    disponivel: pecas.filter((p) => p.status === "DISPONIVEL").length,
    reservado:  pecas.filter((p) => p.status === "RESERVADO").length,
    vendido:    pecas.filter((p) => p.status === "VENDIDO").length,
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="font-display italic text-3xl sm:text-4xl" style={{ color: "#4A3728" }}>
            Catálogo
          </h1>
          <p className="text-sm mt-0.5" style={{ color: "#7A5C48" }}>
            {pecas.length} peças no total
          </p>
        </div>
        <Link href="/admin/pecas/nova" className="btn-primary shrink-0">
          + Nova peça
        </Link>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-8">
        {[
          { label: "Disponíveis", value: stats.disponivel, color: "#4A6B50", bg: "#EDF5EE" },
          { label: "Reservadas",  value: stats.reservado,  color: "#C4973F", bg: "#FBF6EE" },
          { label: "Vendidas",    value: stats.vendido,    color: "#C97B7B", bg: "#FBF3F3" },
        ].map(({ label, value, color, bg }) => (
          <div key={label} className="p-4 rounded-2xl text-center" style={{ background: bg }}>
            <p className="text-2xl font-bold" style={{ color }}>{value}</p>
            <p className="text-xs mt-0.5" style={{ color }}>{label}</p>
          </div>
        ))}
      </div>

      {/* Lista de peças */}
      {pecas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">👗</p>
          <p className="font-display italic text-2xl mb-2" style={{ color: "#4A3728" }}>
            Nenhuma peça ainda
          </p>
          <Link href="/admin/pecas/nova" className="btn-primary mt-4 inline-block">
            Adicionar primeira peça
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {pecas.map((peca) => {
            const s = STATUS_STYLE[peca.status];
            return (
              <div key={peca.id}
                className="flex gap-4 p-4 rounded-2xl items-center"
                style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
                {/* Foto */}
                <div className="relative shrink-0 rounded-xl overflow-hidden"
                  style={{ width: 60, height: 75, background: "#EDE0C8" }}>
                  {peca.fotos[0]?.url ? (
                    <Image src={peca.fotos[0].url} alt={peca.titulo} fill className="object-cover" sizes="60px" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-xl">👗</div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm truncate" style={{ color: "#4A3728" }}>{peca.titulo}</p>
                  <div className="flex flex-wrap gap-2 mt-1 items-center">
                    <span className="text-sm font-bold" style={{ color: "#D4888A" }}>
                      {formatCentavos(peca.precoCentavos)}
                    </span>
                    {peca.tamanho && (
                      <span className="text-xs px-2 py-0.5 rounded-full"
                        style={{ background: "#E5D5B5", color: "#4A3728" }}>{peca.tamanho}</span>
                    )}
                    {peca.categoria && (
                      <span className="text-xs" style={{ color: "#B8A898" }}>{peca.categoria.nome}</span>
                    )}
                  </div>
                  <span className="text-xs px-2 py-0.5 rounded-full font-medium mt-1.5 inline-block"
                    style={{ background: s.bg, color: s.color }}>{s.label}</span>
                </div>

                {/* Ações */}
                <div className="flex gap-2 shrink-0 items-center">
                  <Link href={`/admin/pecas/${peca.id}/editar`}
                    className="text-xs px-3 py-1.5 rounded-full font-medium transition-all hover:opacity-80 whitespace-nowrap"
                    style={{ background: "#E5D5B5", color: "#4A3728" }}>
                    ✏️ Editar
                  </Link>
                  <PecaActions id={peca.id} titulo={peca.titulo} status={peca.status} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Gerenciar categorias */}
      <section className="mt-10 p-5 rounded-2xl" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
        <h2 className="font-display italic text-xl mb-4" style={{ color: "#4A3728" }}>
          Categorias
        </h2>
        <form action={criarCategoriaAction} className="flex gap-2">
          <input name="nome" required placeholder="Nome da nova categoria (ex: Acessórios)"
            className="input-base flex-1" />
          <button type="submit" className="btn-secondary shrink-0 text-sm">Adicionar</button>
        </form>
      </section>
    </div>
  );
}
