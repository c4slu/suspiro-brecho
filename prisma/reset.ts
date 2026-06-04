import { config } from "dotenv";
import { join } from "path";
config({ path: join(process.cwd(), ".env") });

import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  const released = await prisma.peca.updateMany({
    where: { status: "RESERVADO" },
    data: { status: "DISPONIVEL", reservadoAte: null },
  });
  console.log(`✓ ${released.count} peças liberadas`);

  const all = await prisma.peca.findMany({ select: { id: true, titulo: true, status: true } });
  all.forEach((p) => console.log(`  ${p.status.padEnd(11)} ${p.id}  ${p.titulo}`));
}

main().catch(console.error);
