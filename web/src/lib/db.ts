import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const adapter = new PrismaPg({
    connectionString,
    connectionTimeoutMillis: 3000,
    query_timeout: 5000,
  });

  return new PrismaClient({ adapter });
}

// Reuse the connection pool across development hot reloads. Initialize lazily
// so building the application never requires a running database.
export function getDatabase() {
  globalForPrisma.prisma ??= createClient();
  return globalForPrisma.prisma;
}

// A real round trip to PostgreSQL; throws when the database is unreachable.
export async function checkDatabase() {
  await getDatabase().$queryRaw`SELECT 1`;
  return { checkedAt: new Date().toISOString() };
}
