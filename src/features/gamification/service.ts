import { z } from 'zod';
import {
  computeStreak,
  evaluateAchievement,
  homeworkXpBonus,
  type AchievementCondition,
  type UserStats,
} from '@/lib/gamification';
import { XP, XP_EVENT_TYPES } from '@/config/constants';
import * as q from './queries';

/**
 * Бизнес-логика геймификации (ТЗ §3.5): начисление XP (журнал xp_events),
 * стрики, автоматическая выдача достижений, завершение модулей/курсов.
 * Вызывается из lessons/homework при зачёте — точки интеграции (ARCHITECTURE.md §1).
 */

const conditionSchema = z.object({
  type: z.enum(['lesson_completed', 'module_completed', 'homework_passed', 'streak_days']),
  threshold: z.number().int().positive(),
});

/** Начислить XP однократно (идемпотентно по type+refId). */
async function addXpOnce(userId: string, type: string, amount: number, refId: string | null) {
  if (refId && (await q.xpEventExists(userId, type, refId))) return;
  await q.addXp(userId, type, amount, refId);
}

/** Обновить стрик по активности (ТЗ §3.5). */
async function bumpStreak(userId: string) {
  const user = await q.getUser(userId);
  const now = new Date();
  const streak = computeStreak(user?.lastActivityAt ?? null, now, user?.streakDays ?? 0);
  await q.updateStreak(userId, streak, now);
}

/**
 * Статистика ученика: общая (по всем курсам) + по каждому курсу отдельно.
 * Достижение, привязанное к курсу, оценивается по статистике этого курса; стрик — общий.
 */
async function buildStats(
  userId: string,
): Promise<{ global: UserStats; byCourse: Map<string, UserStats> }> {
  const [global, lessonCids, hwCids, modCids] = await Promise.all([
    q.getUserStats(userId),
    q.completedLessonCourseIds(userId),
    q.passedHomeworkCourseIds(userId),
    q.completedModuleCourseIds(userId),
  ]);
  const byCourse = new Map<string, UserStats>();
  const ensure = (cid: string): UserStats => {
    let s = byCourse.get(cid);
    if (!s) {
      s = { lessonsCompleted: 0, modulesCompleted: 0, homeworkPassed: 0, streakDays: global.streakDays };
      byCourse.set(cid, s);
    }
    return s;
  };
  for (const cid of lessonCids) ensure(cid).lessonsCompleted++;
  for (const cid of hwCids) ensure(cid).homeworkPassed++;
  for (const cid of modCids) ensure(cid).modulesCompleted++;
  return { global, byCourse };
}

/** Статистика для оценки достижения: по курсу (если привязано) или общая. */
function statsFor(
  courseId: string | null,
  global: UserStats,
  byCourse: Map<string, UserStats>,
): UserStats {
  if (!courseId) return global;
  return (
    byCourse.get(courseId) ?? {
      lessonsCompleted: 0,
      modulesCompleted: 0,
      homeworkPassed: 0,
      streakDays: global.streakDays,
    }
  );
}

/** Проверить и выдать достижения по текущей статистике (ТЗ §3.5). */
async function checkAchievements(userId: string) {
  const [{ global, byCourse }, achievements, earnedIds] = await Promise.all([
    buildStats(userId),
    q.listAchievements(),
    q.getEarnedAchievementIds(userId),
  ]);
  const earned = new Set(earnedIds);

  for (const a of achievements) {
    if (earned.has(a.id)) continue;
    const parsed = conditionSchema.safeParse(a.conditionJson);
    if (!parsed.success) continue;
    const stats = statsFor(a.courseId, global, byCourse);
    const progress = evaluateAchievement(parsed.data as AchievementCondition, stats);
    if (progress.earned) {
      const granted = await q.grantAchievement(userId, a.id);
      if (granted && a.xpReward > 0) {
        await addXpOnce(userId, 'achievement', a.xpReward, a.id);
      }
    }
  }
}

/**
 * Хук завершения урока: XP за урок + проверка завершения модуля/курса + стрик + достижения.
 * Вызывать ПОСЛЕ установки статуса урока completed (чтобы счётчики учли его).
 */
