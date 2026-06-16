'use server';

import { z } from 'zod';
import { revalidatePath } from 'next/cache';
import { auth } from '@/features/auth';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { generateLinkCode, disconnect, savePrefs, type ConnectInfo } from './service';

/** Server actions Telegram-интеграции (ТЗ §3.9). Каждое требует аутентификацию. */

export async function connectTelegramAction(): Promise<ActionResult<ConnectInfo>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');
  const info = await generateLinkCode(session.user.id);
  return ok(info);
}

export async function disconnectTelegramAction(): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');
  const res = await disconnect(session.user.id);
  if (res.ok) revalidatePath('/profile');
  return res;
}

const prefsSchema = z.object({
  enabled: z.boolean(),
  homework: z.boolean(),
  lessons: z.boolean(),
  achievements: z.boolean(),
  rating: z.boolean(),
  motivation: z.boolean(),
  quietFrom: z.number().int().min(0).max(23).nullable(),
  quietTo: z.number().int().min(0).max(23).nullable(),
});

export async function saveNotifyPrefsAction(prefs: unknown): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');
  const parsed = prefsSchema.safeParse(prefs);
  if (!parsed.success) return fail('Некорректные настройки');
  const res = await savePrefs(session.user.id, parsed.data);
  if (res.ok) revalidatePath('/profile');
  return res;
}
