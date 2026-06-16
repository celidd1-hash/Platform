'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { requireAdmin } from './guard';
import { courseSchema, moduleSchema, lessonSchema, saveCourse, saveModule, saveLesson } from './course-edit';

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
  });
  if (!parsed.success) return { status: 'error', message: 'Проверьте название модуля' };

  const res = await saveModule(admin.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };
  revalidatePath(`/admin/courses/${parsed.data.courseId}`);
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
    lessonSummaryMd: formData.get('lessonSummaryMd') || undefined,
    contentMd: formData.get('contentMd') || undefined,
    videoUrl: formData.get('videoUrl') || undefined,
    requiresNote: formData.get('requiresNote') === 'on',
    minNoteLength: formData.get('minNoteLength') || undefined,
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
  return { status: 'ok', message: 'Урок сохранён' };
}
