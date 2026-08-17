import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import { enviarEmailConfirmacao } from "@/lib/email";

const IP_CHECK_URL = "https://api.checkout.infinitepay.io/payment_check";

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body) return Response.json({ ok: true });

  const { order_nsu, transaction_nsu, invoice_slug } = body as {
    order_nsu?: string;
    transaction_nsu?: string;
    invoice_slug?: string;
  };

  if (!order_nsu || !transaction_nsu) return Response.json({ ok: true });

  try {
    // Verificar autenticidade consultando a InfinitePay
    const checkRes = await fetch(IP_CHECK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        handle: (process.env.INFINITEPAY_HANDLE ?? "").replace(/^\$/, ""),
        order_nsu,
        transaction_nsu,
        slug: invoice_slug ?? "",
      }),
    });

    if (!checkRes.ok) {
      console.error("[webhook/ip] payment_check falhou:", checkRes.status);
      // Retorna 400 para InfinitePay retentar o webhook
      return Response.json({ error: "Falha na verificação" }, { status: 400 });
    }

    const check = await checkRes.json() as { paid?: boolean; success?: boolean };
    const pedidoId = order_nsu;

    if (check.paid === true) {
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: {
          itens: {
            include: { peca: { select: { titulo: true, tamanho: true } } },
          },
        },
      });

      if (!pedido || pedido.status === "PAGO") return Response.json({ ok: true });

      await prisma.$transaction([
        ...(pedido.itens as { pecaId: string }[]).map((item) =>
          prisma.peca.update({
            where: { id: item.pecaId },
            data: { status: "VENDIDO", reservadoAte: null },
          })
        ),
        prisma.pedido.update({
          where: { id: pedidoId },
          data: { status: "PAGO", ipTransacaoId: transaction_nsu },
        }),
      ]);

      enviarEmailConfirmacao({
        id: pedido.id,
        clienteNome: pedido.clienteNome,
        clienteEmail: pedido.clienteEmail,
        totalCentavos: pedido.totalCentavos,
        enderecoLinha: pedido.enderecoLinha,
        enderecoCidade: pedido.enderecoCidade,
        enderecoUf: pedido.enderecoUf,
        enderecoCep: pedido.enderecoCep,
        itens: (pedido.itens as { precoCentavos: number; peca: { titulo: string; tamanho: string | null } }[]).map((i) => ({
          titulo: i.peca.titulo,
          precoCentavos: i.precoCentavos,
          tamanho: i.peca.tamanho,
        })),
      }).catch((e) => console.error("[webhook/ip] email:", e));
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[webhook/ip]", err);
    // Retorna 400 para InfinitePay retentar o webhook
    return Response.json({ error: "Internal error" }, { status: 400 });
  }
}
