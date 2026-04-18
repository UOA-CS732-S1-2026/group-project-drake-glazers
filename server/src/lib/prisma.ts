const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (...args: any[]) => import("@prisma/client").PrismaClient;
};

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: import("@prisma/client").PrismaClient;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
