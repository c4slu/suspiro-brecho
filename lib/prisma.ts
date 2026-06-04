import { PrismaClient } from "../app/generated/prisma/client";
import { withAccelerate } from "@prisma/extension-accelerate";

const globalForPrisma = globalThis as unknown as {
  prisma?: ReturnType<typeof makePrismaClient>;
};

function makePrismaClient() {
  return new PrismaClient({
    accelerateUrl: process.env.DATABASE_URL!,
  }).$extends(withAccelerate());
}

export const prisma = globalForPrisma.prisma ?? makePrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
