'use server';

import { revalidatePath } from 'next/cache';
import { fail, type ActionResult } from '@/lib/utils';
import { requireAdmin } from './guard';
import { achievementSchema, saveAchievement, removeAchievement } from './achievements-admin';

/** Server actions CRUD достижений (ТЗ §3.5). Только admin. */

export type AchievementFormState = { status: 'idle' | 'ok' | 'error'; message?: string };

export async function saveAchievementAction(
  _prev: AchievementFormState,
  formData: FormData,
): Promise<AchievementFormState> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'error', message: 'Доступ только для администратора' };

  const parsed = achievementSchema.safeParse({
    id: formData.get('id') || undefined,
    courseId: formData.get('courseId') || undefined,
    title: formData.get('title'),
    description: formData.get('description'),
    icon: formData.get('icon') || undefined,
    category: formData.get('category') || undefined,
    rarity: formData.get('rarity'),
    xpReward: formData.get('xpReward'),
    conditionType: formData.get('conditionType'),
    threshold: formData.get('threshold'),
  });
  if (!parsed.success) return { status: 'error', message: 'Проверьте поля формы' };

  const res = await saveAchievement(admin.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };
  revalidatePath('/admin/achievements');
  return { status: 'ok', message: 'Сохранено' };
}

export async function deleteAchievementAction(id: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  const res = await removeAchievement(admin.id, id);
  if (res.ok) revalidatePath('/admin/achievements');
  return res;
}
