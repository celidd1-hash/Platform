import { getSecret } from '@/lib/secrets';

/**
 * Абстракция оповещений (ARCHITECTURE.md §5). Сегодня внутри — Telegram Bot API.
 * В сообщениях боту НЕ передаются секреты; привязка хранится как telegram_chat_id (ТЗ §3.9).
 */
export interface Notifier {
  /** Отправить текстовое сообщение в привязанный чат участника. */
  send(chatId: string, text: string): Promise<{ ok: boolean }>;
}

class TelegramNotifier implements Notifier {
  constructor(private readonly botToken: string) {}

  async send(chatId: string, text: string): Promise<{ ok: boolean }> {
    const res = await fetch(`https://api.telegram.org/bot${this.botToken}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: 'HTML' }),
    });
    return { ok: res.ok };
  }
}

/** Заглушка для каркаса/тестов — ничего не отправляет, но не падает. */
class NullNotifier implements Notifier {
  async send(): Promise<{ ok: boolean }> {
    return { ok: false };
  }
}

export async function getNotifier(): Promise<Notifier> {
  const token = await getSecret('TELEGRAM_BOT_TOKEN');
  return token ? new TelegramNotifier(token) : new NullNotifier();
}

/**
 * Диагностика бота для админки: getMe (валиден ли токен) + getWebhookInfo (стоит ли webhook).
 * Токен не логируется и не возвращается.
 */
export async function testNotifier(): Promise<{ ok: boolean; detail: string }> {
  const token = await getSecret('TELEGRAM_BOT_TOKEN');
  if (!token) return { ok: false, detail: 'TELEGRAM_BOT_TOKEN не задан' };
  try {
    const meRes = await fetch(`https://api.telegram.org/bot${token}/getMe`);
    const me = await meRes.json();
    if (!me?.ok) return { ok: false, detail: `Неверный токен: ${me?.description ?? 'getMe не прошёл'}` };

    const whRes = await fetch(`https://api.telegram.org/bot${token}/getWebhookInfo`);
    const wh = await whRes.json();
    const url: string = wh?.result?.url || '';
    const lastErr: string | undefined = wh?.result?.last_error_message;
    const username = me.result?.username ? `@${me.result.username}` : (me.result?.first_name ?? 'бот');

    if (!url) {
      return { ok: false, detail: `Бот ${username} на связи, но webhook НЕ установлен (выполни setWebhook).` };
    }
    if (lastErr) {
      return { ok: false, detail: `Бот ${username}: webhook ${url}, но последняя ошибка: ${lastErr}` };
    }
    return { ok: true, detail: `Бот ${username} на связи. Webhook активен: ${url}` };
  } catch {
    return { ok: false, detail: 'Не удалось связаться с Telegram API' };
  }
}
