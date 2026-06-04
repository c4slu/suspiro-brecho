import { prisma } from "@/lib/prisma";
import { formatCentavos } from "@/lib/format";
import { VendaActions, ConfirmarPagamentoButton } from "./_components/venda-actions";
import Image from "next/image";

async function getPedidosPendentes() {
  const rows = await prisma.pedido.findMany({
    where: { status: "PENDENTE" },
    include: {
      itens: { include: { peca: { select: { titulo: true } } } },
    },
    orderBy: { criadoEm: "desc" },
    take: 20,
  });
  return rows as unknown as Array<{
    id: string; clienteNome: string; clienteEmail: string;
    totalCentavos: number; criadoEm: Date;
    itens: Array<{ peca: { titulo: string } }>;
  }>;
}

type StatusFiltro = "todas" | "PAGO" | "ENTREGUE";

async function getVendas(filtro: StatusFiltro) {
  const where =
    filtro === "todas"
      ? { status: { in: ["PAGO", "ENTREGUE"] as ("PAGO" | "ENTREGUE")[] } }
      : { status: filtro as "PAGO" | "ENTREGUE" };

  const rows = await prisma.pedido.findMany({
    where,
    include: {
      itens: {
        include: {
          peca: {
            include: { fotos: { take: 1, orderBy: { ordem: "asc" } } },
          },
        },
      },
    },
    orderBy: { criadoEm: "desc" },
  });

  return rows as unknown as Array<{
    id: string;
    clienteNome: string;
    clienteEmail: string;
    clienteTelefone: string | null;
    enderecoLinha: string | null;
    enderecoCidade: string | null;
    enderecoUf: string | null;
    enderecoCep: string | null;
    totalCentavos: number;
    status: "PAGO" | "ENTREGUE";
    criadoEm: Date;
    mpPaymentId: string | null;
    itens: Array<{
      id: string;
      precoCentavos: number;
      peca: {
        titulo: string;
        tamanho: string | null;
        fotos: { url: string }[];
      };
    }>;
  }>;
}

async function getStats() {
  const [pago, entregue] = await Promise.all([
    prisma.pedido.aggregate({
      where: { status: "PAGO" },
      _count: true,
      _sum: { totalCentavos: true },
    }),
    prisma.pedido.aggregate({
      where: { status: "ENTREGUE" },
      _count: true,
      _sum: { totalCentavos: true },
    }),
  ]);

  return { pago, entregue };
}

type Props = { searchParams: Promise<{ filtro?: string }> };

const STATUS_LABEL = {
  PAGO:     { label: "Aguardando entrega", bg: "#FBF6EE", color: "#C4973F" },
  ENTREGUE: { label: "Entregue",           bg: "#EDF5EE", color: "#4A6B50" },
};

