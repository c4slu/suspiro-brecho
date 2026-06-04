import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { PecaForm } from "../../../_components/peca-form";
import { editarPecaAction } from "../../../actions";

type Props = { params: Promise<{ id: string }> };

export default async function EditarPecaPage({ params }: Props) {
  const { id } = await params;

  const [raw, categorias] = await Promise.all([
    prisma.peca.findUnique({
      where: { id },
      include: { fotos: { orderBy: { ordem: "asc" } } },
    }),
    prisma.categoria.findMany({ orderBy: { nome: "asc" } }),
  ]);

  if (!raw) notFound();

  const peca = raw as unknown as {
    id: string; titulo: string; descricao: string | null; precoCentavos: number;
    tamanho: string | null; marca: string | null; cor: string | null; estado: string;
    medidas: string | null; categoriaId: string | null;
    fotos: { id: string; url: string; ordem: number }[];
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-2xl" aria-label="Voltar">←</Link>
        <div>
          <h1 className="font-display italic text-3xl" style={{ color: "#4A3728" }}>Editar peça</h1>
          <p className="text-sm truncate max-w-xs" style={{ color: "#7A5C48" }}>{peca.titulo}</p>
        </div>
      </div>

      <PecaForm categorias={categorias} peca={peca} action={editarPecaAction} />
    </div>
  );
}
