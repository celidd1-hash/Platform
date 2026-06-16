'use server';

import { revalidatePath } from 'next/cache';
import { fail, type ActionResult } from '@/lib/utils';
import { requireAdmin } from './guard';
import { archiveSchema, targetSchema } from './schema';
import { setArchived, hardDelete, getImpact, type ImpactSummary } from './service';
import type { SetArchivedResult, DeleteResult } from './types';

/**
 * Server actions админки (ARCHITECTURE.md §2,§6). КАЖДОЕ действие проверяет роль admin
 * на сервере (ТЗ §6А.3, Дополнение №1 §5) — не полагаемся на скрытие кнопок в UI.
 */

export async function archiveAction(
  target: string,
  id: string,
  archived: boolean,
): Promise<ActionResult<SetArchivedResult>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');

  const parsed = archiveSchema.safeParse({ target, id, archived });
  if (!parsed.success) return fail('Некорректные данные');

  const res = await setArchived(admin.id, parsed.data.target, parsed.data.id, parsed.data.archived);
  if (res.ok) revalidatePath('/admin');
  return res.ok ? { ok: true, data: { archived: parsed.data.archived } } : res;
}

export async function impactAction(
  target: string,
  id: string,
): Promise<ActionResult<ImpactSummary>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');

  const parsed = targetSchema.safeParse({ target, id });
  if (!parsed.success) return fail('Некорректные данные');
  return getImpact(parsed.data.target, parsed.data.id);
}

export async function deleteForeverAction(
  target: string,
  id: string,
): Promise<ActionResult<DeleteResult>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');

  const parsed = targetSchema.safeParse({ target, id });
  if (!parsed.success) return fail('Некорректные данные');

  const res = await hardDelete(admin.id, parsed.data.target, parsed.data.id);
  if (res.ok) revalidatePath('/admin');
  return res;
}
