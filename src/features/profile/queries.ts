import { db } from '@/lib/db';

/** Доступ к БД фичи profile (CLAUDE.md: Prisma только здесь). */

export function getUser(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
      xp: true,
      streakDays: true,
      isPublicInRating: true,
      telegramChatId: true,
      createdAt: true,
    },
  });
}

/** Место в рейтинге = число публичных учеников с большим XP + 1. */
export async function getRank(userId: string, xp: number) {
  const higher = await db.user.count({ where: { isPublicInRating: true, xp: { gt: xp } } });
  return higher + 1;
}

export function countAchievements(userId: string) {
  return db.userAchievement.count({ where: { userId } });
}

export function getEnrollments(userId: string) {
  return db.enrollment.findMany({
    where: { userId, status: 'active' },
    select: {
      course: {
        select: {
          id: true,
          title: true,
          slug: true,
          modules: {
            where: { isArchived: false, deletedAt: null },
            select: { lessons: { where: { isArchived: false, deletedAt: null }, select: { id: true } } },
          },
        },
      },
    },
  });
}

export function getCompletedLessonIds(userId: string) {
  return db.lessonProgress
    .findMany({ where: { userId, status: 'completed' }, select: { lessonId: true } })
    .then((rows) => rows.map((r) => r.lessonId));
}

export function getHomeworkHistory(userId: string) {
  return db.homework.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 50,
    select: {
      id: true,
      verdict: true,
      score: true,
      feedback: true,
      attemptNo: true,
      createdAt: true,
      lesson: { select: { title: true, module: { select: { course: { select: { title: true } } } } } },
    },
  });
}

export function getAuthHash(userId: string) {
  return db.user.findUnique({ where: { id: userId }, select: { passwordHash: true } });
}

export function updateProfile(userId: string, data: { name: string; avatarUrl: string | null }) {
  return db.user.update({ where: { id: userId }, data });
}

export function updatePasswordHash(userId: string, passwordHash: string) {
  return db.user.update({ where: { id: userId }, data: { passwordHash } });
}

/** Полное удаление аккаунта — каскад удаляет связанные данные (ТЗ §6А.11). */
export function deleteUser(userId: string) {
  return db.user.delete({ where: { id: userId } });
}

/** Данные для экспорта (право на доступ, ТЗ §6А.11). */
export function getExport(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
      name: true,
      createdAt: true,
      xp: true,
      streakDays: true,
      homework: { select: { text: true, verdict: true, score: true, feedback: true, createdAt: true } },
      lessonProgress: { select: { lessonId: true, status: true, completedAt: true } },
      userAchievements: { select: { achievement: { select: { code: true, title: true } }, earnedAt: true } },
      enrollments: { select: { course: { select: { title: true } }, status: true, createdAt: true } },
    },
  });
}

export function writeAuditLog(data: { actorId: string; action: string; targetType: string; targetId: string }) {
  return db.auditLog.create({ data });
}
