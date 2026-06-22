'use server';

import { revalidatePath } from 'next/cache';
import { fail, type ActionResult } from '@/lib/utils';
import { requireAdmin } from './guard';
import { settingsSchema, knowledgeSchema, saveSettings, addKnowledge, removeKnowledge } from './ai-training';

/** Server actions «Обучение ИИ-агента» (ТЗ §3.4). Каждое проверяет роль admin. */

export type AiFormState = { status: 'idle' | 'ok' | 'error'; message?: string };

export async function saveSettingsAction(_prev: AiFormState, formData: FormData): Promise<AiFormState> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'error', message: 'Доступ только для администратора' };
  const parsed = settingsSchema.safeParse({
    courseId: formData.get('courseId'),
    passScore: formData.get('passScore'),
    strictness: formData.get('strictness'),
    promptTemplate: formData.get('promptTemplate') ?? undefined,
  });
  if (!parsed.success) return { status: 'error', message: 'Проверьте значения параметров' };
  const res = await saveSettings(admin.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };
  revalidatePath('/admin/ai');
  return { status: 'ok', message: 'Параметры сохранены' };
}

export async function addKnowledgeAction(_prev: AiFormState, formData: FormData): Promise<AiFormState> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'error', message: 'Доступ только для администратора' };
  const parsed = knowledgeSchema.safeParse({
    courseId: formData.get('courseId'),
    moduleId: formData.get('moduleId') || undefined,
    title: formData.get('title'),
    contentMd: formData.get('contentMd'),
  });
  if (!parsed.success) return { status: 'error', message: 'Заполните заголовок и текст' };
  const res = await addKnowledge(admin.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };
  revalidatePath('/admin/ai');
  return { status: 'ok', message: 'Материал добавлен в базу знаний' };
}

export async function removeKnowledgeAction(id: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  const res = await removeKnowledge(admin.id, id);
  if (res.ok) revalidatePath('/admin/ai');
  return res;
}
