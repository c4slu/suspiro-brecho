import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPago, { Preference } from "mercadopago";

// Em dev pode usar MP_ACCESS_TOKEN_TEST (token TEST-...) para sandbox sem dinheiro real
const token = process.env.MP_ACCESS_TOKEN_TEST ?? process.env.MP_ACCESS_TOKEN!;
const mp = new MercadoPago({ accessToken: token });
const preference = new Preference(mp);

const RESERVA_MINUTOS = 15;

type ItemInput = { id: string; precoCentavos: number; titulo: string };
type ClienteInput = {
  nome: string;
  email: string;
  telefone?: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  uf?: string;
};

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  if (!body?.itens?.length || !body?.cliente?.nome || !body?.cliente?.email) {
    return Response.json({ error: "Dados incompletos" }, { status: 400 });
  }

  const { itens, cliente }: { itens: ItemInput[]; cliente: ClienteInput } = body;
  const idsRequeridos = itens.map((i: ItemInput) => i.id);
  const expiraEm = new Date(Date.now() + RESERVA_MINUTOS * 60 * 1000);

  // APP_URL permite testar com ngrok em dev (ex: https://abc.ngrok.io)
  const baseUrl =
    process.env.APP_URL ??
    `${req.headers.get("x-forwarded-proto") ?? "http"}://${req.headers.get("host") ?? "localhost:3000"}`;

  let pedidoId: string | null = null;

  try {
    // ── 1. Reserva atômica ─────────────────────────────────────────────────
    const pedido = await prisma.$transaction(async (tx) => {
      for (const id of idsRequeridos) {
        const peca = await tx.peca.findFirst({ where: { id, status: "DISPONIVEL" } });
        if (!peca) throw new Error(`Peça "${id}" não está mais disponível`);

        await tx.peca.update({
          where: { id },
          data: { status: "RESERVADO", reservadoAte: expiraEm },
        });
      }

      return tx.pedido.create({
        data: {
          clienteNome: cliente.nome,
          clienteEmail: cliente.email,
          clienteTelefone: cliente.telefone,
          enderecoCep: cliente.cep,
          enderecoLinha: cliente.endereco,
          enderecoCidade: cliente.cidade,
          enderecoUf: cliente.uf,
          totalCentavos: itens.reduce((acc: number, i: ItemInput) => acc + i.precoCentavos, 0),
          expiraEm,
          itens: {
            create: itens.map((i: ItemInput) => ({
              pecaId: i.id,
              precoCentavos: i.precoCentavos,
            })),
          },
        },
      });
    });

    pedidoId = pedido.id;

    // ── 2. Criar preferência no Mercado Pago ──────────────────────────────
    let pref;
    try {
      pref = await preference.create({
        body: {
          external_reference: pedido.id,
          items: itens.map((i: ItemInput) => ({
            id: i.id,
            title: `Suspiro Brechó — ${i.titulo}`,
            description: "Peça única de brechó curado",
            quantity: 1,
            unit_price: i.precoCentavos / 100,
            currency_id: "BRL",
            category_id: "fashion",
          })),
          payer: {
            name: cliente.nome.split(" ")[0],
            surname: cliente.nome.split(" ").slice(1).join(" ") || " ",
            email: cliente.email,
          },
          back_urls: {
            success: `${baseUrl}/checkout/sucesso`,
            failure: `${baseUrl}/checkout/erro`,
            pending: `${baseUrl}/checkout/sucesso`, // pending vai pra sucesso com status=pending
          },
          // auto_return só funciona com URLs públicas (não localhost)
          ...(baseUrl.startsWith("http://localhost") ? {} : { auto_return: "approved" as const }),
          notification_url: `${baseUrl}/api/webhooks/mercadopago`,
          statement_descriptor: "SUSPIRO BRECHO",
          expires: true,
          expiration_date_to: expiraEm.toISOString(),
        },
      });
    } catch (mpErr) {
      // ── Rollback: liberar reserva e cancelar pedido ──────────────────────
      console.error("[checkout] Erro no Mercado Pago:", mpErr);
      await prisma.$transaction([
        ...idsRequeridos.map((id) =>
          prisma.peca.update({
            where: { id },
            data: { status: "DISPONIVEL", reservadoAte: null },
          })
        ),
        prisma.pedido.update({
          where: { id: pedidoId! },
          data: { status: "CANCELADO" },
        }),
      ]);

      const mpMessage =
        mpErr instanceof Error ? mpErr.message : "Erro ao conectar com o Mercado Pago";
      return Response.json({ error: `Pagamento indisponível no momento. Detalhe: ${mpMessage}` }, { status: 502 });
    }

    // ── 3. Salvar preference ID ────────────────────────────────────────────
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { mpPreferenceId: pref.id },
    });

    return Response.json({ initPoint: pref.init_point, pedidoId: pedido.id });

  } catch (err) {
    console.error("[checkout] Erro geral:", err);
    // Se a reserva foi criada mas algo mais falhou, tenta liberar
    if (pedidoId) {
      await prisma.$transaction([
        ...idsRequeridos.map((id) =>
          prisma.peca.update({
            where: { id },
            data: { status: "DISPONIVEL", reservadoAte: null },
          })
        ),
        prisma.pedido.update({
          where: { id: pedidoId },
          data: { status: "CANCELADO" },
        }),
      ]).catch(() => {});
    }
    const message = err instanceof Error ? err.message : "Erro interno";
    return Response.json({ error: message }, { status: 422 });
  }
}
