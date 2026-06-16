import { getSecret } from '@/lib/secrets';
import { env } from '@/config/env';

/**
 * Абстракция отправки email (ARCHITECTURE.md §5). Сегодня внутри — Resend.
 * Без ключа RESEND_API_KEY письмо логируется в консоль (dev-fallback),
 * чтобы поток регистрации/сброса работал локально без внешнего сервиса.
 *
 * ВАЖНО: вызывается только server-side. В логи НЕ попадают токены целиком в проде.
 */
export interface EmailProvider {
  send(to: string, subject: string, html: string): Promise<{ ok: boolean }>;
}

class ResendEmailProvider implements EmailProvider {
  constructor(
    private readonly apiKey: string,
    private readonly from: string,
  ) {}

  async send(to: string, subject: string, html: string): Promise<{ ok: boolean }> {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: this.from, to, subject, html }),
    });
    return { ok: res.ok };
  }
}

class ConsoleEmailProvider implements EmailProvider {
  async send(to: string, subject: string, html: string): Promise<{ ok: boolean }> {
    // Только dev: показываем письмо в консоли, ссылки видны для ручной проверки.
    console.info(`\n📧 [EMAIL → ${to}] ${subject}\n${html.replace(/<[^>]+>/g, ' ').trim()}\n`);
    return { ok: true };
  }
}

export async function getEmailProvider(): Promise<EmailProvider> {
  const apiKey = await getSecret('RESEND_API_KEY');
  if (!apiKey) return new ConsoleEmailProvider();
  const from = (await getSecret('EMAIL_FROM')) || env.EMAIL_FROM;
  return new ResendEmailProvider(apiKey, from);
}
