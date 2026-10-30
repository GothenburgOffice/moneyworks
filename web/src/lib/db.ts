import 'server-only';
import { PrismaPg } from '@prisma/adapter-pg';
import { PrismaClient } from '@/generated/prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

function createClient() {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL is not configured.');
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

export async function getDatabaseGreeting(locale: string) {
  const greeting = await getDatabase().greeting.findUniqueOrThrow({
    where: { locale },
    select: { message: true },
  });

  return {
    message: greeting.message,
    checkedAt: new Date().toISOString(),
  };
}
