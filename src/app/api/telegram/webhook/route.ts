import { NextResponse } from 'next/server';
import { env } from '@/config/env';
import { handleWebhookUpdate } from '@/features/telegram';

/**
 * Вебхук Telegram (ТЗ §3.9). Защита от подделки: сверяем секрет из заголовка
 * X-Telegram-Bot-Api-Secret-Token с TELEGRAM_WEBHOOK_SECRET. Тонкий роут (ARCHITECTURE.md §2).
 */
export async function POST(req: Request) {
  if (env.TELEGRAM_WEBHOOK_SECRET) {
    const secret = req.headers.get('x-telegram-bot-api-secret-token');
    if (secret !== env.TELEGRAM_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'forbidden' }, { status: 403 });
    }
  }

  let update: unknown;
  try {
    update = await req.json();
  } catch {
    return NextResponse.json({ ok: false }, { status: 400 });
  }

  try {
    await handleWebhookUpdate(update);
  } catch {
    // Telegram повторяет доставку при не-200; здесь глушим ошибку обработки,
    // чтобы не зациклить ретраи (детали — в логах сервера).
  }
  return NextResponse.json({ ok: true });
}