export async function onLessonCompleted(userId: string, lessonId: string): Promise<void> {
  await addXpOnce(userId, XP_EVENT_TYPES.LESSON_COMPLETED, XP.LESSON_COMPLETED, lessonId);

  const ctx = await q.getLessonModuleCourse(lessonId);
  if (ctx) {
    if (await q.isModuleCompleted(userId, ctx.moduleId)) {
      await addXpOnce(userId, XP_EVENT_TYPES.MODULE_COMPLETED, XP.MODULE_COMPLETED, ctx.moduleId);
    }
    if (await q.isCourseCompleted(userId, ctx.module.courseId)) {
      await addXpOnce(userId, XP_EVENT_TYPES.COURSE_COMPLETED, XP.COURSE_COMPLETED, ctx.module.courseId);
    }
  }

  await bumpStreak(userId);
  await checkAchievements(userId);
}

/** Хук зачтённого ДЗ: XP за ДЗ + бонус по баллу + стрик + достижения (ТЗ §3.5). */
export async function onHomeworkPassed(
  userId: string,
  lessonId: string,
  score: number,
): Promise<void> {
  const amount = XP.HOMEWORK_PASSED + homeworkXpBonus(score, XP.HOMEWORK_SCORE_FACTOR);
  await addXpOnce(userId, XP_EVENT_TYPES.HOMEWORK_PASSED, amount, lessonId);
  await bumpStreak(userId);
  await checkAchievements(userId);
}

export type GamificationSummary = {
  xp: number;
  streakDays: number;
  isPublicInRating: boolean;
};

export async function getSummary(userId: string): Promise<GamificationSummary> {
  const user = await q.getUser(userId);
  return {
    xp: user?.xp ?? 0,
    streakDays: user?.streakDays ?? 0,
    isPublicInRating: user?.isPublicInRating ?? true,
  };
}

// ── Страница достижений (ТЗ §3.5) ──

export interface AchievementView {
  id: string;
  title: string;
  description: string;
  icon: string | null;
  category: string | null;
  /** null = общее достижение (группа «Общие»). */
  courseId: string | null;
  courseTitle: string | null;
  rarity: string;
  xpReward: number;
  current: number;
  target: number;
  earned: boolean;
}

export interface AchievementsPage {
  achievements: AchievementView[];
  earnedCount: number;
  totalCount: number;
  totalXpFromAchievements: number;
}

export async function getAchievementsPage(userId: string): Promise<AchievementsPage> {
  const [{ global, byCourse }, achievements, earnedIds] = await Promise.all([
    buildStats(userId),
    q.listAchievements(),
    q.getEarnedAchievementIds(userId),
  ]);
  const earned = new Set(earnedIds);

  const views: AchievementView[] = achievements.map((a) => {
    const parsed = conditionSchema.safeParse(a.conditionJson);
    const stats = statsFor(a.courseId, global, byCourse);
    const progress = parsed.success
      ? evaluateAchievement(parsed.data as AchievementCondition, stats)
      : { current: 0, target: a.targetValue ?? 1, earned: false };
    const isEarned = earned.has(a.id) || progress.earned;
    return {
      id: a.id,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      courseId: a.courseId,
      courseTitle: a.course?.title ?? null,
      rarity: a.rarity,
      xpReward: a.xpReward,
      current: isEarned ? progress.target : progress.current,
      target: progress.target,
      earned: isEarned,
    };
  });

  const earnedCount = views.filter((v) => v.earned).length;
  return {
    achievements: views,
    earnedCount,
    totalCount: views.length,
    totalXpFromAchievements: views.filter((v) => v.earned).reduce((s, v) => s + v.xpReward, 0),
  };
}

// ── Рейтинг (ТЗ §3.5) ──

export interface LeaderboardRow {
  rank: number;
  userId: string;
  name: string;
  avatarUrl: string | null;
  xp: number;
  streakDays: number;
  isYou: boolean;
}

export type LeaderboardPeriod = 'all' | 'month';

export async function getLeaderboard(
  period: LeaderboardPeriod,
  userId: string,
  limit = 50,
): Promise<LeaderboardRow[]> {
  let rows: Array<{ id: string; name: string; avatarUrl: string | null; xp: number; streakDays: number }>;
  if (period === 'month') {
    const now = new Date();
    const since = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
    rows = await q.getLeaderboardSince(since, limit);
  } else {
    rows = await q.getLeaderboardAllTime(limit);
  }

  return rows.map((r, i) => ({
    rank: i + 1,
    userId: r.id,
    name: r.name,
    avatarUrl: r.avatarUrl,
    xp: r.xp,
    streakDays: r.streakDays,
    isYou: r.id === userId,
  }));
}
