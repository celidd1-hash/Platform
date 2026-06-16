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

export function listKnowledge(courseId: string) {
  return db.aiKnowledge.findMany({
    where: { courseId },
    orderBy: { createdAt: 'asc' },
    select: { id: true, title: true, contentMd: true, lessonId: true, createdAt: true },
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

export function createKnowledge(data: { courseId: string; title: string; contentMd: string }) {
  return db.aiKnowledge.create({ data });
}

export function deleteKnowledge(id: string) {
  return db.aiKnowledge.delete({ where: { id } });
}

export function knowledgeBelongsToCourse(id: string) {
  return db.aiKnowledge.findUnique({ where: { id }, select: { courseId: true } });
}
