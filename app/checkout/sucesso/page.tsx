import { prisma } from "@/lib/prisma";
import Link from "next/link";
import Image from "next/image";
import { formatCentavos } from "@/lib/format";
import { enviarEmailConfirmacao } from "@/lib/email";

type SearchParams = Promise<{
  collection_status?: string;
  status?: string;
  external_reference?: string;
  payment_id?: string;
}>;

type PedidoDetalhe = {
  id: string;
  clienteNome: string;
  clienteEmail: string;
  clienteTelefone: string | null;
  enderecoCep: string | null;
  enderecoLinha: string | null;
  enderecoCidade: string | null;
  enderecoUf: string | null;
  totalCentavos: number;
  itens: {
    id: string;
    precoCentavos: number;
    peca: {
      titulo: string;
      slug: string;
      tamanho: string | null;
      marca: string | null;
      fotos: { url: string }[];
    };
  }[];
};

async function getPedido(id: string): Promise<PedidoDetalhe | null> {
  try {
    const raw = await prisma.pedido.findUnique({
      where: { id },
      include: {
        itens: {
          include: {
            peca: {
              include: { fotos: { take: 1, orderBy: { ordem: "asc" } } },
            },
          },
        },
      },
    });
    return raw as unknown as PedidoDetalhe | null;
  } catch {
    return null;
  }
}

