'use server';

import { auth } from '@/features/auth';
import { submitHomeworkSchema } from './schema';
import { submitHomework, type SubmitResult } from './service';

/**
 * Server action отправки ДЗ (ARCHITECTURE.md §2,§6). Auth + Zod-валидация → service.
 * Совместимо с useActionState.
 */
export type HomeworkState = {
  status: 'idle' | 'submitted' | 'error';
  result?: SubmitResult;
  error?: string;
};

export async function submitHomeworkAction(
  _prev: HomeworkState,
  formData: FormData,
): Promise<HomeworkState> {
  const session = await auth();
  if (!session?.user?.id) return { status: 'error', error: 'Не авторизован' };

  const parsed = submitHomeworkSchema.safeParse({
    lessonId: formData.get('lessonId'),
    text: formData.get('text'),
  });
  if (!parsed.success) {
    return { status: 'error', error: parsed.error.issues[0]?.message ?? 'Некорректные данные' };
  }

  const res = await submitHomework(session.user.id, parsed.data.lessonId, parsed.data.text);
  if (!res.ok) return { status: 'error', error: res.error };
  return { status: 'submitted', result: res.data };
}
