import { getVideoProvider } from '@/lib/providers/video';
import { getFileProvider } from '@/lib/providers/file';
import { computeUnlocks } from '@/lib/progress';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { LESSON_STATUS, HOMEWORK } from '@/config/constants';
import { onLessonCompleted } from '@/features/gamification';
import { hasSubmittedHomework } from '@/features/homework';
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
  /** Внешняя ссылка на материалы (Google Диск и т.п.), если задана. */
  materialsUrl: string | null;
  /** Материалы (конспекты + ссылка) открыты: видео просмотрено (+ ДЗ отправлено, если урок требует). */
  filesUnlocked: boolean;
  prev: LessonNeighbor | null;
  next: LessonNeighbor | null;
}

/**
 * Доступны ли конспекты: видео просмотрено на ≥80% И (если урок требует ДЗ) ДЗ отправлено.
 * Если ДЗ не требуется — достаточно просмотра (ТЗ §3.3).
 */
async function areFilesUnlocked(
  userId: string,
  lessonId: string,
  requiresNote: boolean,
  watched: boolean,
): Promise<boolean> {
  if (!watched) return false;
  if (!requiresNote) return true;
  return hasSubmittedHomework(userId, lessonId);
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
  const [hasAccess, orderedLessons, watchedIds, progress] = await Promise.all([
    q.hasActiveEnrollment(userId, course.id),
    q.listCourseLessonIds(course.id),
    q.listWatchedLessonIdsForCourse(userId, course.id),
    q.getProgress(userId, lessonId),
  ]);

  if (!hasAccess) return { kind: 'access_denied', courseSlug: course.slug };

  // Следующий урок открывается по просмотру предыдущего на ≥80% (без ожидания ДЗ).
  const orderedIds = orderedLessons.map((l) => l.id);
  const watched = new Set(watchedIds);
  const { lockedById } = computeUnlocks(orderedIds, watched, course.isStrictOrder);
  if (lockedById[lessonId]) return { kind: 'locked', courseSlug: course.slug };

  // Материалы (конспекты и/или внешняя ссылка) открыты после просмотра видео (+ отправки ДЗ).
  const hasMaterials = lesson.files.length > 0 || Boolean(lesson.materialsUrl);
  const filesUnlocked = !hasMaterials
    ? false
    : await areFilesUnlocked(userId, lessonId, lesson.requiresNote, Boolean(progress?.videoWatchedAt));

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
      materialsUrl: lesson.materialsUrl,
      filesUnlocked,
      prev: prevRow ? { id: prevRow.id, title: prevRow.title } : null,
      next: nextRow ? { id: nextRow.id, title: nextRow.title } : null,
    },
  };
}

/**
 * Свежая подписанная ссылка на видео-поток урока (для авто-обновления в плеере, ТЗ §6А.7).
 * Те же проверки, что и при открытии урока: enrollment + последовательная блокировка.
 * Возвращает null, если урок/видео нет, нет доступа или урок заблокирован.
 */
export async function getLessonStreamUrl(userId: string, lessonId: string): Promise<string | null> {
  const lesson = await q.getLessonWithContext(lessonId);
  if (!lesson || !lesson.videoUrl) return null;

  const course = lesson.module.course;
  const [hasAccess, orderedLessons, watchedIds] = await Promise.all([
    q.hasActiveEnrollment(userId, course.id),
    q.listCourseLessonIds(course.id),
    q.listWatchedLessonIdsForCourse(userId, course.id),
  ]);
  if (!hasAccess) return null;

  const orderedIds = orderedLessons.map((l) => l.id);
  const { lockedById } = computeUnlocks(orderedIds, new Set(watchedIds), course.isStrictOrder);
  if (lockedById[lessonId]) return null;

  try {
    return await (await getVideoProvider()).getSignedStreamUrl(lesson.videoUrl, userId);
  } catch {
    return null; // деградация вместо краха (ARCHITECTURE.md §6)
  }
}

export interface FileDownload {
  body: ReadableStream<Uint8Array>;
  contentType: string;
  filename: string;
}

/**
 * Скачивание вложения через наш сервер с проверкой доступа (ТЗ §6А.7).
 * Файл проксируется из Bunny Storage (по AccessKey, server-side) — публичного URL нет.
 * Возвращает null, если файла нет, нет enrollment или не выполнен гейт (просмотр + ДЗ).
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

  // Гейт доступа к конспекту (ТЗ §3.3): просмотр видео + отправка ДЗ. Проверка на сервере,
  // не только в UI — иначе прямой запрос к /api/files обошёл бы блокировку.
  const progress = await q.getProgress(userId, lessonId);
  const unlocked = await areFilesUnlocked(
    userId,
    lessonId,
    file.lesson.requiresNote,
    Boolean(progress?.videoWatchedAt),
  );
  if (!unlocked) return null;

  const fetched = await (await getFileProvider()).fetchFile(file.fileUrl);
  if (!fetched.ok || !fetched.body) return null;
  return {
    body: fetched.body,
    contentType: fetched.contentType ?? file.fileType,
    filename: file.title,
  };
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
