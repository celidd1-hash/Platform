import { db } from '@/lib/db';
import { EnrollmentStatus, LessonStatus } from '@prisma/client';

/**
 * Доступ к БД фичи courses (CLAUDE.md: Prisma только здесь).
 * Все выборки контента для учеников фильтруют архив/удаление (Дополнение №1).
 */

const liveCourse = { isPublished: true, isArchived: false, deletedAt: null };
const liveModule = { isArchived: false, deletedAt: null };
const liveLesson = { isArchived: false, deletedAt: null };

/** Опубликованные курсы каталога + счётчики модулей/уроков. */
export function listPublishedCourses() {
  return db.course.findMany({
    where: liveCourse,
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverUrl: true,
      durationWeeks: true,
      modules: {
        where: liveModule,
        select: { lessons: { where: liveLesson, select: { id: true } } },
      },
    },
  });
}

/** Активные доступы (enrollment) пользователя. */
export function listActiveEnrollmentCourseIds(userId: string) {
  return db.enrollment
    .findMany({
      where: { userId, status: EnrollmentStatus.active },
      select: { courseId: true },
    })
    .then((rows) => rows.map((r) => r.courseId));
}

/** Завершённые уроки пользователя (id) — для прогресса каталога. */
export function listCompletedLessonIds(userId: string) {
  return db.lessonProgress
    .findMany({
      where: { userId, status: LessonStatus.completed },
      select: { lessonId: true },
    })
    .then((rows) => rows.map((r) => r.lessonId));
}

/** Полный курс с модулями и уроками (для страницы курса). */
export function getCourseBySlug(slug: string) {
  return db.course.findFirst({
    where: { slug, ...liveCourse },
    select: {
      id: true,
      title: true,
      slug: true,
      description: true,
      coverUrl: true,
      durationWeeks: true,
      isStrictOrder: true,
      modules: {
        where: liveModule,
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          position: true,
          lessons: {
            where: liveLesson,
            orderBy: { position: 'asc' },
            select: { id: true, title: true, position: true },
          },
        },
      },
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

export function listCompletedLessonIdsForCourse(userId: string, courseId: string) {
  return db.lessonProgress
    .findMany({
      where: { userId, status: LessonStatus.completed, lesson: { module: { courseId } } },
      select: { lessonId: true },
    })
    .then((rows) => rows.map((r) => r.lessonId));
}
