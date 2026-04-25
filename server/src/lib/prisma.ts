const dotenv = require("dotenv") as typeof import("dotenv");
const { PrismaPg } = require("@prisma/adapter-pg") as {
  PrismaPg: new (options: { connectionString: string }) => unknown;
};
const { PrismaClient } = require("@prisma/client") as {
  PrismaClient: new (...args: any[]) => import("@prisma/client").PrismaClient;
};

dotenv.config();

const globalForPrisma = globalThis as typeof globalThis & {
  prisma?: import("@prisma/client").PrismaClient;
};

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  throw new Error("DATABASE_URL is required to initialize Prisma");
}

const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter: new PrismaPg({ connectionString: databaseUrl }),
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

module.exports = { prisma };
