import { randomBytes, createHash } from 'node:crypto';
import { getNotifier } from '@/lib/providers/notify';
import { parseNotifyPrefs, isNotifyAllowed, type NotifyPrefs } from '@/lib/notify-prefs';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { env } from '@/config/env';
import { TOKEN_TTL, NOTIFY_TYPES, type NotifyType } from '@/config/constants';
import * as q from './queries';

/**
 * Бизнес-логика Telegram-интеграции (ТЗ §3.9): привязка по одноразовому коду,
 * обработка вебхука, очередь оповещений с учётом настроек. В сообщениях нет секретов.
 */

const LINK_TYPE = 'telegram_link';

function hashCode(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

export interface ConnectInfo {
  code: string;
  deeplink: string | null;
}

/** Сгенерировать одноразовый код привязки и диплинк (ТЗ §3.9). */
export async function generateLinkCode(userId: string): Promise<ConnectInfo> {
  await q.deleteUserLinkTokens(userId);
  const code = randomBytes(6).toString('hex');
  await q.createLinkToken(userId, hashCode(code), new Date(Date.now() + TOKEN_TTL.TELEGRAM_LINK_MS));
  const deeplink = env.TELEGRAM_BOT_USERNAME
    ? `https://t.me/${env.TELEGRAM_BOT_USERNAME}?start=${code}`
    : null;
  return { code, deeplink };
}

export async function disconnect(userId: string): Promise<ActionResult<null>> {
  await q.clearTelegram(userId);
  return ok(null);
}

export async function getPrefs(userId: string): Promise<{ connected: boolean; prefs: NotifyPrefs }> {
  const user = await q.getUserNotify(userId);
  return { connected: !!user?.telegramChatId, prefs: parseNotifyPrefs(user?.notifyPrefs) };
}

export async function savePrefs(userId: string, prefs: NotifyPrefs): Promise<ActionResult<null>> {
  await q.setNotifyPrefs(userId, prefs as unknown as Record<string, unknown>);
  return ok(null);
}

/**
 * Обработка апдейта вебхука: привязка по /start <code> и отвязка по /stop (ТЗ §3.9).
 * Возвращает текст ответа боту (или null).
 */
export async function handleWebhookUpdate(update: unknown): Promise<void> {
  const message = (update as { message?: { text?: string; chat?: { id?: number } } })?.message;
  const text = message?.text?.trim();
  const chatId = message?.chat?.id;
  if (!text || chatId === undefined) return;

  const notifier = getNotifier();

  if (text.startsWith('/start')) {
    const code = text.split(/\s+/)[1];
    if (!code) {
      await notifier.send(String(chatId), 'Откройте привязку в профиле платформы и перейдите по кнопке.');
      return;
    }
    const token = await q.findLinkToken(hashCode(code));
    if (!token || token.type !== LINK_TYPE || token.usedAt || token.expiresAt < new Date()) {
      await notifier.send(String(chatId), 'Код привязки недействителен или истёк. Сгенерируйте новый в профиле.');
      return;
    }
    await q.setTelegramChatId(token.userId, String(chatId));
    await q.markTokenUsed(token.id);
    await notifier.send(String(chatId), '✅ Telegram подключён! Будете получать результаты ДЗ и оповещения.');
    return;
  }

  if (text.startsWith('/stop')) {
    await notifier.send(String(chatId), 'Чтобы отключить оповещения, откройте профиль на платформе.');
    return;
  }
}

/**
 * Поставить в очередь и отправить оповещение в Telegram с учётом настроек (ТЗ §3.9).
 * Деградация: ошибка отправки не ломает основной поток — статус notification = failed.
 */
export async function notify(
  userId: string,
  type: NotifyType,
  text: string,
): Promise<void> {
  const user = await q.getUserNotify(userId);
  if (!user?.telegramChatId) return; // не привязан — нечего слать

  const prefs = parseNotifyPrefs(user.notifyPrefs);
  const hour = new Date().getHours();
  if (!isNotifyAllowed(prefs, type, hour)) return;

  const row = await q.createNotification({
    userId,
    type,
    payload: { text },
    channel: 'telegram',
    status: 'pending',
  });

  try {
    const res = await getNotifier().send(user.telegramChatId, text);
    await q.markNotification(row.id, res.ok ? 'sent' : 'failed', res.ok ? new Date() : null);
  } catch {
    await q.markNotification(row.id, 'failed', null);
  }
}

/** Оповещение о результате проверки ДЗ (ТЗ §3.9). */
export async function notifyHomeworkResult(
  userId: string,
  data: { verdict: string; score: number | null; lessonTitle: string; feedback: string | null },
): Promise<void> {
  const verdictText =
    data.verdict === 'passed' ? '✅ Зачтено' : data.verdict === 'needs_work' ? '↻ На доработку' : '⏳ На проверке';
  const lines = [
    `<b>Результат проверки ДЗ</b>`,
    `Урок: ${data.lessonTitle}`,
    `${verdictText}${data.score != null ? ` · ${data.score}/100` : ''}`,
  ];
  if (data.feedback) lines.push(`\n${data.feedback}`);
  await notify(userId, NOTIFY_TYPES.HOMEWORK_RESULT, lines.join('\n'));
}

export function fallbackInfo(): ActionResult<null> {
  return env.TELEGRAM_BOT_TOKEN ? ok(null) : fail('Бот не настроен');
}
