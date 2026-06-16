import { PrismaClient } from '@prisma/client';

/**
 * Singleton Prisma client (ARCHITECTURE.md §1).
 * В dev переиспользуем экземпляр между hot-reload, чтобы не плодить коннекты.
 *
 * ВАЖНО (CLAUDE.md): прямой импорт `db` разрешён ТОЛЬКО в features/<имя>/queries.ts.
 * Линтер запрещает импорт @prisma/client где-либо ещё.
 */
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = db;
}
