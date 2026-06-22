import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Доступ к БД фичи gamification (CLAUDE.md: Prisma только здесь).
 * Рейтинг считается из журнала xp_events и из суммарного user.xp.
 */

/** Идемпотентность начислений: было ли уже событие данного типа по ref. */
export function xpEventExists(userId: string, type: string, refId: string) {
  return db.xpEvent
    .findFirst({ where: { userId, type, refId }, select: { id: true } })
    .then(Boolean);
}

/** Атомарно: запись в журнал xp_events + инкремент суммарного user.xp. */
export async function addXp(userId: string, type: string, amount: number, refId: string | null) {
  await db.$transaction([
    db.xpEvent.create({ data: { userId, type, amount, refId } }),
    db.user.update({ where: { id: userId }, data: { xp: { increment: amount } } }),
  ]);
}

export function updateStreak(userId: string, streakDays: number, lastActivityAt: Date) {
  return db.user.update({ where: { id: userId }, data: { streakDays, lastActivityAt } });
}

export function getUser(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: { xp: true, streakDays: true, lastActivityAt: true, isPublicInRating: true },
  });
}

// ── Статистика ученика для проверки достижений ──

export async function getUserStats(userId: string) {
  const [lessonsCompleted, homeworkPassed, user] = await Promise.all([
    db.lessonProgress.count({ where: { userId, status: 'completed' } }),
    db.homework.count({ where: { userId, verdict: 'passed' } }),
    db.user.findUnique({ where: { id: userId }, select: { streakDays: true } }),
  ]);
  // Завершённые модули: модули, все уроки которых пройдены — считаем по xp-событиям модуля.
  const modulesCompleted = await db.xpEvent.count({
    where: { userId, type: 'module_completed' },
  });
  return {
    lessonsCompleted,
    modulesCompleted,
    homeworkPassed,
    streakDays: user?.streakDays ?? 0,
  };
}

// ── Завершение модуля/курса ──

/** Все ли неархивные уроки модуля пройдены пользователем. */
export async function isModuleCompleted(userId: string, moduleId: string) {
  const total = await db.lesson.count({
    where: { moduleId, isArchived: false, deletedAt: null },
  });
  if (total === 0) return false;
  const done = await db.lessonProgress.count({
    where: { userId, status: 'completed', lesson: { moduleId, isArchived: false, deletedAt: null } },
  });
  return done >= total;
}

export async function isCourseCompleted(userId: string, courseId: string) {
  const total = await db.lesson.count({
    where: { isArchived: false, deletedAt: null, module: { courseId, isArchived: false, deletedAt: null } },
  });
  if (total === 0) return false;
  const done = await db.lessonProgress.count({
    where: {
      userId,
      status: 'completed',
      lesson: { isArchived: false, deletedAt: null, module: { courseId } },
    },
  });
  return done >= total;
}

export function getLessonModuleCourse(lessonId: string) {
  return db.lesson.findUnique({
    where: { id: lessonId },
    select: { moduleId: true, module: { select: { courseId: true } } },
  });
}

// ── Достижения ──

export function listAchievements() {
  return db.achievement.findMany({
    orderBy: { position: 'asc' },
    select: {
      id: true,
      code: true,
      courseId: true,
      course: { select: { title: true } },
      title: true,
      description: true,
      icon: true,
      category: true,
      rarity: true,
      xpReward: true,
      conditionJson: true,
      targetValue: true,
    },
  });
}

// ── Статистика по курсам (для достижений, привязанных к курсу) ──

/** courseId для каждого пройденного урока пользователя (повторы = несколько уроков курса). */
export async function completedLessonCourseIds(userId: string): Promise<string[]> {
  const rows = await db.lessonProgress.findMany({
    where: { userId, status: 'completed' },
    select: { lesson: { select: { module: { select: { courseId: true } } } } },
  });
  return rows.map((r) => r.lesson.module.courseId);
}

/** courseId для каждого зачтённого ДЗ пользователя. */
export async function passedHomeworkCourseIds(userId: string): Promise<string[]> {
  const rows = await db.homework.findMany({
    where: { userId, verdict: 'passed' },
    select: { lesson: { select: { module: { select: { courseId: true } } } } },
  });
  return rows.map((r) => r.lesson.module.courseId);
}

/** courseId для каждого завершённого модуля (из xp-событий module_completed). */
export async function completedModuleCourseIds(userId: string): Promise<string[]> {
  const events = await db.xpEvent.findMany({
    where: { userId, type: 'module_completed' },
    select: { refId: true },
  });
  const moduleIds = events.map((e) => e.refId).filter((x): x is string => Boolean(x));
  if (moduleIds.length === 0) return [];
  const modules = await db.module.findMany({
    where: { id: { in: moduleIds } },
    select: { id: true, courseId: true },
  });
  const byId = new Map(modules.map((m) => [m.id, m.courseId]));
  return moduleIds.map((id) => byId.get(id)).filter((x): x is string => Boolean(x));
}

export function getEarnedAchievementIds(userId: string) {
  return db.userAchievement
    .findMany({ where: { userId }, select: { achievementId: true } })
    .then((rows) => rows.map((r) => r.achievementId));
}

/** Выдать достижение (идемпотентно). Возвращает true, если выдано впервые. */
export async function grantAchievement(userId: string, achievementId: string) {
  try {
    await db.userAchievement.create({ data: { userId, achievementId } });
    return true;
  } catch {
    return false; // уже выдано (нарушение уникальности составного ключа)
  }
}

// ── Рейтинг (лидерборд) ──

export function getLeaderboardAllTime(limit: number) {
  return db.user.findMany({
    where: { isPublicInRating: true },
    orderBy: { xp: 'desc' },
    take: limit,
    select: { id: true, name: true, avatarUrl: true, xp: true, streakDays: true },
  });
}

/** Сумма XP за период (текущий месяц) из журнала — для месячного рейтинга. */
export async function getLeaderboardSince(since: Date, limit: number) {
  const grouped = await db.xpEvent.groupBy({
    by: ['userId'],
    where: { createdAt: { gte: since } },
    _sum: { amount: true },
    orderBy: { _sum: { amount: 'desc' } },
    take: limit,
  });
  const userIds = grouped.map((g) => g.userId);
  const users = await db.user.findMany({
    where: { id: { in: userIds }, isPublicInRating: true },
    select: { id: true, name: true, avatarUrl: true, streakDays: true },
  });
  const byId = new Map(users.map((u) => [u.id, u]));
  return grouped
    .map((g) => {
      const u = byId.get(g.userId);
      return u ? { ...u, xp: g._sum.amount ?? 0 } : null;
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);
}

export function setRatingVisibility(userId: string, isPublic: boolean) {
  return db.user.update({ where: { id: userId }, data: { isPublicInRating: isPublic } });
}

export type JsonValue = Prisma.JsonValue;
