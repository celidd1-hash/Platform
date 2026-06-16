import { db } from '@/lib/db';

/**
 * Доступ к БД для дашборда админки (ТЗ §3.7). Prisma-доступ в queries/ — разрешено линтером.
 */

export async function getDashboardStats(weekAgo: Date) {
  const [totalStudents, activeWeek, publishedCourses, passedAgg, aiChecks, pendingHw] =
    await Promise.all([
      db.user.count({ where: { role: 'student' } }),
      db.user.count({ where: { role: 'student', lastActivityAt: { gte: weekAgo } } }),
      db.course.count({ where: { isPublished: true, isArchived: false, deletedAt: null } }),
      db.homework.aggregate({ where: { verdict: 'passed' }, _avg: { score: true } }),
      db.homework.count({ where: { score: { not: null } } }),
      db.homework.count({ where: { verdict: 'pending' } }),
    ]);

  return {
    totalStudents,
    activeWeek,
    publishedCourses,
    avgHomeworkScore: passedAgg._avg.score != null ? Math.round(passedAgg._avg.score) : null,
    aiChecks,
    pendingHomework: pendingHw,
  };
}

/** Завершаемость курсов: доля учеников, прошедших все уроки курса. */
export async function getCourseCompletion() {
  const courses = await db.course.findMany({
    where: { isArchived: false, deletedAt: null },
    select: {
      id: true,
      title: true,
      _count: { select: { enrollments: { where: { status: 'active' } } } },
      modules: {
        where: { isArchived: false, deletedAt: null },
        select: { _count: { select: { lessons: { where: { isArchived: false, deletedAt: null } } } } },
      },
    },
  });
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    students: c._count.enrollments,
    lessons: c.modules.reduce((s, m) => s + m._count.lessons, 0),
  }));
}
