import { db } from '@/lib/db';

/** Доступ к БД для CRUD структуры курсов (ТЗ §3.7). Prisma в queries/ — разрешено линтером. */

export function createCourse(data: {
  title: string;
  slug: string;
  description: string;
  durationWeeks: number | null;
  isStrictOrder: boolean;
  isPublished: boolean;
}) {
  return db.course.create({
    data: { ...data, aiSettings: { create: { passScore: 70, strictness: 'normal' } } },
    select: { id: true },
  });
}

export function updateCourse(
  id: string,
  data: {
    title: string;
    description: string;
    durationWeeks: number | null;
    isStrictOrder: boolean;
    isPublished: boolean;
  },
) {
  return db.course.update({ where: { id }, data });
}

export function slugTaken(slug: string) {
  return db.course.findUnique({ where: { slug }, select: { id: true } });
}

export function getCourseForEdit(courseId: string) {
  return db.course.findUnique({
    where: { id: courseId },
    select: {
      id: true,
      title: true,
      description: true,
      durationWeeks: true,
      isStrictOrder: true,
      isPublished: true,
      isArchived: true,
      modules: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          position: true,
          isArchived: true,
          lessons: {
            orderBy: { position: 'asc' },
            select: { id: true, title: true, position: true, isArchived: true, requiresNote: true },
          },
        },
      },
    },
  });
}

export async function nextModulePosition(courseId: string) {
  const last = await db.module.findFirst({
    where: { courseId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return (last?.position ?? -1) + 1;
}

export async function nextLessonPosition(moduleId: string) {
  const last = await db.lesson.findFirst({
    where: { moduleId },
    orderBy: { position: 'desc' },
    select: { position: true },
  });
  return (last?.position ?? -1) + 1;
}

export function createModule(courseId: string, title: string, position: number) {
  return db.module.create({ data: { courseId, title, position }, select: { id: true } });
}

export function updateModule(id: string, data: { title: string; position: number }) {
  return db.module.update({ where: { id }, data });
}

export function moduleCourseId(moduleId: string) {
  return db.module.findUnique({ where: { id: moduleId }, select: { courseId: true } });
}

export function createLesson(
  moduleId: string,
  data: {
    title: string;
    position: number;
    contentMd: string | null;
    lessonSummaryMd: string | null;
    videoUrl: string | null;
    requiresNote: boolean;
    minNoteLength: number | null;
    xpReward: number;
  },
) {
  return db.lesson.create({ data: { moduleId, ...data }, select: { id: true } });
}

export function getLessonForEdit(lessonId: string) {
  return db.lesson.findUnique({
    where: { id: lessonId },
    select: {
      id: true,
      title: true,
      position: true,
      contentMd: true,
      lessonSummaryMd: true,
      videoUrl: true,
      requiresNote: true,
      minNoteLength: true,
      xpReward: true,
      module: { select: { id: true, title: true, course: { select: { id: true, title: true } } } },
    },
  });
}

export function updateLesson(
  id: string,
  data: {
    title: string;
    position: number;
    contentMd: string | null;
    lessonSummaryMd: string | null;
    videoUrl: string | null;
    requiresNote: boolean;
    minNoteLength: number | null;
    xpReward: number;
  },
) {
  return db.lesson.update({ where: { id }, data });
}

export function lessonExists(id: string) {
  return db.lesson.findUnique({ where: { id }, select: { id: true } });
}
