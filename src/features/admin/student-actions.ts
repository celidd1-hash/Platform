'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { fail, type ActionResult } from '@/lib/utils';
import { requireAdmin } from './guard';
import { grantAccess, revokeAccess, setBlocked } from './students';

/** Server actions кабинетов учеников (ТЗ §3.7). Каждое проверяет роль admin на сервере. */

const grantSchema = z.object({ userId: z.string().min(1), courseId: z.string().min(1) });

export async function grantAccessAction(userId: string, courseId: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  const parsed = grantSchema.safeParse({ userId, courseId });
  if (!parsed.success) return fail('Некорректные данные');
  const res = await grantAccess(admin.id, parsed.data.userId, parsed.data.courseId);
  if (res.ok) revalidatePath(`/admin/students/${userId}`);
  return res;
}

export async function revokeAccessAction(userId: string, courseId: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  const parsed = grantSchema.safeParse({ userId, courseId });
  if (!parsed.success) return fail('Некорректные данные');
  const res = await revokeAccess(admin.id, parsed.data.userId, parsed.data.courseId);
  if (res.ok) revalidatePath(`/admin/students/${userId}`);
  return res;
}

export async function setBlockedAction(
  userId: string,
  blocked: boolean,
): Promise<ActionResult<{ blocked: boolean }>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  if (typeof userId !== 'string' || !userId) return fail('Некорректные данные');
  const res = await setBlocked(admin.id, userId, blocked);
  if (res.ok) {
    revalidatePath(`/admin/students/${userId}`);
    revalidatePath('/admin/students');
  }
  return res;
}
