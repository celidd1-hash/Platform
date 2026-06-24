import { db } from '@/lib/db';
import { EnrollmentStatus } from '@prisma/client';

/**
 * Доступ к БД фичи mentor (CLAUDE.md: Prisma только здесь).
 * Контекст наставника берётся ТОЛЬКО из курсов с активным enrollment ученика (ТЗ §6А.3):
 * база знаний (вся: курс + модули) + кастомный промт куратора (AiSettings).
 */
export async function getEnrolledCoursesContext(userId: string) {
  const enrollments = await db.enrollment.findMany({
    where: { userId, status: EnrollmentStatus.active, course: { deletedAt: null } },
    select: {
      course: {
        select: {
          title: true,
          aiSettings: { select: { promptTemplate: true } },
          aiKnowledge: {
            orderBy: { createdAt: 'asc' },
            select: { title: true, contentMd: true },
          },
        },
      },
    },
  });
  return enrollments.map((e) => ({
    title: e.course.title,
    promptTemplate: e.course.aiSettings?.promptTemplate ?? null,
    knowledge: e.course.aiKnowledge,
  }));
}
