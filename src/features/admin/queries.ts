import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/**
 * Доступ к БД админ-фичи (CLAUDE.md: Prisma только здесь).
 * Здесь видны И архивные сущности (в отличие от ученических выборок).
 */

// ── Дерево курсов (включая архив) ──

export function listCoursesAdmin() {
  return db.course.findMany({
    orderBy: { createdAt: 'asc' },
    select: {
      id: true,
      title: true,
      slug: true,
      isPublished: true,
      isArchived: true,
      deletedAt: true,
      modules: {
        orderBy: { position: 'asc' },
        select: {
          id: true,
          title: true,
          position: true,
          isArchived: true,
          lessons: {
            orderBy: { position: 'asc' },
            select: { id: true, title: true, position: true, isArchived: true },
          },
        },
      },
      _count: { select: { enrollments: true } },
    },
  });
}

// ── Архивирование / восстановление (мягкое удаление) ──

export function setCourseArchived(courseId: string, archived: boolean) {
  return db.course.update({ where: { id: courseId }, data: { isArchived: archived } });
}

export function setModuleArchived(moduleId: string, archived: boolean) {
  return db.module.update({ where: { id: moduleId }, data: { isArchived: archived } });
}

export function setLessonArchived(lessonId: string, archived: boolean) {
  return db.lesson.update({ where: { id: lessonId }, data: { isArchived: archived } });
}

// ── Охват затрагиваемых данных (для подтверждения полного удаления) ──

export async function getCourseImpact(courseId: string) {
  const [students, homework, files, lessons] = await Promise.all([
    db.enrollment.count({ where: { courseId } }),
    db.homework.count({ where: { lesson: { module: { courseId } } } }),
    db.lessonFile.count({ where: { lesson: { module: { courseId } } } }),
    db.lesson.count({ where: { module: { courseId } } }),
  ]);
  return { students, homework, files, lessons };
}

export async function getLessonImpact(lessonId: string) {
  const [homework, files] = await Promise.all([
    db.homework.count({ where: { lessonId } }),
    db.lessonFile.count({ where: { lessonId } }),
  ]);
  return { homework, files };
}

// ── Сбор ассетов для очистки хранилища при полном удалении ──

export async function getCourseAssets(courseId: string) {
  const lessons = await db.lesson.findMany({
    where: { module: { courseId } },
    select: { videoUrl: true, files: { select: { fileUrl: true } } },
  });
  return collectAssets(lessons);
}

export async function getModuleAssets(moduleId: string) {
  const lessons = await db.lesson.findMany({
    where: { moduleId },
    select: { videoUrl: true, files: { select: { fileUrl: true } } },
  });
  return collectAssets(lessons);
}

export async function getLessonAssets(lessonId: string) {
  const lesson = await db.lesson.findUnique({
    where: { id: lessonId },
    select: { videoUrl: true, files: { select: { fileUrl: true } } },
  });
  return collectAssets(lesson ? [lesson] : []);
}

function collectAssets(
  lessons: Array<{ videoUrl: string | null; files: Array<{ fileUrl: string }> }>,
) {
  const videoIds: string[] = [];
  const fileUrls: string[] = [];
  for (const l of lessons) {
    if (l.videoUrl) videoIds.push(l.videoUrl);
    for (const f of l.files) fileUrls.push(f.fileUrl);
  }
  return { videoIds, fileUrls };
}

// ── Полное (необратимое) удаление. Каскад — через onDelete: Cascade в схеме. ──

export function deleteCourse(courseId: string) {
  return db.course.delete({ where: { id: courseId } });
}

export function deleteModule(moduleId: string) {
  return db.module.delete({ where: { id: moduleId } });
}

export function deleteLesson(lessonId: string) {
  return db.lesson.delete({ where: { id: lessonId } });
}

// Существование цели (для понятных ошибок)
export function courseExists(courseId: string) {
  return db.course.findUnique({ where: { id: courseId }, select: { id: true, title: true } });
}

export function moduleExists(moduleId: string) {
  return db.module.findUnique({ where: { id: moduleId }, select: { id: true, title: true } });
}

export function lessonExists(lessonId: string) {
  return db.lesson.findUnique({ where: { id: lessonId }, select: { id: true, title: true } });
}

// ── Аудит (ТЗ §6А.9, Дополнение №1 §4) ──

export function writeAuditLog(data: {
  actorId: string;
  action: string;
  targetType: string;
  targetId: string;
  meta?: Prisma.InputJsonValue;
}) {
  return db.auditLog.create({ data });
}
