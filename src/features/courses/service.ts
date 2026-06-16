import { computeProgressPct, computeUnlocks } from '@/lib/progress';
import * as q from './queries';

/**
 * Бизнес-логика каталога и страницы курса (ТЗ §3.2, §3.3).
 * Доступ к курсу — только при активном enrollment; контроль на сервере (ТЗ §6А.3).
 */

export type CatalogStatus = 'start' | 'continue' | 'locked';

export interface CatalogCourse {
  id: string;
  title: string;
  slug: string;
  description: string;
  coverUrl: string | null;
  durationWeeks: number | null;
  moduleCount: number;
  lessonCount: number;
  status: CatalogStatus;
  progressPct: number;
}

/** Каталог для конкретного ученика: статус доступа + прогресс по каждому курсу. */
export async function getCatalog(userId: string): Promise<CatalogCourse[]> {
  const [courses, enrolledIds, completedIds] = await Promise.all([
    q.listPublishedCourses(),
    q.listActiveEnrollmentCourseIds(userId),
    q.listCompletedLessonIds(userId),
  ]);
  const enrolled = new Set(enrolledIds);
  const completed = new Set(completedIds);

  return courses.map((c) => {
    const lessonIds = c.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const lessonCount = lessonIds.length;
    const isEnrolled = enrolled.has(c.id);
    const completedInCourse = isEnrolled
      ? lessonIds.filter((id) => completed.has(id)).length
      : 0;
    const progressPct = computeProgressPct(lessonCount, completedInCourse);

    let status: CatalogStatus;
    if (!isEnrolled) status = 'locked';
    else status = progressPct > 0 ? 'continue' : 'start';

    return {
      id: c.id,
      title: c.title,
      slug: c.slug,
      description: c.description,
      coverUrl: c.coverUrl,
      durationWeeks: c.durationWeeks,
      moduleCount: c.modules.length,
      lessonCount,
      status,
      progressPct,
    };
  });
}

export interface CoursePageLesson {
  id: string;
  title: string;
  position: number;
  completed: boolean;
  locked: boolean;
}

export interface CoursePageModule {
  id: string;
  title: string;
  position: number;
  lessons: CoursePageLesson[];
}

export interface CoursePageData {
  id: string;
  title: string;
  slug: string;
  description: string;
  durationWeeks: number | null;
  hasAccess: boolean;
  progressPct: number;
  continueLessonId: string | null;
  modules: CoursePageModule[];
}

/**
 * Данные страницы курса с учётом доступа и последовательного открытия.
 * Возвращает null, если курс не найден/не опубликован.
 */
export async function getCoursePage(slug: string, userId: string): Promise<CoursePageData | null> {
  const course = await q.getCourseBySlug(slug);
  if (!course) return null;

  const [hasAccess, completedIds] = await Promise.all([
    q.hasActiveEnrollment(userId, course.id),
    q.listCompletedLessonIdsForCourse(userId, course.id),
  ]);
  const completed = new Set(completedIds);

  // Плоский порядок уроков курс→модуль→урок для расчёта блокировок.
  const orderedLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const { lockedById, continueLessonId } = computeUnlocks(
    orderedLessonIds,
    completed,
    course.isStrictOrder,
  );

  const modules: CoursePageModule[] = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    position: m.position,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      position: l.position,
      completed: completed.has(l.id),
      // Без доступа всё закрыто; с доступом — по последовательному порядку.
      locked: !hasAccess || (lockedById[l.id] ?? false),
    })),
  }));

  return {
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    durationWeeks: course.durationWeeks,
    hasAccess,
    progressPct: computeProgressPct(orderedLessonIds.length, completed.size),
    continueLessonId: hasAccess ? continueLessonId : null,
    modules,
  };
}
