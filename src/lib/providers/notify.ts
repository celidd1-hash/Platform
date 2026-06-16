import { env } from '@/config/env';

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

let instance: Notifier | null = null;

export function getNotifier(): Notifier {
  if (instance) return instance;
  instance = env.TELEGRAM_BOT_TOKEN
    ? new TelegramNotifier(env.TELEGRAM_BOT_TOKEN)
    : new NullNotifier();
  return instance;
}
