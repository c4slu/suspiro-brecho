import { config } from "dotenv";
import { join } from "path";
config({ path: join(process.cwd(), ".env") });

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const pedidos = await prisma.pedido.findMany({
    orderBy: { criadoEm: "desc" },
    take: 5,
    select: {
      id: true, clienteNome: true, status: true,
      enderecoLinha: true, enderecoCidade: true,
    },
  });
  console.log(JSON.stringify(pedidos, null, 2));
}
main().catch(console.error);
