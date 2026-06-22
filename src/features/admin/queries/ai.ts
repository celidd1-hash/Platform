import { db } from '@/lib/db';

/**
 * Доступ к БД для обучения ИИ-агента (ТЗ §3.4). Prisma в queries/ — разрешено линтером.
 */

export function listCourses() {
  return db.course.findMany({
    where: { deletedAt: null },
    orderBy: { title: 'asc' },
    select: { id: true, title: true },
  });
}

export function getCourse(courseId: string) {
  return db.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } });
}

/** Модули курса (живые) — для выбора привязки записи базы знаний. */
export function listModules(courseId: string) {
  return db.module.findMany({
    where: { courseId, isArchived: false, deletedAt: null },
    orderBy: { position: 'asc' },
    select: { id: true, title: true },
  });
}

export function listKnowledge(courseId: string) {
  return db.aiKnowledge.findMany({
    where: { courseId },
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      contentMd: true,
      moduleId: true,
      module: { select: { title: true } },
      createdAt: true,
    },
  });
}

export function getSettings(courseId: string) {
  return db.aiSettings.findUnique({
    where: { courseId },
    select: { passScore: true, strictness: true, promptTemplate: true },
  });
}

export function upsertSettings(
  courseId: string,
  data: { passScore: number; strictness: string; promptTemplate: string | null },
) {
  return db.aiSettings.upsert({
    where: { courseId },
    update: data,
    create: { courseId, ...data },
  });
}

export function createKnowledge(data: {
  courseId: string;
  moduleId: string | null;
  title: string;
  contentMd: string;
}) {
  return db.aiKnowledge.create({ data });
}

export function deleteKnowledge(id: string) {
  return db.aiKnowledge.delete({ where: { id } });
}

export function knowledgeBelongsToCourse(id: string) {
  return db.aiKnowledge.findUnique({ where: { id }, select: { courseId: true } });
}

/** Проверка, что модуль принадлежит курсу (защита привязки записи к чужому модулю). */
export function moduleBelongsToCourse(moduleId: string, courseId: string) {
  return db.module.findFirst({ where: { id: moduleId, courseId }, select: { id: true } });
}
