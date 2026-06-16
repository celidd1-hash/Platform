'use server';

import { revalidatePath } from 'next/cache';
import { auth } from '@/features/auth';
import { ok, fail, type ActionResult } from '@/lib/utils';
import * as q from './queries';

/**
 * Server action: скрыть/показать себя в публичном рейтинге (ТЗ §3.5).
 */
export async function setRatingVisibilityAction(
  isPublic: boolean,
): Promise<ActionResult<{ isPublic: boolean }>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');
  await q.setRatingVisibility(session.user.id, isPublic);
  revalidatePath('/rating');
  return ok({ isPublic });
}
