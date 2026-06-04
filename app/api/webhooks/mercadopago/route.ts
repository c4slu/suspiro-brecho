import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPago, { Payment } from "mercadopago";
import { enviarEmailConfirmacao } from "@/lib/email";

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });
const payment = new Payment(mp);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  if (body?.type !== "payment" || !body?.data?.id) {
    return Response.json({ ok: true });
  }

  try {
    const paymentData = await payment.get({ id: String(body.data.id) });
    const status = paymentData.status;
    const pedidoId = paymentData.external_reference;
    const mpPaymentId = String(paymentData.id);

    if (!pedidoId) return Response.json({ ok: true });

    if (status === "approved") {
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: {
          itens: {
            include: {
              peca: { select: { titulo: true, tamanho: true } },
            },
          },
        },
      });

      if (!pedido || pedido.status === "PAGO") return Response.json({ ok: true });

      // Atualizar DB atomicamente
      await prisma.$transaction([
        ...(pedido.itens as { pecaId: string }[]).map((item) =>
          prisma.peca.update({
            where: { id: item.pecaId },
            data: { status: "VENDIDO", reservadoAte: null },
          })
        ),
        prisma.pedido.update({
          where: { id: pedidoId },
          data: { status: "PAGO", mpPaymentId },
        }),
      ]);

      // Enviar e-mail de confirmação (não bloqueia a resposta)
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
      }).catch((e) => console.error("[webhook] email:", e));

    } else if (status === "cancelled" || status === "rejected") {
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: { itens: true },
      });

      if (!pedido || pedido.status !== "PENDENTE") return Response.json({ ok: true });

      await prisma.$transaction([
        ...(pedido.itens as { pecaId: string }[]).map((item) =>
          prisma.peca.update({
            where: { id: item.pecaId },
            data: { status: "DISPONIVEL", reservadoAte: null },
          })
        ),
        prisma.pedido.update({
          where: { id: pedidoId },
          data: { status: "CANCELADO" },
        }),
      ]);
    }

    return Response.json({ ok: true });
  } catch (err) {
    console.error("[webhook/mp]", err);
    return Response.json({ error: "Internal error" }, { status: 500 });
  }
}
