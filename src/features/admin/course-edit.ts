import { randomUUID } from 'node:crypto';
import { z } from 'zod';
import { ok, fail, slugify, type ActionResult } from '@/lib/utils';
import { getFileProvider } from '@/lib/providers/file';
import { UPLOAD } from '@/config/constants';
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
  resultText: z.string().trim().max(1000).optional(),
  durationMinutes: z.coerce.number().int().min(0).max(100_000).optional(),
});

export const lessonSchema = z.object({
  id: z.string().optional(),
  moduleId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  position: z.coerce.number().int().min(0).max(999).optional(),
  contentMd: z.string().trim().max(50_000).optional(),
  videoUrl: z.string().trim().max(500).optional(),
  materialsUrl: z.string().trim().url('Некорректная ссылка на материалы').max(1000).optional(),
  requiresNote: z.boolean().default(true),
  minNoteLength: z.coerce.number().int().min(0).max(10_000).optional(),
  durationMinutes: z.coerce.number().int().min(0).max(100_000).optional(),
  durationSeconds: z.coerce.number().int().min(0).max(59).optional(),
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
  const resultText = input.resultText?.trim() || null;
  const durationMinutes = input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : null;

  if (input.id) {
    // Позицию трогаем только если её явно передали — иначе переименование сбросило бы порядок.
    await q.updateModule(input.id, {
      title: input.title,
      resultText,
      durationMinutes,
      ...(input.position !== undefined ? { position: input.position } : {}),
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
    contentMd: input.contentMd?.trim() || null,
    videoUrl: input.videoUrl?.trim() || null,
    materialsUrl: input.materialsUrl?.trim() || null,
    requiresNote: input.requiresNote,
    minNoteLength: input.minNoteLength && input.minNoteLength > 0 ? input.minNoteLength : null,
    durationMinutes: input.durationMinutes && input.durationMinutes > 0 ? input.durationMinutes : null,
    durationSeconds: input.durationSeconds && input.durationSeconds > 0 ? input.durationSeconds : null,
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

// ── Конспекты (файлы-вложения урока) ──

const EXT_BY_MIME: Record<string, string> = {
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
  'application/vnd.openxmlformats-officedocument.presentationml.presentation': '.pptx',
  'image/png': '.png',
  'image/jpeg': '.jpg',
  'image/webp': '.webp',
};

export interface UploadInput {
  name: string;
  type: string;
  size: number;
  bytes: Uint8Array;
}

/** Загрузить конспект к уроку: валидация типа/размера → Bunny Storage → запись LessonFile. */
export async function addLessonFile(
  adminId: string,
  lessonId: string,
  file: UploadInput,
): Promise<ActionResult<{ id: string }>> {
  if (!(await q.lessonExists(lessonId))) return fail('Урок не найден');

  const isDoc = (UPLOAD.ALLOWED_DOC_MIME as readonly string[]).includes(file.type);
  const isImage = (UPLOAD.ALLOWED_IMAGE_MIME as readonly string[]).includes(file.type);
  if (!isDoc && !isImage) {
    return fail('Недопустимый тип. Разрешено: PDF, DOCX, PPTX, PNG, JPEG, WEBP.');
  }
  if (file.size <= 0) return fail('Файл пустой');
  const maxBytes = isImage ? UPLOAD.MAX_IMAGE_SIZE_BYTES : UPLOAD.MAX_LESSON_FILE_BYTES;
  if (file.size > maxBytes) {
    return fail(`Файл больше лимита (${Math.round(maxBytes / 1024 / 1024)} МБ).`);
  }

  const ext = EXT_BY_MIME[file.type] ?? '';
  const storagePath = `lessons/${lessonId}/${randomUUID()}${ext}`;
  const uploaded = await (await getFileProvider()).uploadFile(storagePath, file.bytes, file.type);
  if (!uploaded.ok) return fail('Не удалось загрузить файл (проверьте ключи Bunny Storage).');

  const title = file.name.trim().slice(0, 200) || `Материал${ext}`;
  const position = await q.nextFilePosition(lessonId);
  const created = await q.createLessonFile({
    lessonId,
    title,
    fileUrl: storagePath,
    fileType: file.type,
    sizeBytes: file.size,
    position,
  });
  await writeAuditLog({ actorId: adminId, action: 'lesson_file_add', targetType: 'lesson', targetId: lessonId });
  return ok({ id: created.id });
}

/** Удалить конспект: запись из БД + best-effort очистка хранилища. Возвращает lessonId для revalidate. */
export async function removeLessonFile(
  adminId: string,
  fileId: string,
): Promise<ActionResult<{ lessonId: string }>> {
  const file = await q.getLessonFile(fileId);
  if (!file) return fail('Файл не найден');
  await (await getFileProvider()).deleteFile(file.fileUrl).catch(() => undefined);
  await q.deleteLessonFile(fileId);
  await writeAuditLog({ actorId: adminId, action: 'lesson_file_delete', targetType: 'lesson', targetId: file.lessonId });
  return ok({ lessonId: file.lessonId });
}
