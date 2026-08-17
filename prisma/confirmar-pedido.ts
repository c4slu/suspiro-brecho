/**
 * Script manual para confirmar um pedido quando o webhook da InfinitePay não chegou.
 * Uso: npx tsx prisma/confirmar-pedido.ts <pedidoId> [transacaoId]
 */
import { config } from "dotenv";
import { join } from "path";
config({ path: join(process.cwd(), ".env") });

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { enviarEmailConfirmacao } from "../lib/email";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const pedidoId  = process.argv[2];
  const transacaoId = process.argv[3] ?? "manual";

  if (!pedidoId) { console.error("Uso: npx tsx prisma/confirmar-pedido.ts <pedidoId> [transacaoId]"); process.exit(1); }

  const pedido = await prisma.pedido.findUnique({
    where: { id: pedidoId },
    include: {
      itens: {
        include: { peca: { include: { fotos: { take: 1, orderBy: { ordem: "asc" } } } } },
      },
    },
  });

  if (!pedido) { console.error("Pedido não encontrado:", pedidoId); process.exit(1); }
  if (pedido.status === "PAGO" || pedido.status === "ENTREGUE") {
    console.log("Pedido já está:", pedido.status); process.exit(0);
  }

  console.log(`Confirmando pedido de ${pedido.clienteNome} (${pedido.clienteEmail})...`);

  type ItemComPeca = { pecaId: string };
  await prisma.$transaction([
    ...(pedido.itens as ItemComPeca[]).map((item) =>
      prisma.peca.update({ where: { id: item.pecaId }, data: { status: "VENDIDO", reservadoAte: null } })
    ),
    prisma.pedido.update({ where: { id: pedidoId }, data: { status: "PAGO", ipTransacaoId: transacaoId } }),
  ]);

  console.log("✓ Pedido marcado como PAGO e peças como VENDIDO");

  // Enviar e-mail
  type ItemComDetalhes = { precoCentavos: number; peca: { titulo: string; tamanho: string | null } };
  const emailResult = await enviarEmailConfirmacao({
    id: pedido.id,
    clienteNome: pedido.clienteNome,
    clienteEmail: pedido.clienteEmail,
    totalCentavos: pedido.totalCentavos,
    enderecoLinha: pedido.enderecoLinha,
    enderecoCidade: pedido.enderecoCidade,
    enderecoUf: pedido.enderecoUf,
    enderecoCep: pedido.enderecoCep,
    itens: (pedido.itens as ItemComDetalhes[]).map((i) => ({
      titulo: i.peca.titulo,
      precoCentavos: i.precoCentavos,
      tamanho: i.peca.tamanho,
    })),
  });

  console.log(emailResult.ok ? `✓ E-mail enviado para ${pedido.clienteEmail}` : `⚠ E-mail: ${emailResult.reason}`);
}

main().catch(console.error);
