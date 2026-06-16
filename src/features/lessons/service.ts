import { getVideoProvider } from '@/lib/providers/video';
import { getFileProvider } from '@/lib/providers/file';
import { computeUnlocks } from '@/lib/progress';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { LESSON_STATUS, HOMEWORK } from '@/config/constants';
import { onLessonCompleted } from '@/features/gamification';
import * as q from './queries';

/**
 * Бизнес-логика урока (ТЗ §3.3): доступ по enrollment + ownership, последовательное
 * открытие, подписанная ссылка на видео, прогресс. Контроль доступа — на сервере (ТЗ §6А.3).
 */

export interface LessonNeighbor {
  id: string;
  title: string;
}

export interface LessonView {
  id: string;
  title: string;
  contentMd: string | null;
  summaryMd: string | null;
  requiresNote: boolean;
  minNoteLength: number;
  videoSignedUrl: string | null;
  videoPosition: number;
  completed: boolean;
  course: { title: string; slug: string };
  moduleTitle: string;
  files: Array<{ id: string; title: string; fileType: string; sizeBytes: number }>;
  prev: LessonNeighbor | null;
  next: LessonNeighbor | null;
}

export type LessonAccess =
  | { kind: 'not_found' }
  | { kind: 'access_denied'; courseSlug: string }
  | { kind: 'locked'; courseSlug: string }
  | { kind: 'ok'; lesson: LessonView };

/** Данные урока с проверкой доступа и блокировки. */
export async function getLessonForUser(lessonId: string, userId: string): Promise<LessonAccess> {
  const lesson = await q.getLessonWithContext(lessonId);
  if (!lesson) return { kind: 'not_found' };

  const course = lesson.module.course;
  const [hasAccess, orderedLessons, completedIds, progress] = await Promise.all([
    q.hasActiveEnrollment(userId, course.id),
    q.listCourseLessonIds(course.id),
    q.listCompletedLessonIdsForCourse(userId, course.id),
    q.getProgress(userId, lessonId),
  ]);

  if (!hasAccess) return { kind: 'access_denied', courseSlug: course.slug };

  const orderedIds = orderedLessons.map((l) => l.id);
  const completed = new Set(completedIds);
  const { lockedById } = computeUnlocks(orderedIds, completed, course.isStrictOrder);
  if (lockedById[lessonId]) return { kind: 'locked', courseSlug: course.slug };

  // Подписанная HLS-ссылка с коротким TTL (ТЗ §6А.7) — только для доступного ученика.
  let videoSignedUrl: string | null = null;
  if (lesson.videoUrl) {
    try {
      videoSignedUrl = await (await getVideoProvider()).getSignedStreamUrl(lesson.videoUrl, userId);
    } catch {
      videoSignedUrl = null; // деградация вместо краха (ARCHITECTURE.md §6)
    }
  }

  const idx = orderedIds.indexOf(lessonId);
  const prevRow = idx > 0 ? orderedLessons[idx - 1] : null;
  const nextRow = idx >= 0 && idx < orderedLessons.length - 1 ? orderedLessons[idx + 1] : null;

  return {
    kind: 'ok',
    lesson: {
      id: lesson.id,
      title: lesson.title,
      contentMd: lesson.contentMd,
      summaryMd: lesson.lessonSummaryMd,
      requiresNote: lesson.requiresNote,
      minNoteLength: lesson.minNoteLength ?? HOMEWORK.MIN_LENGTH,
      videoSignedUrl,
      videoPosition: progress?.videoPosition ?? 0,
      completed: progress?.status === LESSON_STATUS.COMPLETED,
      course: { title: course.title, slug: course.slug },
      moduleTitle: lesson.module.title,
      files: lesson.files,
      prev: prevRow ? { id: prevRow.id, title: prevRow.title } : null,
      next: nextRow ? { id: nextRow.id, title: nextRow.title } : null,
    },
  };
}

export interface FileDownload {
  signedUrl: string;
  title: string;
  fileType: string;
}

/**
 * Подписанная ссылка на скачивание вложения с проверкой доступа (ТЗ §6А.7).
 * Возвращает null, если файла нет или у ученика нет активного enrollment.
 */
export async function getFileDownload(
  userId: string,
  lessonId: string,
  fileId: string,
): Promise<FileDownload | null> {
  const file = await q.getFileWithCourse(lessonId, fileId);
  if (!file) return null;
  const hasAccess = await q.hasActiveEnrollment(userId, file.lesson.module.courseId);
  if (!hasAccess) return null;

  const signedUrl = await (await getFileProvider()).getSignedDownloadUrl(file.fileUrl, userId);
  return { signedUrl, title: file.title, fileType: file.fileType };
}

/** Проверка владения: ученик имеет активный доступ к курсу этого урока. */
async function assertAccess(userId: string, lessonId: string): Promise<string | null> {
  const lesson = await q.getLessonWithContext(lessonId);
  if (!lesson) return null;
  const hasAccess = await q.hasActiveEnrollment(userId, lesson.module.course.id);
  return hasAccess ? lesson.module.course.id : null;
}

/** Сохранить позицию просмотра (ТЗ §3.3). Тихо игнорирует при отсутствии доступа. */
export async function saveVideoPosition(
  userId: string,
  lessonId: string,
  seconds: number,
): Promise<ActionResult<null>> {
  const courseId = await assertAccess(userId, lessonId);
  if (!courseId) return fail('Нет доступа к уроку');
  if (!Number.isFinite(seconds) || seconds < 0) return fail('Некорректная позиция');

  const current = await q.getProgress(userId, lessonId);
  await q.upsertProgress(userId, lessonId, {
    status:
      current?.status === LESSON_STATUS.COMPLETED
        ? LESSON_STATUS.COMPLETED
        : LESSON_STATUS.IN_PROGRESS,
    videoPosition: Math.floor(seconds),
  });
  return ok(null);
}

export interface WatchResult {
  /** Урок засчитан полностью (видео + ДЗ не требуется). */
  completed: boolean;
  /** Требуется выполнить ДЗ для зачёта (ТЗ §3.4, Этап 3). */
  needsHomework: boolean;
}

/**
 * Отметить видео просмотренным. Урок засчитывается ТОЛЬКО если ДЗ не обязательно;
 * иначе зачёт произойдёт после проверки ДЗ (ТЗ §3.3-3.4).
 *
 * Прим.: начисление XP и достижений — Этап 4 (gamification). Здесь записываем
 * xp-событие завершения, чтобы рейтинг считался из журнала.
 */
export async function markVideoWatched(
  userId: string,
  lessonId: string,
): Promise<ActionResult<WatchResult>> {
  const lesson = await q.getLessonWithContext(lessonId);
  if (!lesson) return fail('Урок не найден');
  const hasAccess = await q.hasActiveEnrollment(userId, lesson.module.course.id);
  if (!hasAccess) return fail('Нет доступа к уроку');

  const now = new Date();
  if (!lesson.requiresNote) {
    await q.upsertProgress(userId, lessonId, {
      status: LESSON_STATUS.COMPLETED,
      videoWatchedAt: now,
      completedAt: now,
    });
    // Начисление XP/стрик/достижения после зачёта (ТЗ §3.5).
    await onLessonCompleted(userId, lessonId);
    return ok({ completed: true, needsHomework: false });
  }

  await q.upsertProgress(userId, lessonId, {
    status: LESSON_STATUS.IN_PROGRESS,
    videoWatchedAt: now,
  });
  return ok({ completed: false, needsHomework: true });
}
