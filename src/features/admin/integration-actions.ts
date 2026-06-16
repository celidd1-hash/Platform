'use server';

import { revalidatePath } from 'next/cache';
import { fail, type ActionResult } from '@/lib/utils';
import { requireAdmin } from './guard';
import { saveIntegration, removeIntegration } from './integrations';

/** Server actions страницы «Интеграции» (ТЗ §3.7). Только admin; значения не логируются. */

export async function saveIntegrationAction(key: string, value: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  const res = await saveIntegration(admin.id, key, value);
  if (res.ok) revalidatePath('/admin/settings');
  return res;
}

export async function clearIntegrationAction(key: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  const res = await removeIntegration(admin.id, key);
  if (res.ok) revalidatePath('/admin/settings');
  return res;
}
