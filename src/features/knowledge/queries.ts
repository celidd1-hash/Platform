import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/** Доступ к БД фичи knowledge (CLAUDE.md: Prisma только здесь). */

export function listArticles(search: string | undefined) {
  const where: Prisma.KbArticleWhereInput = { isPublished: true };
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
      { bodyMd: { contains: search, mode: 'insensitive' } },
    ];
  }
  return db.kbArticle.findMany({
    where,
    orderBy: [{ category: 'asc' }, { position: 'asc' }],
    select: { id: true, category: true, title: true, icon: true, steps: true, description: true },
  });
}

export function getArticle(id: string) {
  return db.kbArticle.findFirst({
    where: { id, isPublished: true },
    select: { id: true, category: true, title: true, icon: true, steps: true, bodyMd: true },
  });
}
