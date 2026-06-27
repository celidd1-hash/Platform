import { db } from '@/lib/db';
import { EnrollmentStatus, LessonStatus } from '@prisma/client';
import { type LessonStatus as LessonStatusStr } from '@/config/constants';

/**
 * Доступ к БД фичи lessons (CLAUDE.md: Prisma только здесь).
 */

const liveLesson = { isArchived: false, deletedAt: null };

/** Урок с контекстом: модуль, курс, файлы-вложения. */
export function getLessonWithContext(lessonId: string) {
  return db.lesson.findFirst({
    where: { id: lessonId, ...liveLesson, module: { isArchived: false, deletedAt: null } },
    select: {
      id: true,
      title: true,
      contentMd: true,
      lessonSummaryMd: true,
      videoUrl: true,
      materialsUrl: true,
      requiresNote: true,
      minNoteLength: true,
      module: {
        select: {
          id: true,
          title: true,
          position: true,
          course: {
            select: { id: true, title: true, slug: true, isStrictOrder: true },
          },
        },
      },
      files: {
        orderBy: { position: 'asc' },
        select: { id: true, title: true, fileType: true, sizeBytes: true },
      },
    },
  });
}

/** Все уроки курса в порядке курс→модуль→урок (для навигации и блокировок). */
export function listCourseLessonIds(courseId: string) {
  return db.lesson
    .findMany({
      where: { ...liveLesson, module: { courseId, isArchived: false, deletedAt: null } },
      orderBy: [{ module: { position: 'asc' } }, { position: 'asc' }],
      select: { id: true, title: true },
    });
}

/** Id живых уроков модуля по порядку — для нумерации «урок X из Y» внутри модуля. */
export function listModuleLessonIds(moduleId: string): Promise<string[]> {
  return db.lesson
    .findMany({
      where: { moduleId, ...liveLesson },
      orderBy: { position: 'asc' },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));
}

export function hasActiveEnrollment(userId: string, courseId: string) {
  return db.enrollment
    .findFirst({
      where: { userId, courseId, status: EnrollmentStatus.active },
      select: { id: true },
    })
    .then(Boolean);
}

export function listCompletedLessonIdsForCourse(userId: string, courseId: string) {
  return db.lessonProgress
    .findMany({
      where: { userId, status: LessonStatus.completed, lesson: { module: { courseId } } },
      select: { lessonId: true },
    })
    .then((rows) => rows.map((r) => r.lessonId));
}

/**
 * Уроки курса, открывающие следующий: просмотренные на ≥80% (videoWatchedAt задан)
 * ИЛИ уже завершённые (на случай, когда урок засчитан через ДЗ-fallback без отметки видео).
 */
export function listWatchedLessonIdsForCourse(userId: string, courseId: string) {
  return db.lessonProgress
    .findMany({
      where: {
        userId,
        lesson: { module: { courseId } },
        OR: [{ videoWatchedAt: { not: null } }, { status: LessonStatus.completed }],
      },
      select: { lessonId: true },
    })
    .then((rows) => rows.map((r) => r.lessonId));
}

/**
 * Уроки курса, ОТКРЫВАЮЩИЕ следующий (gate перехода):
 * — урок с ДЗ открывает следующий, когда ДЗ зачтено (verdict=passed);
 * — урок без ДЗ — когда завершён по кнопке «Завершить урок» (status=completed).
 */
export async function listAdvancedLessonIdsForCourse(
  userId: string,
  courseId: string,
  bypassHomework = false,
): Promise<string[]> {
  const [passed, completedNoHw] = await Promise.all([
    db.homework.findMany({
      where: { userId, verdict: 'passed', lesson: { module: { courseId } } },
      select: { lessonId: true },
    }),
    db.lessonProgress.findMany({
      where: {
        userId,
        status: LessonStatus.completed,
        // При обходе ДЗ следующий открывает любой завершённый урок (по кнопке), а не только без ДЗ.
        lesson: { ...(bypassHomework ? {} : { requiresNote: false }), module: { courseId } },
      },
      select: { lessonId: true },
    }),
  ]);
  const ids = new Set<string>();
  for (const h of passed) ids.add(h.lessonId);
  for (const p of completedNoHw) ids.add(p.lessonId);
  return [...ids];
}

/** Email ученика (нижний регистр) — для проверки обхода ДЗ (HOMEWORK.BYPASS_EMAILS). */
export function getUserEmail(userId: string): Promise<string | null> {
  return db.user
    .findUnique({ where: { id: userId }, select: { email: true } })
    .then((u) => u?.email.toLowerCase() ?? null);
}

/** Зачтено ли ДЗ урока (verdict=passed) — для показа блока ДЗ и гейта перехода. */
export function hasPassedHomework(userId: string, lessonId: string): Promise<boolean> {
  return db.homework
    .findFirst({ where: { userId, lessonId, verdict: 'passed' }, select: { id: true } })
    .then(Boolean);
}

/** Файл-вложение с курсом его урока — для проверки доступа на скачивание. */
export function getFileWithCourse(lessonId: string, fileId: string) {
  return db.lessonFile.findFirst({
    where: { id: fileId, lessonId },
    select: {
      id: true,
      title: true,
      fileUrl: true,
      fileType: true,
      lesson: { select: { requiresNote: true, module: { select: { courseId: true } } } },
    },
  });
}

export function getProgress(userId: string, lessonId: string) {
  return db.lessonProgress.findUnique({
    where: { userId_lessonId: { userId, lessonId } },
    select: { status: true, videoPosition: true, videoWatchedAt: true },
  });
}

/** Создать/обновить прогресс урока (idempotent upsert). */
export function upsertProgress(
  userId: string,
  lessonId: string,
  data: {
    status?: LessonStatusStr;
    videoPosition?: number;
    videoWatchedAt?: Date | null;
    completedAt?: Date | null;
  },
) {
  const status = data.status as LessonStatus | undefined;
  return db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { ...data, status },
    create: {
      userId,
      lessonId,
      status: status ?? LessonStatus.in_progress,
      videoPosition: data.videoPosition ?? 0,
      videoWatchedAt: data.videoWatchedAt ?? null,
      completedAt: data.completedAt ?? null,
    },
  });
}
