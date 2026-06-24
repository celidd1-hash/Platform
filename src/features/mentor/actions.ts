'use server';

import { z } from 'zod';
import { auth } from '@/features/auth';
import { getAiProvider, type ChatMessage } from '@/lib/providers/ai';
import { rateLimit } from '@/lib/rate-limit';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { RATE_LIMITS } from '@/config/constants';
import { buildMentorContext } from './service';

/**
 * Server action чата с ИИ-наставником (ТЗ §3). Auth + rate-limit + fallback.
 * История передаётся как данные; вызовы Claude — только на сервере (ТЗ §6А.5).
 */

const messageSchema = z.object({ role: z.enum(['user', 'assistant']), content: z.string().min(1).max(4000) });
const chatSchema = z.array(messageSchema).min(1).max(40);

export async function sendMentorMessageAction(
  history: ChatMessage[],
): Promise<ActionResult<string>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');

  const parsed = chatSchema.safeParse(history);
  if (!parsed.success) return fail('Некорректное сообщение');

  const limited = rateLimit(`mentor:${session.user.id}`, RATE_LIMITS.HOMEWORK_PER_MINUTE, 60_000);
  if (!limited.allowed) return fail('Слишком часто. Подождите немного.');

  const provider = await getAiProvider();
  if (!provider) {
    return ok('AI-Наставник временно недоступен. Попробуйте позже или загляните в Центр знаний.');
  }

  try {
    // Контекст из курсов ученика: база знаний + промт куратора (ТЗ §3, §6А.3).
    const context = await buildMentorContext(session.user.id);
    const reply = await provider.chat(parsed.data, context);
    return ok(reply || 'Не удалось сформировать ответ. Попробуйте переформулировать вопрос.');
  } catch {
    return fail('Наставник сейчас недоступен. Попробуйте позже.');
  }
}
