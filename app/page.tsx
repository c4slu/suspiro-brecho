import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { Header } from "@/components/header";
import { formatCentavos } from "@/lib/format";

async function getDestaques() {
  const rows = await prisma.peca.findMany({
    where: { status: "DISPONIVEL" },
    include: { fotos: { orderBy: { ordem: "asc" }, take: 1 } },
    orderBy: { criadaEm: "desc" },
    take: 4,
  });
  return rows as unknown as {
    id: string; titulo: string; slug: string; precoCentavos: number;
    tamanho: string | null; fotos: { url: string }[];
  }[];
}

export default async function Home() {
  const destaques = await getDestaques();

  const pilares = [
    {
      icon: "🔍",
      titulo: "Curadoria rigorosa",
      texto: "Garimpamos em brechós, feiras e acervos particulares. Cada peça passa pela nossa análise antes de chegar ao site.",
    },
    {
      icon: "✨",
      titulo: "Qualidade verificada",
      texto: "Inspecionamos tecido, costura e conservação. Você recebe o que realmente vale o investimento.",
    },
    {
      icon: "🌿",
      titulo: "Moda circular",
      texto: "Dar nova vida a uma peça é um ato político. Cada compra aqui é um passo a menos para o descarte.",
    },
  ];

  const processo = [
    { emoji: "🧺", titulo: "Garimpamos", texto: "Buscamos em brechós, feiras e coleções particulares" },
    { emoji: "🔎", titulo: "Selecionamos", texto: "Só passa o que tem qualidade e personalidade real" },
    { emoji: "📸", titulo: "Catalogamos", texto: "Fotografamos, medimos e descrevemos cada detalhe" },
    { emoji: "📦", titulo: "Enviamos", texto: "Embalado com cuidado, diretamente para você" },
  ];

  return (
    <>
      <Header />

      <main className="flex-1">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section
          className="relative flex flex-col items-center justify-center text-center overflow-hidden pt-14 sm:pt-16"
          style={{
            minHeight: "100svh",
            background: "linear-gradient(160deg, #F4ECD8 0%, #EDBBBC 50%, #B8D4B8 100%)",
          }}
        >
          {/* Blobs decorativos */}
          <div className="absolute top-0 left-0 rounded-full opacity-25 animate-float-slow pointer-events-none"
            style={{ width: "min(320px,70vw)", height: "min(320px,70vw)", background: "#D4888A", filter: "blur(70px)", transform: "translate(-40%,-30%)" }} />
          <div className="absolute bottom-0 right-0 rounded-full opacity-25 animate-float-gentle pointer-events-none"
            style={{ width: "min(400px,85vw)", height: "min(400px,85vw)", background: "#7A9E7E", filter: "blur(90px)", transform: "translate(35%,30%)" }} />

          {/* Conteúdo */}
          <div className="relative z-10 px-5 max-w-2xl mx-auto">
            <div className="mb-5 sm:mb-6 animate-float-gentle">
              <span className="block text-6xl sm:text-8xl animate-pulse-glow"
                style={{ filter: "drop-shadow(0 0 20px rgba(196,151,63,0.45))" }}>
                🪩
              </span>
            </div>

            <h1
              className="font-display italic leading-none tracking-tight mb-3"
              style={{ fontSize: "clamp(3.8rem, 15vw, 9rem)", color: "#4A3728" }}
            >
              Suspiro
            </h1>

            <p className="font-display italic mb-3" style={{ fontSize: "clamp(1rem, 3.5vw, 1.4rem)", color: "#7A5C48" }}>
              Onde roupas ganham nova vida ✦
            </p>

            <p className="text-sm sm:text-base max-w-sm mx-auto mb-8 leading-relaxed" style={{ color: "#7A5C48" }}>
              Peças únicas garimpadas com cuidado e curadoria. Para quem sabe que moda vai além do óbvio.
            </p>

            <Link href="/produtos" className="btn-primary" style={{ fontSize: "0.95rem", padding: "0.85rem 2.2rem" }}>
              Explorar o catálogo
            </Link>
          </div>

          {/* Scroll hint */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 animate-float-gentle"
            style={{ color: "#7A5C48" }}>
            <span className="text-xs tracking-widest uppercase" style={{ fontSize: "0.65rem" }}>descer</span>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M12 5v14M5 12l7 7 7-7" />
            </svg>
          </div>
        </section>

        {/* ── História ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 px-5 max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 md:gap-16 items-center">
            {/* Texto */}
            <div>
              <span className="text-xs tracking-widest uppercase font-semibold mb-3 block" style={{ color: "#7A9E7E" }}>
                A história por trás da sacola
              </span>
              <h2 className="font-display italic leading-tight mb-5" style={{ fontSize: "clamp(2rem, 7vw, 3rem)", color: "#4A3728" }}>
                Cada peça é uma escolha, não um acaso.
              </h2>
              <p className="leading-relaxed mb-4" style={{ color: "#7A5C48", fontSize: "0.97rem" }}>
                O Suspiro nasceu do amor por peças com história. Por acreditar que uma jaqueta de brechó pode ser mais especial que qualquer lançamento de coleção.
              </p>
              <p className="leading-relaxed" style={{ color: "#7A5C48", fontSize: "0.97rem" }}>
                Aqui, cada peça é escolhida com olho clínico e muito carinho — só entra o que tem potencial real de fazer alguém se sentir único. Nada passa pela curadoria sem ter personalidade, qualidade ou história.
              </p>
            </div>

            {/* Visual */}
            <div className="relative">
              <div
                className="rounded-3xl overflow-hidden aspect-[4/5]"
                style={{ background: "linear-gradient(135deg, #F2C4C5, #B8D4B8)", position: "relative" }}
              >
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-8 text-center">
                  <span style={{ fontSize: 64 }}>🪩</span>
                  <p className="font-display italic text-2xl sm:text-3xl" style={{ color: "#4A3728" }}>
                    "Segunda mão,<br />primeiro amor."
                  </p>
                  <div className="w-12 h-px" style={{ background: "#4A3728" }} />
                  <p className="text-xs tracking-widest uppercase" style={{ color: "#7A5C48" }}>
                    Suspiro Brechó
                  </p>
                </div>
              </div>
              {/* Floating badge */}
              <div
                className="absolute -bottom-4 -right-4 sm:-bottom-5 sm:-right-5 rounded-2xl px-4 py-3 shadow-lg"
                style={{ background: "#D4888A", color: "#fff" }}
              >
                <p className="text-xs font-semibold">Peças únicas</p>
                <p className="font-display italic text-xl">com alma</p>
              </div>
            </div>
          </div>
        </section>

        {/* ── Pilares ──────────────────────────────────────────────────── */}
        <section className="py-12 sm:py-20 px-5" style={{ background: "#EDE0C8" }}>
          <div className="max-w-5xl mx-auto">
            <p className="text-xs tracking-widest uppercase font-semibold text-center mb-3" style={{ color: "#7A9E7E" }}>
              O que nos guia
            </p>
            <h2 className="font-display italic text-center mb-10 sm:mb-14" style={{ fontSize: "clamp(2rem, 6vw, 2.8rem)", color: "#4A3728" }}>
              Nossa promessa para você
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
              {pilares.map((p) => (
                <div
                  key={p.titulo}
                  className="rounded-3xl p-6 sm:p-8 flex flex-col gap-3"
                  style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}
                >
                  <span style={{ fontSize: 36 }}>{p.icon}</span>
                  <h3 className="font-display italic text-xl" style={{ color: "#4A3728" }}>{p.titulo}</h3>
                  <p className="text-sm leading-relaxed" style={{ color: "#7A5C48" }}>{p.texto}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Processo ─────────────────────────────────────────────────── */}
        <section className="py-16 sm:py-24 px-5 max-w-5xl mx-auto">
          <p className="text-xs tracking-widest uppercase font-semibold text-center mb-3" style={{ color: "#7A9E7E" }}>
            Do garimpo à sua porta
          </p>
          <h2 className="font-display italic text-center mb-10 sm:mb-16" style={{ fontSize: "clamp(2rem, 6vw, 2.8rem)", color: "#4A3728" }}>
            Como chega até você
          </h2>

          {/* Steps — horizontal scroll no mobile, grid no desktop */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {processo.map((step, i) => (
              <div key={step.titulo} className="relative flex flex-col items-center text-center gap-3">
                {/* Conector — só no desktop */}
                {i < processo.length - 1 && (
                  <div className="hidden sm:block absolute top-7 left-[calc(50%+2.5rem)] right-[calc(-50%+2.5rem)] h-px"
                    style={{ background: "linear-gradient(to right, #D4888A, #B8D4B8)" }} />
                )}
                <div
                  className="w-14 h-14 rounded-full flex items-center justify-center text-2xl shrink-0 relative z-10"
                  style={{ background: "#fff9f2", border: "2px solid #E5D5B5" }}
                >
                  {step.emoji}
                </div>
                <div>
                  <div className="text-xs font-bold mb-1" style={{ color: "#D4888A" }}>0{i + 1}</div>
                  <p className="font-semibold text-sm mb-1" style={{ color: "#4A3728" }}>{step.titulo}</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#B8A898" }}>{step.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── Sustentabilidade ─────────────────────────────────────────── */}
        <section
          className="py-14 sm:py-20 px-5"
          style={{ background: "linear-gradient(135deg, #4A6B50 0%, #4A3728 100%)" }}
        >
          <div className="max-w-4xl mx-auto text-center">
            <span className="text-3xl sm:text-4xl mb-6 block">♻️</span>
            <h2 className="font-display italic mb-5" style={{ fontSize: "clamp(1.8rem, 6vw, 3rem)", color: "#F4ECD8" }}>
              Moda circular na prática
            </h2>
            <p className="text-sm sm:text-base leading-relaxed mb-10 max-w-2xl mx-auto" style={{ color: "#B8D4B8" }}>
              A indústria da moda é responsável por cerca de 10% das emissões globais de CO₂. Cada peça reutilizada
              poupa em média 2.700 litros de água e evita quilos de resíduos têxteis. Comprar no Suspiro é
              uma escolha de estilo — e de consciência.
            </p>

            <div className="grid grid-cols-3 gap-4 sm:gap-8 max-w-md mx-auto">
              {[
                { numero: "2.700L", label: "água poupada por peça" },
                { numero: "10%", label: "das emissões de CO₂" },
                { numero: "100%", label: "peças únicas" },
              ].map(({ numero, label }) => (
                <div key={label} className="text-center">
                  <p className="font-display italic" style={{ fontSize: "clamp(1.5rem, 5vw, 2.5rem)", color: "#D4888A" }}>{numero}</p>
                  <p className="text-xs mt-1 leading-snug" style={{ color: "#B8D4B8" }}>{label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Em destaque ──────────────────────────────────────────────── */}
        {destaques.length > 0 && (
          <section className="py-14 sm:py-20 px-5 max-w-6xl mx-auto">
            <div className="flex items-end justify-between mb-8 gap-4">
              <div>
                <p className="text-xs tracking-widest uppercase font-semibold mb-1" style={{ color: "#7A9E7E" }}>
                  Recém chegadas
                </p>
                <h2 className="font-display italic" style={{ fontSize: "clamp(2rem, 7vw, 3rem)", color: "#4A3728" }}>
                  Em destaque
                </h2>
              </div>
              <Link
                href="/produtos"
                className="text-sm font-semibold whitespace-nowrap shrink-0 flex items-center gap-1 transition-opacity hover:opacity-70"
                style={{ color: "#D4888A" }}
              >
                Ver tudo <span>→</span>
              </Link>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-5">
              {destaques.map((p) => (
                <Link
                  key={p.id}
                  href={`/peca/${p.slug}`}
                  className="product-card block group"
                >
                  <div className="relative aspect-[3/4] overflow-hidden" style={{ background: "#EDE0C8" }}>
                    {p.fotos[0]?.url ? (
                      <Image
                        src={p.fotos[0].url}
                        alt={p.titulo}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                        sizes="(max-width: 640px) 50vw, 25vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-4xl">👗</div>
                    )}
                    {p.tamanho && (
                      <span
                        className="absolute top-2 left-2 text-xs font-bold px-2 py-0.5 rounded-full"
                        style={{ background: "rgba(244,236,216,0.92)", color: "#4A3728", backdropFilter: "blur(4px)" }}
                      >
                        {p.tamanho}
                      </span>
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs font-semibold line-clamp-2 mb-2 leading-snug" style={{ color: "#4A3728" }}>
                      {p.titulo}
                    </p>
                    <span className="price-tag text-xs">{formatCentavos(p.precoCentavos)}</span>
                  </div>
                </Link>
              ))}
            </div>

            <div className="mt-10 text-center">
              <Link href="/produtos" className="btn-primary">
                Explorar o catálogo completo
              </Link>
            </div>
          </section>
        )}

        {/* ── Footer ───────────────────────────────────────────────────── */}
        <footer className="py-10 px-5 text-center border-t" style={{ borderColor: "#E5D5B5" }}>
          <p className="font-display italic text-2xl sm:text-3xl mb-2" style={{ color: "#4A3728" }}>✦ Suspiro</p>
          <p className="text-sm" style={{ color: "#7A5C48" }}>Brechó curado com amor · peças únicas com história</p>
          <p className="text-xs mt-4" style={{ color: "#B8A898" }}>© {new Date().getFullYear()} Suspiro Brechó</p>
        </footer>

      </main>
    </>
  );
}
