import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPago, { Payment } from "mercadopago";

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });
const payment = new Payment(mp);

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);

  // MP envia tipo "payment" com data.id
  if (body?.type !== "payment" || !body?.data?.id) {
    return Response.json({ ok: true }); // ignorar outros eventos
  }

  try {
    const paymentData = await payment.get({ id: String(body.data.id) });
    const status = paymentData.status;
    const pedidoId = paymentData.external_reference;
    const mpPaymentId = String(paymentData.id);

    if (!pedidoId) return Response.json({ ok: true });

    if (status === "approved") {
      // Confirmar pagamento — marcar peças como VENDIDO
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: { itens: true },
      });

      if (!pedido || pedido.status === "PAGO") return Response.json({ ok: true });

      await prisma.$transaction([
        // Marcar peças como vendidas
        ...pedido.itens.map((item) =>
          prisma.peca.update({
            where: { id: item.pecaId },
            data: { status: "VENDIDO", reservadoAte: null },
          })
        ),
        // Atualizar pedido
        prisma.pedido.update({
          where: { id: pedidoId },
          data: { status: "PAGO", mpPaymentId },
        }),
      ]);
    } else if (status === "cancelled" || status === "rejected") {
      // Liberar reserva
      const pedido = await prisma.pedido.findUnique({
        where: { id: pedidoId },
        include: { itens: true },
      });

      if (!pedido || pedido.status !== "PENDENTE") return Response.json({ ok: true });

      await prisma.$transaction([
        ...pedido.itens.map((item) =>
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
