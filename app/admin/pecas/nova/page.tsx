import { prisma } from "@/lib/prisma";
import { PecaForm } from "../../_components/peca-form";
import { criarPecaAction } from "../../actions";
import Link from "next/link";

export default async function NovaPecaPage() {
  const categorias = await prisma.categoria.findMany({ orderBy: { nome: "asc" } });

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/admin" className="text-2xl" aria-label="Voltar">←</Link>
        <div>
          <h1 className="font-display italic text-3xl" style={{ color: "#4A3728" }}>Nova peça</h1>
          <p className="text-sm" style={{ color: "#7A5C48" }}>Preencha os dados e adicione as fotos</p>
        </div>
      </div>

      <PecaForm categorias={categorias} action={criarPecaAction} />
    </div>
  );
}