export default async function VendasPage({ searchParams }: Props) {
  const sp = await searchParams;
  const filtro = (sp.filtro ?? "todas") as StatusFiltro;
  const [vendas, stats, pendentes] = await Promise.all([getVendas(filtro), getStats(), getPedidosPendentes()]);

  const totalArrecadado =
    (stats.pago._sum.totalCentavos ?? 0) + (stats.entregue._sum.totalCentavos ?? 0);
  const totalVendas = stats.pago._count + stats.entregue._count;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="font-display italic text-3xl sm:text-4xl mb-1" style={{ color: "#4A3728" }}>
          Vendas
        </h1>
        <p className="text-sm" style={{ color: "#7A5C48" }}>Histórico de pedidos e entregas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-8">
        <StatCard label="Total arrecadado" value={formatCentavos(totalArrecadado)} large />
        <StatCard label="Vendas realizadas" value={String(totalVendas)} />
        <StatCard label="Aguard. entrega" value={String(stats.pago._count)} color="#C4973F" bg="#FBF6EE" />
        <StatCard label="Entregues" value={String(stats.entregue._count)} color="#4A6B50" bg="#EDF5EE" />
      </div>

      {/* Filtros */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {[
          { v: "todas",    label: "Todas" },
          { v: "PAGO",     label: "Aguardando entrega" },
          { v: "ENTREGUE", label: "Entregues" },
        ].map(({ v, label }) => (
          <a key={v} href={`/admin/vendas?filtro=${v}`}
            className="text-sm px-4 py-1.5 rounded-full font-medium transition-all"
            style={filtro === v
              ? { background: "#4A3728", color: "#F4ECD8" }
              : { background: "#E5D5B5", color: "#4A3728" }}>
            {label}
          </a>
        ))}
      </div>

      {/* Pedidos pendentes (webhook não chegou) */}
      {pendentes.length > 0 && (
        <div className="p-5 rounded-2xl mb-4" style={{ background: "#FBF6EE", border: "1px solid #E8D5A3" }}>
          <p className="font-semibold text-sm mb-3 flex items-center gap-2" style={{ color: "#C4973F" }}>
            ⚠ {pendentes.length} {pendentes.length === 1 ? "pedido pendente" : "pedidos pendentes"} — webhook não chegou
          </p>
          <div className="space-y-2">
            {pendentes.map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-3 flex-wrap">
                <div>
                  <span className="text-xs font-mono" style={{ color: "#7A5C48" }}>#{p.id.slice(-8).toUpperCase()}</span>
                  <span className="text-xs ml-2" style={{ color: "#4A3728" }}>{p.clienteNome} · {formatCentavos(p.totalCentavos)}</span>
                </div>
                <ConfirmarPagamentoButton pedidoId={p.id} />
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Lista de vendas */}
      {vendas.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-5xl mb-4">📊</p>
          <p className="font-display italic text-2xl" style={{ color: "#4A3728" }}>
            Nenhuma venda ainda
          </p>
          <p className="text-sm mt-2" style={{ color: "#B8A898" }}>
            As vendas confirmadas pelo Mercado Pago aparecem aqui
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {vendas.map((venda) => {
            const s = STATUS_LABEL[venda.status];
            const data = new Date(venda.criadoEm).toLocaleDateString("pt-BR", {
              day: "2-digit", month: "short", year: "numeric",
            });
            const hora = new Date(venda.criadoEm).toLocaleTimeString("pt-BR", {
              hour: "2-digit", minute: "2-digit",
            });

            return (
              <div key={venda.id}
                className="rounded-2xl overflow-hidden"
                style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
                {/* Cabeçalho da venda */}
                <div className="flex flex-wrap gap-3 items-start justify-between p-4 pb-3 border-b"
                  style={{ borderColor: "#F4ECD8" }}>
                  <div>
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-mono text-xs px-2 py-0.5 rounded"
                        style={{ background: "#EDE0C8", color: "#7A5C48" }}>
                        #{venda.id.slice(-8).toUpperCase()}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                        style={{ background: s.bg, color: s.color }}>
                        {s.label}
                      </span>
                    </div>
                    <p className="text-xs" style={{ color: "#B8A898" }}>{data} às {hora}</p>
                  </div>
                  <p className="font-display italic text-xl" style={{ color: "#D4888A" }}>
                    {formatCentavos(venda.totalCentavos)}
                  </p>
                </div>

                <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Cliente */}
                  <div>
                    <p className="text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: "#B8A898" }}>
                      Cliente
                    </p>
                    <p className="font-semibold text-sm" style={{ color: "#4A3728" }}>{venda.clienteNome}</p>
                    <p className="text-sm" style={{ color: "#7A5C48" }}>{venda.clienteEmail}</p>
                    {venda.clienteTelefone && (
                      <p className="text-sm" style={{ color: "#7A5C48" }}>{venda.clienteTelefone}</p>
                    )}

                    {/* Endereço de entrega */}
                    {venda.enderecoLinha && (
                      <div className="mt-3 p-3 rounded-xl" style={{ background: "#F4ECD8" }}>
                        <p className="text-xs font-semibold mb-1" style={{ color: "#B8A898" }}>📦 Entrega</p>
                        <p className="text-xs leading-relaxed" style={{ color: "#4A3728" }}>
                          {venda.enderecoLinha}<br />
                          {venda.enderecoCidade}{venda.enderecoUf ? ` — ${venda.enderecoUf}` : ""}
                          {venda.enderecoCep ? ` · CEP ${venda.enderecoCep}` : ""}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Peças compradas */}
                  <div>
                    <p className="text-xs font-semibold mb-2 tracking-wide uppercase" style={{ color: "#B8A898" }}>
                      Peças
                    </p>
                    <div className="space-y-2">
                      {venda.itens.map((item) => (
                        <div key={item.id} className="flex gap-3 items-center">
                          <div className="relative shrink-0 rounded-lg overflow-hidden"
                            style={{ width: 44, height: 56, background: "#EDE0C8" }}>
                            {item.peca.fotos[0]?.url ? (
                              <Image src={item.peca.fotos[0].url} alt={item.peca.titulo}
                                fill className="object-cover" sizes="44px" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-lg">👗</div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-medium leading-snug" style={{ color: "#4A3728" }}>
                              {item.peca.titulo}
                            </p>
                            <div className="flex gap-2 mt-0.5">
                              {item.peca.tamanho && (
                                <span className="text-xs" style={{ color: "#B8A898" }}>
                                  {item.peca.tamanho}
                                </span>
                              )}
                              <span className="text-xs font-medium" style={{ color: "#D4888A" }}>
                                {formatCentavos(item.precoCentavos)}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Ações */}
                <div className="px-4 pb-4">
                  <VendaActions
                    pedidoId={venda.id}
                    status={venda.status}
                    email={venda.clienteEmail}
                  />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function StatCard({
  label, value, large, color, bg,
}: {
  label: string; value: string; large?: boolean;
  color?: string; bg?: string;
}) {
  return (
    <div className="p-4 rounded-2xl" style={{ background: bg ?? "#fff9f2", border: "1px solid #E5D5B5" }}>
      <p className={large ? "text-xl sm:text-2xl font-bold" : "text-2xl font-bold"}
        style={{ color: color ?? "#4A3728" }}>
        {value}
      </p>
      <p className="text-xs mt-1" style={{ color: color ?? "#B8A898" }}>{label}</p>
    </div>
  );
}
