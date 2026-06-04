import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Header } from "@/components/header";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { PhotoGallery } from "@/components/photo-gallery";
import { formatCentavos } from "@/lib/format";

type Props = { params: Promise<{ slug: string }> };

export default async function PecaPage({ params }: Props) {
  const { slug } = await params;

  type PecaCompleta = {
    id: string; titulo: string; slug: string; precoCentavos: number;
    tamanho: string | null; marca: string | null; cor: string | null;
    estado: "NOVO_COM_ETIQUETA" | "SEMINOVO" | "USADO";
    descricao: string | null; medidas: string | null;
    status: "DISPONIVEL" | "RESERVADO" | "VENDIDO";
    fotos: { id: string; url: string; ordem: number }[];
    categoria: { id: string; nome: string; slug: string } | null;
  };

  const raw = await prisma.peca.findUnique({
    where: { slug },
    include: { fotos: { orderBy: { ordem: "asc" } }, categoria: true },
  });
  const peca = raw as unknown as PecaCompleta | null;

  if (!peca || peca.status === "VENDIDO") notFound();

  const reservada = peca.status === "RESERVADO";
  const fotoCapaUrl = peca.fotos[0]?.url ?? null;
  const fotos = peca.fotos.map((f) => ({ id: f.id, url: f.url }));

  const estadoLabel: Record<string, string> = {
    NOVO_COM_ETIQUETA: "Novo com etiqueta",
    SEMINOVO: "Seminovo",
    USADO: "Usado",
  };

  return (
    <>
      <Header />

      <main className="pt-16 min-h-screen">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-12">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm mb-8" style={{ color: "#B8A898" }}>
            <Link href="/produtos" className="hover:text-rosa transition-colors">Produtos</Link>
            <span>/</span>
            {peca.categoria && (
              <>
                <Link href={`/produtos?categoria=${peca.categoria.slug}`} className="hover:text-rosa transition-colors">
                  {peca.categoria.nome}
                </Link>
                <span>/</span>
              </>
            )}
            <span className="truncate max-w-[200px]" style={{ color: "#4A3728" }}>{peca.titulo}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-14">
            {/* Galeria interativa */}
            <PhotoGallery fotos={fotos} alt={peca.titulo} reservada={reservada} />

            {/* Info */}
            <div className="flex flex-col gap-6">
              {/* Categoria */}
              {peca.categoria && (
                <span
                  className="text-xs font-semibold tracking-widest uppercase"
                  style={{ color: "#7A9E7E" }}
                >
                  {peca.categoria.nome}
                </span>
              )}

              {/* Título */}
              <h1
                className="font-display italic leading-tight"
                style={{ fontSize: "clamp(2rem, 5vw, 3rem)", color: "#4A3728" }}
              >
                {peca.titulo}
              </h1>

              {/* Preço */}
              <div className="flex items-center gap-3">
                <span className="price-tag text-xl px-5 py-2">
                  {formatCentavos(peca.precoCentavos)}
                </span>
              </div>

              {/* Atributos */}
              <div className="flex flex-wrap gap-2">
                {peca.tamanho && (
                  <span
                    className="text-sm px-4 py-1.5 rounded-full font-medium"
                    style={{ background: "#E5D5B5", color: "#4A3728" }}
                  >
                    Tamanho: {peca.tamanho}
                  </span>
                )}
                {peca.marca && (
                  <span
                    className="text-sm px-4 py-1.5 rounded-full font-medium"
                    style={{ background: "#E5D5B5", color: "#4A3728" }}
                  >
                    {peca.marca}
                  </span>
                )}
                <span
                  className="text-sm px-4 py-1.5 rounded-full font-medium"
                  style={{ background: "#B8D4B8", color: "#4A6B50" }}
                >
                  {estadoLabel[peca.estado]}
                </span>
              </div>

              {/* Descrição */}
              {peca.descricao && (
                <p className="text-base leading-relaxed" style={{ color: "#7A5C48" }}>
                  {peca.descricao}
                </p>
              )}

              {/* Medidas */}
              {peca.medidas && (
                <div className="p-4 rounded-2xl" style={{ background: "#EDE0C8" }}>
                  <p className="text-xs font-semibold tracking-widest uppercase mb-1" style={{ color: "#7A5C48" }}>
                    Medidas
                  </p>
                  <p className="text-sm" style={{ color: "#4A3728" }}>{peca.medidas}</p>
                </div>
              )}

              {/* CTA */}
              {reservada ? (
                <div className="p-4 rounded-2xl text-center" style={{ background: "#FBF3F3", border: "1px solid #F2C4C5" }}>
                  <p className="font-semibold" style={{ color: "#C97B7B" }}>Esta peça está reservada no momento</p>
                  <p className="text-sm mt-1" style={{ color: "#D4888A" }}>Se a reserva expirar, ela volta ao catálogo</p>
                </div>
              ) : (
                <AddToCartButton
                  item={{
                    id: peca.id,
                    titulo: peca.titulo,
                    slug: peca.slug,
                    precoCentavos: peca.precoCentavos,
                    fotoUrl: fotoCapaUrl,
                    tamanho: peca.tamanho,
                  }}
                />
              )}

              {/* Trust */}
              <div className="flex flex-wrap gap-4 pt-2">
                {[
                  { icon: "♻️", text: "Peça única" },
                  { icon: "🔒", text: "Pagamento seguro" },
                  { icon: "📦", text: "Envio para todo Brasil" },
                ].map(({ icon, text }) => (
                  <div key={text} className="flex items-center gap-1.5 text-sm" style={{ color: "#7A5C48" }}>
                    <span>{icon}</span>
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
