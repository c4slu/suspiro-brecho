import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

const RESERVA_MINUTOS = 15;
const IP_API = "https://api.checkout.infinitepay.io/links";

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

  // APP_URL permite testar com ngrok/cloudflare em dev (ex: https://abc.trycloudflare.com)
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

    // ── 2. Criar link de pagamento na InfinitePay ──────────────────────────
    let checkoutUrl: string;
    try {
      const telefoneFormatado = cliente.telefone
        ? `+55${cliente.telefone.replace(/\D/g, "")}`
        : undefined;

      // Remove o $ inicial caso o usuário tenha copiado com ele (ex: "$isabelly-do" → "isabelly-do")
      const ipHandle = (process.env.INFINITEPAY_HANDLE ?? "").replace(/^\$/, "");

      const ipPayload: Record<string, unknown> = {
        handle: ipHandle,
        order_nsu: pedido.id,
        redirect_url: `${baseUrl}/checkout/sucesso`,
        webhook_url: `${baseUrl}/api/webhooks/infinitepay`,
        items: itens.map((i: ItemInput) => ({
          quantity: 1,
          price: i.precoCentavos,
          description: `Suspiro Brechó — ${i.titulo}`,
        })),
        customer: {
          name: cliente.nome,
          email: cliente.email,
          ...(telefoneFormatado ? { phone_number: telefoneFormatado } : {}),
        },
      };

      // Endereço é opcional — só envia se CEP preenchido e com campos válidos
      // (evita 422 por campos vazios obrigatórios dentro de address)
      if (cliente.cep && cliente.endereco) {
        ipPayload.address = {
          cep: cliente.cep.replace(/\D/g, ""),
          street: cliente.endereco,
        };
      }

      console.log("[checkout] InfinitePay payload:", JSON.stringify(ipPayload));

      const ipRes = await fetch(IP_API, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(ipPayload),
      });

      const ipRawBody = await ipRes.text();
      console.log("[checkout] InfinitePay resposta:", ipRes.status, ipRawBody);

      if (!ipRes.ok) {
        throw new Error(`InfinitePay ${ipRes.status}: ${ipRawBody}`);
      }

      const ipData = JSON.parse(ipRawBody);

      checkoutUrl = ipData.url;
      if (!checkoutUrl) throw new Error("InfinitePay não retornou URL de pagamento");
    } catch (ipErr) {
      // ── Rollback: liberar reserva e cancelar pedido ──────────────────────
      console.error("[checkout] Erro na InfinitePay:", ipErr);
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

      const msg = ipErr instanceof Error ? ipErr.message : "Erro ao conectar com o gateway de pagamento";
      return Response.json({ error: `Pagamento indisponível no momento. Detalhe: ${msg}` }, { status: 502 });
    }

    // ── 3. Salvar URL do link de checkout ──────────────────────────────────
    await prisma.pedido.update({
      where: { id: pedido.id },
      data: { ipCheckoutUrl: checkoutUrl },
    });

    return Response.json({ initPoint: checkoutUrl, pedidoId: pedido.id });

  } catch (err) {
    console.error("[checkout] Erro geral:", err);
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
