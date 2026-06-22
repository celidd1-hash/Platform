import { db } from '@/lib/db';
import { Prisma, HomeworkVerdict } from '@prisma/client';

/**
 * Доступ к БД для проверки ДЗ админом (ТЗ §3.7). Prisma в queries/ — разрешено линтером.
 */

export function listCourses() {
  return db.course.findMany({
    where: { deletedAt: null },
    orderBy: { title: 'asc' },
    select: { id: true, title: true },
  });
}

export function listHomework(filter: { courseId?: string; verdict?: string }) {
  const where: Prisma.HomeworkWhereInput = {};
  if (filter.verdict === 'trashed') {
    where.deletedAt = { not: null }; // корзина
  } else {
    where.deletedAt = null; // обычные вкладки скрывают корзину
    if (['passed', 'needs_work', 'pending'].includes(filter.verdict ?? '')) {
      where.verdict = filter.verdict as HomeworkVerdict;
    }
  }
  if (filter.courseId) {
    where.lesson = { module: { courseId: filter.courseId } };
  }
  return db.homework.findMany({
    where,
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      text: true,
      verdict: true,
      score: true,
      feedback: true,
      attemptNo: true,
      deletedAt: true,
      createdAt: true,
      user: { select: { id: true, name: true } },
      lesson: { select: { title: true, module: { select: { course: { select: { title: true } } } } } },
    },
  });
}
