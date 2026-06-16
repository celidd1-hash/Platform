/**
 * Чистая логика прогресса и последовательного открытия уроков (ТЗ §3.3).
 * Без БД и побочных эффектов — переиспользуется в features/courses и features/lessons,
 * покрыта unit-тестами (критичный путь, ARCHITECTURE.md §8).
 */

/** Процент прохождения курса: завершённые уроки / всего уроков. */
export function computeProgressPct(totalLessons: number, completedLessons: number): number {
  if (totalLessons <= 0) return 0;
  return Math.round((Math.min(completedLessons, totalLessons) / totalLessons) * 100);
}

export interface UnlockResult {
  /** id урока → заблокирован ли он для ученика. */
  lockedById: Record<string, boolean>;
  /** Урок, с которого продолжить (первый открытый незавершённый); null — всё пройдено. */
  continueLessonId: string | null;
}

/**
 * Вычисляет блокировки по последовательному порядку.
 * Урок открыт, если: курс не строгий; ИЛИ это первый урок; ИЛИ предыдущий урок завершён.
 * @param orderedLessonIds id уроков в порядке курс→модуль→урок
 * @param completedIds множество id завершённых уроков
 * @param isStrict строгий порядок (для свободного — всё открыто)
 */
export function computeUnlocks(
  orderedLessonIds: string[],
  completedIds: ReadonlySet<string>,
  isStrict: boolean,
): UnlockResult {
  const lockedById: Record<string, boolean> = {};
  let continueLessonId: string | null = null;

  for (let i = 0; i < orderedLessonIds.length; i++) {
    const id = orderedLessonIds[i]!;
    const prevId = i > 0 ? orderedLessonIds[i - 1]! : null;
    const locked = isStrict && prevId !== null && !completedIds.has(prevId);
    lockedById[id] = locked;

    if (continueLessonId === null && !locked && !completedIds.has(id)) {
      continueLessonId = id;
    }
  }

  return { lockedById, continueLessonId };
}
