/**
 * Чистая логика геймификации (ТЗ §3.5): стрики и проверка условий достижений.
 * Без БД — переиспользуется в features/gamification, покрыта тестами (критичный путь).
 */

/** Полночь в днях с эпохи (для сравнения календарных дней без учёта времени). */
function dayNumber(d: Date): number {
  return Math.floor(
    Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate()) / 86_400_000,
  );
}

/**
 * Пересчёт стрика по активности (ТЗ §3.5).
 * — та же дата, что и последняя активность → без изменений (минимум 1);
 * — следующий день → +1;
 * — пропуск или первая активность → сброс к 1.
 */
export function computeStreak(
  lastActivityAt: Date | null,
  now: Date,
  currentStreak: number,
): number {
  if (!lastActivityAt) return 1;
  const diff = dayNumber(now) - dayNumber(lastActivityAt);
  if (diff <= 0) return Math.max(currentStreak, 1);
  if (diff === 1) return currentStreak + 1;
  return 1;
}

export type AchievementConditionType =
  | 'lesson_completed'
  | 'module_completed'
  | 'homework_passed'
  | 'streak_days';

export interface AchievementCondition {
  type: AchievementConditionType;
  threshold: number;
}

export interface UserStats {
  lessonsCompleted: number;
  modulesCompleted: number;
  homeworkPassed: number;
  streakDays: number;
}

export interface AchievementProgress {
  current: number;
  target: number;
  earned: boolean;
}

const STAT_BY_TYPE: Record<AchievementConditionType, keyof UserStats> = {
  lesson_completed: 'lessonsCompleted',
  module_completed: 'modulesCompleted',
  homework_passed: 'homeworkPassed',
  streak_days: 'streakDays',
};

/** Прогресс к достижению X/Y и факт получения по статистике ученика. */
export function evaluateAchievement(
  condition: AchievementCondition,
  stats: UserStats,
): AchievementProgress {
  const statKey = STAT_BY_TYPE[condition.type];
  const value = stats[statKey] ?? 0;
  const target = condition.threshold;
  return {
    current: Math.min(value, target),
    target,
    earned: value >= target,
  };
}

/** Бонус XP за ДЗ от балла проверки (ТЗ §3.5): score * factor, округление вниз. */
export function homeworkXpBonus(score: number, factor: number): number {
  return Math.max(0, Math.floor(score * factor));
}
