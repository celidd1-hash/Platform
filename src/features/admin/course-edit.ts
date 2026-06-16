import { z } from 'zod';
import { ok, fail, slugify, type ActionResult } from '@/lib/utils';
import { writeAuditLog } from './queries';
import * as q from './queries/course-edit';

/**
 * Сервис CRUD структуры курсов (ТЗ §3.7): создание/редактирование курсов, модулей, уроков
 * без участия разработчика. Вызывается после проверки роли admin.
 */

export const courseSchema = z.object({
  id: z.string().optional(),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(2).max(2000),
  durationWeeks: z.coerce.number().int().min(0).max(104).optional(),
  isStrictOrder: z.boolean().default(true),
  isPublished: z.boolean().default(false),
});

export const moduleSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  position: z.coerce.number().int().min(0).max(999).optional(),
});

export const lessonSchema = z.object({
  id: z.string().optional(),
  moduleId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  position: z.coerce.number().int().min(0).max(999).optional(),
  lessonSummaryMd: z.string().trim().max(2000).optional(),
  contentMd: z.string().trim().max(50_000).optional(),
  videoUrl: z.string().trim().max(500).optional(),
  requiresNote: z.boolean().default(true),
  minNoteLength: z.coerce.number().int().min(0).max(10_000).optional(),
  xpReward: z.coerce.number().int().min(0).max(10_000).default(50),
});

// ── Курс ──

export async function saveCourse(
  adminId: string,
  input: z.infer<typeof courseSchema>,
): Promise<ActionResult<{ id: string }>> {
  const durationWeeks = input.durationWeeks && input.durationWeeks > 0 ? input.durationWeeks : null;

  if (input.id) {
    await q.updateCourse(input.id, {
      title: input.title,
      description: input.description,
      durationWeeks,
      isStrictOrder: input.isStrictOrder,
      isPublished: input.isPublished,
    });
    await writeAuditLog({ actorId: adminId, action: 'course_update', targetType: 'course', targetId: input.id });
    return ok({ id: input.id });
  }

  let slug = slugify(input.title) || `course-${Date.now()}`;
  if (await q.slugTaken(slug)) slug = `${slug}-${Date.now()}`;
  const created = await q.createCourse({
    title: input.title,
    slug,
    description: input.description,
    durationWeeks,
    isStrictOrder: input.isStrictOrder,
    isPublished: input.isPublished,
  });
  await writeAuditLog({ actorId: adminId, action: 'course_create', targetType: 'course', targetId: created.id });
  return ok({ id: created.id });
}

export async function getCourseEditor(courseId: string) {
  return q.getCourseForEdit(courseId);
}

// ── Модуль ──

export async function saveModule(
  adminId: string,
  input: z.infer<typeof moduleSchema>,
): Promise<ActionResult<{ id: string }>> {
  if (input.id) {
    await q.updateModule(input.id, {
      title: input.title,
      position: input.position ?? 0,
    });
    await writeAuditLog({ actorId: adminId, action: 'module_update', targetType: 'module', targetId: input.id });
    return ok({ id: input.id });
  }
  const position = input.position ?? (await q.nextModulePosition(input.courseId));
  const created = await q.createModule(input.courseId, input.title, position);
  await writeAuditLog({ actorId: adminId, action: 'module_create', targetType: 'module', targetId: created.id });
  return ok({ id: created.id });
}

// ── Урок ──

export async function getLessonEditor(lessonId: string) {
  return q.getLessonForEdit(lessonId);
}

export async function saveLesson(
  adminId: string,
  input: z.infer<typeof lessonSchema>,
): Promise<ActionResult<{ id: string }>> {
  const data = {
    title: input.title,
    lessonSummaryMd: input.lessonSummaryMd?.trim() || null,
    contentMd: input.contentMd?.trim() || null,
    videoUrl: input.videoUrl?.trim() || null,
    requiresNote: input.requiresNote,
    minNoteLength: input.minNoteLength && input.minNoteLength > 0 ? input.minNoteLength : null,
    xpReward: input.xpReward,
  };

  if (input.id) {
    const exists = await q.lessonExists(input.id);
    if (!exists) return fail('Урок не найден');
    await q.updateLesson(input.id, { ...data, position: input.position ?? 0 });
    await writeAuditLog({ actorId: adminId, action: 'lesson_update', targetType: 'lesson', targetId: input.id });
    return ok({ id: input.id });
  }

  const position = input.position ?? (await q.nextLessonPosition(input.moduleId));
  const created = await q.createLesson(input.moduleId, { ...data, position });
  await writeAuditLog({ actorId: adminId, action: 'lesson_create', targetType: 'lesson', targetId: created.id });
  return ok({ id: created.id });
}
