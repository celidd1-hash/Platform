'use server';

import { revalidatePath } from 'next/cache';
import { fail, type ActionResult } from '@/lib/utils';
import { gradeHomeworkManually, trashHomework } from '@/features/homework';
import { requireAdmin } from './guard';
import { writeAuditLog } from './queries';

/** Server actions ручной проверки ДЗ куратором (ТЗ §3.7). Только admin/curator. */

export async function gradeHomeworkAction(
  homeworkId: string,
  verdict: 'passed' | 'needs_work',
  comment: string,
): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  if (typeof homeworkId !== 'string' || !homeworkId) return fail('Некорректные данные');
  if (verdict !== 'passed' && verdict !== 'needs_work') return fail('Некорректный вердикт');

  const res = await gradeHomeworkManually(homeworkId, verdict, comment?.trim() || null);
  if (res.ok) {
    await writeAuditLog({ actorId: admin.id, action: 'homework_grade', targetType: 'homework', targetId: homeworkId, meta: { verdict } });
    revalidatePath('/admin/homework');
  }
  return res;
}

export async function trashHomeworkAction(homeworkId: string): Promise<ActionResult<null>> {
  const admin = await requireAdmin();
  if (!admin) return fail('Доступ только для администратора');
  if (typeof homeworkId !== 'string' || !homeworkId) return fail('Некорректные данные');

  const res = await trashHomework(homeworkId);
  if (res.ok) {
    await writeAuditLog({ actorId: admin.id, action: 'homework_trash', targetType: 'homework', targetId: homeworkId });
    revalidatePath('/admin/homework');
  }
  return res;
}
