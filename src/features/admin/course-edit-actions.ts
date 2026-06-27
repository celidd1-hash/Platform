'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { fail, type ActionResult } from '@/lib/utils';
import { requireAdmin } from './guard';
import {
  courseSchema,
  moduleSchema,
  lessonSchema,
  saveCourse,
  saveModule,
  saveLesson,
  addLessonFile,
  removeLessonFile,
} from './course-edit';

/** Server actions CRUD структуры курсов (ТЗ §3.7). Каждое проверяет роль admin. */

export type EditState = { status: 'idle' | 'ok' | 'error'; message?: string };

export async function saveCourseAction(_prev: EditState, formData: FormData): Promise<EditState> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'error', message: 'Доступ только для администратора' };

  const parsed = courseSchema.safeParse({
    id: formData.get('id') || undefined,
    title: formData.get('title'),
    description: formData.get('description'),
    durationWeeks: formData.get('durationWeeks') || undefined,
    isStrictOrder: formData.get('isStrictOrder') === 'on',
    isPublished: formData.get('isPublished') === 'on',
  });
  if (!parsed.success) return { status: 'error', message: 'Проверьте поля курса' };

  const res = await saveCourse(admin.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };

  if (!parsed.data.id) redirect(`/admin/courses/${res.data.id}`);
  revalidatePath(`/admin/courses/${res.data.id}`);
  return { status: 'ok', message: 'Курс сохранён' };
}

export async function saveModuleAction(_prev: EditState, formData: FormData): Promise<EditState> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'error', message: 'Доступ только для администратора' };

  const parsed = moduleSchema.safeParse({
    id: formData.get('id') || undefined,
    courseId: formData.get('courseId'),
    title: formData.get('title'),
    position: formData.get('position') || undefined,
    resultText: formData.get('resultText') || undefined,
    durationMinutes: formData.get('durationMinutes') || undefined,
  });
  if (!parsed.success) return { status: 'error', message: 'Проверьте название модуля' };

  const res = await saveModule(admin.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
  revalidatePath('/admin/courses'); // обновить список курсов (добавление модуля прямо из списка)
  return { status: 'ok', message: 'Модуль сохранён' };
}

export async function saveLessonAction(_prev: EditState, formData: FormData): Promise<EditState> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'error', message: 'Доступ только для администратора' };

  const parsed = lessonSchema.safeParse({
    id: formData.get('id') || undefined,
    moduleId: formData.get('moduleId'),
    title: formData.get('title'),
    position: formData.get('position') || undefined,
    contentMd: formData.get('contentMd') || undefined,
    videoUrl: formData.get('videoUrl') || undefined,
    materialsUrl: formData.get('materialsUrl') || undefined,
    requiresNote: formData.get('requiresNote') === 'on',
    minNoteLength: formData.get('minNoteLength') || undefined,
    durationMinutes: formData.get('durationMinutes') || undefined,
    durationSeconds: formData.get('durationSeconds') || undefined,
    xpReward: formData.get('xpReward') || undefined,
  });
  if (!parsed.success) return { status: 'error', message: 'Проверьте поля урока' };

  const res = await saveLesson(admin.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };

  const isNew = !parsed.data.id;
  if (isNew) {
    // Возврат к редактору курса после создания урока.
    const lesson = formData.get('returnCourseId');
    if (typeof lesson === 'string' && lesson) redirect(`/admin/courses/${lesson}`);
  }
  revalidatePath(`/admin/lesson/${res.data.id}/edit`);
  revalidatePath('/admin/courses'); // обновить список курсов (добавление урока прямо из списка)
  return { status: 'ok', message: 'Урок сохранён' };
}

export async function uploadLessonFileAction(_prev: EditState, formData: FormData): Promise<EditState> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'error', message: 'Доступ только для администратора' };

  const lessonId = formData.get('lessonId');
  const file = formData.get('file');
  if (typeof lessonId !== 'string' || !lessonId) return { status: 'error', message: 'Урок не указан' };
  if (!(file instanceof File) || file.size === 0) return { status: 'error', message: 'Выберите файл' };

  const bytes = new Uint8Array(await file.arrayBuffer());
  const res = await addLessonFile(admin.id, lessonId, {
    name: file.name,
    type: file.type,
    size: file.size,
    bytes,
  });
  if (!res.ok) return { status: 'error', message: res.error };

  revalidatePath(`/admin/lesson/${lessonId}/edit`);
  return { status: 'ok', message: 'Конспект загружен' };
}

export async function deleteLessonFileAction(fileId: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  if (typeof fileId !== 'string' || !fileId) return fail('Некорректные данные');

  const res = await removeLessonFile(admin.id, fileId);
  if (!res.ok) return fail(res.error);
  revalidatePath(`/admin/lesson/${res.data.lessonId}/edit`);
  return { ok: true, data: null };
}
