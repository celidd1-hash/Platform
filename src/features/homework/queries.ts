import { db } from '@/lib/db';
import { EnrollmentStatus, HomeworkVerdict } from '@prisma/client';
import { type HomeworkVerdict as VerdictStr } from '@/config/constants';

/**
 * Доступ к БД фичи homework (CLAUDE.md: Prisma только здесь).
 */

/** Урок с контекстом для проверки ДЗ: курс, требование, мин. длина. */
export function getLessonForCheck(lessonId: string) {
  return db.lesson.findFirst({
    where: { id: lessonId, isArchived: false, deletedAt: null },
    select: {
      id: true,
      title: true,
      requiresNote: true,
      minNoteLength: true,
      module: { select: { id: true, course: { select: { id: true } } } },
    },
  });
}

export function hasActiveEnrollment(userId: string, courseId: string) {
  return db.enrollment
    .findFirst({
      where: { userId, courseId, status: EnrollmentStatus.active },
      select: { id: true },
    })
    .then(Boolean);
}

/** База знаний для проверки: общая по курсу (moduleId = null) + база модуля урока (ТЗ §3.4). */
export function getKnowledgeBase(courseId: string, moduleId: string) {
  return db.aiKnowledge.findMany({
    where: { courseId, OR: [{ moduleId: null }, { moduleId }] },
    orderBy: { createdAt: 'asc' },
    select: { title: true, contentMd: true },
  });
}

export function getAiSettings(courseId: string) {
  return db.aiSettings.findUnique({
    where: { courseId },
    select: { passScore: true, strictness: true, promptTemplate: true },
  });
}

export function countAttempts(userId: string, lessonId: string) {
  return db.homework.count({ where: { userId, lessonId } });
}

export function getHomeworkHistory(userId: string, lessonId: string) {
  return db.homework.findMany({
    where: { userId, lessonId },
    orderBy: { createdAt: 'desc' },
    select: { id: true, text: true, verdict: true, score: true, feedback: true, attemptNo: true, createdAt: true },
  });
}

export function getLatestHomework(userId: string, lessonId: string) {
  return db.homework.findFirst({
    where: { userId, lessonId },
    orderBy: { createdAt: 'desc' },
    select: { verdict: true, score: true, feedback: true, attemptNo: true },
  });
}

export function createHomework(data: {
  userId: string;
  lessonId: string;
  text: string;
  verdict: VerdictStr;
  score: number | null;
  feedback: string | null;
  attemptNo: number;
}) {
  return db.homework.create({
    data: { ...data, verdict: data.verdict as HomeworkVerdict },
  });
}

/** ДЗ с контекстом для ручной оценки куратором (получатель, урок). */
export function getHomeworkForGrade(homeworkId: string) {
  return db.homework.findUnique({
    where: { id: homeworkId },
    select: { id: true, userId: true, lessonId: true, lesson: { select: { title: true } } },
  });
}

/** Ручная установка вердикта и комментария куратора. */
export function setHomeworkVerdict(
  homeworkId: string,
  verdict: VerdictStr,
  feedback: string | null,
) {
  return db.homework.update({
    where: { id: homeworkId },
    data: { verdict: verdict as HomeworkVerdict, feedback },
  });
}

/** Переместить ДЗ в корзину / вернуть (мягкое удаление). */
export function setHomeworkDeleted(homeworkId: string, deleted: boolean) {
  return db.homework.update({
    where: { id: homeworkId },
    data: { deletedAt: deleted ? new Date() : null },
  });
}

/** Засчитать урок (видео просмотрено + ДЗ зачтено / временно при fallback). */
export function completeLesson(userId: string, lessonId: string) {
  const now = new Date();
  return db.lessonProgress.upsert({
    where: { userId_lessonId: { userId, lessonId } },
    update: { status: 'completed', completedAt: now },
    create: { userId, lessonId, status: 'completed', videoWatchedAt: now, completedAt: now },
  });
}
