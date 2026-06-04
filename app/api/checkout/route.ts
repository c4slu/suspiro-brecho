import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";
import MercadoPago, { Preference } from "mercadopago";

const mp = new MercadoPago({ accessToken: process.env.MP_ACCESS_TOKEN! });
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

  // Derivar base URL da requisição
  const proto = req.headers.get("x-forwarded-proto") ?? "http";
  const host = req.headers.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;

  try {
    // ── Transação atômica: verificar disponibilidade e reservar ────────────
    const pedido = await prisma.$transaction(async (tx) => {
      for (const id of idsRequeridos) {
        const peca = await tx.peca.findFirst({ where: { id, status: "DISPONIVEL" } });
        if (!peca) throw new Error(`Peça ${id} não está mais disponível`);

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

    // ── Criar preferência no Mercado Pago ──────────────────────────────────
    const pref = await preference.create({
      body: {
        external_reference: pedido.id,
        items: itens.map((i: ItemInput) => ({
          id: i.id,
          title: i.titulo,
          quantity: 1,
          unit_price: i.precoCentavos / 100,
          currency_id: "BRL",
        })),
        payer: {
          name: cliente.nome.split(" ")[0],
          surname: cliente.nome.split(" ").slice(1).join(" "),
          email: cliente.email,
        },
        back_urls: {
          success: `${baseUrl}/checkout/sucesso`,
          failure: `${baseUrl}/checkout/erro`,
          pending: `${baseUrl}/checkout/sucesso`,
        },
        auto_return: "approved",
        notification_url: `${baseUrl}/api/webhooks/mercadopago`,
        statement_descriptor: "SUSPIRO BRECHO",
        expires: true,
        expiration_date_to: expiraEm.toISOString(),
      },
    });

    // Salvar preference ID no pedido
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { mpPreferenceId: pref.id },
    });

    return Response.json({ initPoint: pref.init_point });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Erro interno";
    return Response.json({ error: message }, { status: 422 });
  }
}