export default async function SucessoPage({ searchParams }: { searchParams: SearchParams }) {
  const sp = await searchParams;
  const status = sp.collection_status ?? sp.status ?? "approved";
  const isPending = status === "pending" || status === "in_process";
  const pedidoId = sp.external_reference;

  const pedido = pedidoId ? await getPedido(pedidoId) : null;
  const temEndereco = pedido?.enderecoLinha && pedido?.enderecoCidade;

  // Fallback: se MP aprovou mas webhook ainda não chegou (pedido ainda PENDENTE),
  // atualiza o pedido e dispara o e-mail. Peças ficam para o webhook corrigir;
  // se webhook nunca vier, admin usa "Confirmar pagamento" no /admin/vendas.
  const pedidoStatus = (pedido as unknown as { status: string } | null)?.status;
  if (!isPending && pedido && pedidoStatus === "PENDENTE") {
    try {
      await prisma.pedido.update({
        where: { id: pedido.id },
        data: {
          status: "PAGO",
          mpPaymentId: sp.payment_id ? `mp-${sp.payment_id}` : `redirect-${pedido.id}`,
        },
      });
      enviarEmailConfirmacao({
        id: pedido.id,
        clienteNome: pedido.clienteNome,
        clienteEmail: pedido.clienteEmail,
        totalCentavos: pedido.totalCentavos,
        enderecoLinha: pedido.enderecoLinha,
        enderecoCidade: pedido.enderecoCidade,
        enderecoUf: pedido.enderecoUf,
        enderecoCep: pedido.enderecoCep,
        itens: pedido.itens.map((i) => ({
          titulo: i.peca.titulo,
          precoCentavos: i.precoCentavos,
          tamanho: i.peca.tamanho,
        })),
      }).catch(() => {});
    } catch {
      // mpPaymentId com unique constraint: webhook chegou primeiro — sem ação
    }
  }

  return (
    <main className="min-h-screen py-12 px-4" style={{ background: "#F4ECD8" }}>
      <div className="max-w-lg mx-auto space-y-5">

        {/* Card principal */}
        <div className="p-7 sm:p-10 rounded-3xl text-center animate-scale-in"
          style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
          <div className="text-5xl sm:text-6xl mb-5 inline-block animate-float-gentle">
            {isPending ? "⏳" : "🪩"}
          </div>

          <h1 className="font-display italic mb-2"
            style={{ fontSize: "clamp(1.8rem, 7vw, 2.6rem)", color: "#4A3728" }}>
            {isPending ? "Pagamento pendente" : "Pedido confirmado!"}
          </h1>

          <p className="text-sm leading-relaxed" style={{ color: "#7A5C48" }}>
            {isPending
              ? "Seu pedido foi registrado e aguarda confirmação. Para boleto ou Pix, pode levar alguns minutos."
              : "Recebemos seu pedido e o pagamento foi aprovado. Em breve entraremos em contato!"}
          </p>

          {pedidoId && (
            <p className="mt-3 text-xs font-mono px-3 py-1.5 rounded-xl inline-block"
              style={{ background: "#EDE0C8", color: "#7A5C48" }}>
              Pedido #{pedidoId.slice(-8).toUpperCase()}
            </p>
          )}
        </div>

        {/* Itens comprados */}
        {pedido && pedido.itens.length > 0 && (
          <div className="rounded-3xl overflow-hidden"
            style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
            <p className="font-display italic text-xl px-6 pt-5 pb-3" style={{ color: "#4A3728" }}>
              O que você levou
            </p>

            <div className="divide-y" style={{ borderColor: "#E5D5B5" }}>
              {pedido.itens.map((item) => (
                <div key={item.id} className="flex gap-4 px-6 py-4 items-center">
                  <div className="relative shrink-0 rounded-xl overflow-hidden"
                    style={{ width: 56, height: 72, background: "#EDE0C8" }}>
                    {item.peca.fotos[0]?.url ? (
                      <Image src={item.peca.fotos[0].url} alt={item.peca.titulo}
                        fill className="object-cover" sizes="56px" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-xl">👗</div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm leading-snug" style={{ color: "#4A3728" }}>
                      {item.peca.titulo}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-1">
                      {item.peca.tamanho && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ background: "#E5D5B5", color: "#4A3728" }}>
                          {item.peca.tamanho}
                        </span>
                      )}
                      {item.peca.marca && (
                        <span className="text-xs" style={{ color: "#B8A898" }}>{item.peca.marca}</span>
                      )}
                    </div>
                  </div>
                  <span className="shrink-0 font-semibold text-sm" style={{ color: "#4A3728" }}>
                    {formatCentavos(item.precoCentavos)}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center px-6 py-4 border-t"
              style={{ borderColor: "#E5D5B5" }}>
              <span className="text-sm font-semibold" style={{ color: "#7A5C48" }}>Total pago</span>
              <span className="font-display italic text-xl" style={{ color: "#4A3728" }}>
                {formatCentavos(pedido.totalCentavos)}
              </span>
            </div>
          </div>
        )}

        {/* Endereço */}
        {pedido && temEndereco && (
          <div className="p-6 rounded-3xl" style={{ background: "#fff9f2", border: "1px solid #E5D5B5" }}>
            <p className="font-display italic text-xl mb-3" style={{ color: "#4A3728" }}>
              Endereço de entrega
            </p>
            <div className="space-y-1 text-sm" style={{ color: "#7A5C48" }}>
              <p className="font-semibold" style={{ color: "#4A3728" }}>{pedido.clienteNome}</p>
              <p>{pedido.enderecoLinha}</p>
              <p>
                {pedido.enderecoCidade}
                {pedido.enderecoUf ? ` — ${pedido.enderecoUf}` : ""}
                {pedido.enderecoCep ? ` · CEP ${pedido.enderecoCep}` : ""}
              </p>
            </div>
          </div>
        )}

        {/* Próximos passos */}
        <div className="p-6 rounded-3xl space-y-3"
          style={{
            background: isPending ? "#FBF6EE" : "#EDF5EE",
            border: `1px solid ${isPending ? "#E5D5B5" : "#B8D4B8"}`,
          }}>
          <p className="font-display italic text-lg" style={{ color: "#4A3728" }}>
            O que acontece agora?
          </p>
          <ul className="space-y-2 text-sm" style={{ color: "#7A5C48" }}>
            {isPending ? (
              <>
                <li className="flex gap-2"><span>📩</span><span>Você receberá um e-mail assim que o pagamento confirmar.</span></li>
                <li className="flex gap-2"><span>⏱</span><span>Boleto pode levar até 3 dias úteis. Pix confirma em minutos.</span></li>
                <li className="flex gap-2"><span>📦</span><span>Após confirmar, entraremos em contato para o envio.</span></li>
              </>
            ) : (
              <>
                {pedido?.clienteEmail && (
                  <li className="flex gap-2">
                    <span>📩</span>
                    <span>Um e-mail de confirmação será enviado para <strong>{pedido.clienteEmail}</strong>.</span>
                  </li>
                )}
                <li className="flex gap-2"><span>📱</span><span>Entraremos em contato para confirmar os detalhes do envio.</span></li>
                <li className="flex gap-2"><span>📦</span><span>Sua peça será embalada com cuidado e enviada para você.</span></li>
                <li className="flex gap-2"><span>♻️</span><span>Obrigada por escolher moda circular!</span></li>
              </>
            )}
          </ul>
        </div>

        <div className="text-center pt-2">
          <Link href="/produtos" className="btn-primary">
            Continuar explorando ✦
          </Link>
        </div>

      </div>
    </main>
  );
}
