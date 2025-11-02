// Prisma Client インスタンス
// シングルトンパターンで複数インスタンス生成を防ぐ

import { PrismaClient } from './generated/prisma';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Create Prisma Client with Supabase configuration
// Disable prepared statements for Supabase Session Pooler (transaction mode)
export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
    datasourceUrl: process.env.DATABASE_URL + '?pgbouncer=true',
  });

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
