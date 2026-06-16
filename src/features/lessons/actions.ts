'use server';

import { z } from 'zod';
import { auth } from '@/features/auth';
import { fail, type ActionResult } from '@/lib/utils';
import { saveVideoPosition, markVideoWatched, type WatchResult } from './service';

/**
 * Server actions фичи lessons (ARCHITECTURE.md §2,§6).
 * Каждое действие проверяет аутентификацию и валидирует вход Zod.
 */

const positionSchema = z.object({
  lessonId: z.string().min(1),
  seconds: z.number().int().min(0).max(60 * 60 * 24),
});

export async function saveProgressAction(
  lessonId: string,
  seconds: number,
): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');
  const parsed = positionSchema.safeParse({ lessonId, seconds });
  if (!parsed.success) return fail('Некорректные данные');
  return saveVideoPosition(session.user.id, parsed.data.lessonId, parsed.data.seconds);
}

export async function markWatchedAction(lessonId: string): Promise<ActionResult<WatchResult>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');
  if (typeof lessonId !== 'string' || !lessonId) return fail('Некорректный урок');
  return markVideoWatched(session.user.id, lessonId);
}
