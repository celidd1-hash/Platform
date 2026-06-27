import { computeProgressPct, computeUnlocks } from '@/lib/progress';
import { HOMEWORK } from '@/config/constants';
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
  durationMinutes: number | null;
  completed: boolean;
  locked: boolean;
}

export interface CoursePageModule {
  id: string;
  title: string;
  position: number;
  resultText: string | null;
  durationMinutes: number | null;
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

  const bypassHomework = HOMEWORK.BYPASS_EMAILS.length > 0
    ? HOMEWORK.BYPASS_EMAILS.includes((await q.getUserEmail(userId)) ?? '')
    : false;
  const [hasAccess, completedIds, advancedIds] = await Promise.all([
    q.hasActiveEnrollment(userId, course.id),
    q.listCompletedLessonIdsForCourse(userId, course.id),
    q.listAdvancedLessonIdsForCourse(userId, course.id, bypassHomework),
  ]);
  const completed = new Set(completedIds);
  const advanced = new Set(advancedIds);

  // Плоский порядок уроков курс→модуль→урок. Следующий урок открывает зачтённое ДЗ
  // (урок без ДЗ — завершение по кнопке); «продолжить» — по завершению урока.
  const orderedLessonIds = course.modules.flatMap((m) => m.lessons.map((l) => l.id));
  const { lockedById, continueLessonId } = computeUnlocks(
    orderedLessonIds,
    advanced,
    course.isStrictOrder,
    completed,
  );

  const modules: CoursePageModule[] = course.modules.map((m) => ({
    id: m.id,
    title: m.title,
    position: m.position,
    resultText: m.resultText,
    durationMinutes: m.durationMinutes,
    lessons: m.lessons.map((l) => ({
      id: l.id,
      title: l.title,
      position: l.position,
      durationMinutes: l.durationMinutes,
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

export interface ModulePageData {
  courseTitle: string;
  courseSlug: string;
  moduleId: string;
  moduleTitle: string;
  modulePosition: number;
  resultText: string | null;
  durationMinutes: number | null;
  hasAccess: boolean;
  lessonsTotal: number;
  lessonsDone: number;
  progressPct: number;
  lessons: CoursePageLesson[];
}

/**
 * Данные страницы отдельного модуля: уроки модуля + прогресс по модулю.
 * Блокировки считаются по всему курсу (последовательное открытие), потом
 * выбирается нужный модуль. Возвращает null, если курс/модуль не найдены.
 */
export async function getModulePage(
  slug: string,
  moduleId: string,
  userId: string,
): Promise<ModulePageData | null> {
  const page = await getCoursePage(slug, userId);
  if (!page) return null;

  const mod = page.modules.find((m) => m.id === moduleId);
  if (!mod) return null;

  const lessonsTotal = mod.lessons.length;
  const lessonsDone = mod.lessons.filter((l) => l.completed).length;

  return {
    courseTitle: page.title,
    courseSlug: page.slug,
    moduleId: mod.id,
    moduleTitle: mod.title,
    modulePosition: mod.position,
    resultText: mod.resultText,
    durationMinutes: mod.durationMinutes,
    hasAccess: page.hasAccess,
    lessonsTotal,
    lessonsDone,
    progressPct: computeProgressPct(lessonsTotal, lessonsDone),
    lessons: mod.lessons,
  };
}
