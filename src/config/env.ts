import { z } from 'zod';

/**
 * Валидация переменных окружения при старте (ARCHITECTURE.md §7).
 * Если ключа нет или он кривой — приложение падает СРАЗУ с понятной ошибкой,
 * а не «работает странно» в проде.
 *
 * ВАЖНО (ТЗ §6А.5): серверные секреты НЕ имеют префикса NEXT_PUBLIC_.
 * Этот модуль НЕ импортируется в клиентские компоненты — только server-side.
 */

const serverSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // База данных
  DATABASE_URL: z.string().url(),

  // Auth.js / NextAuth
  AUTH_SECRET: z.string().min(16, 'AUTH_SECRET слишком короткий (нужно ≥16 символов)'),
  NEXTAUTH_URL: z.string().url().optional(),

  // Anthropic (Claude) — проверка ДЗ. Опционально: при отсутствии работает fallback (ТЗ §3.4).
  ANTHROPIC_API_KEY: z.string().optional(),
  ANTHROPIC_MODEL: z.string().default('claude-haiku-4-5-20251001'),

  // Bunny Stream / Storage — видео и файлы. Опционально на этапе каркаса.
  BUNNY_API_KEY: z.string().optional(),
  BUNNY_LIBRARY_ID: z.string().optional(),
  BUNNY_TOKEN_AUTH_KEY: z.string().optional(),
  BUNNY_STORAGE_ZONE: z.string().optional(),
  BUNNY_STORAGE_PASSWORD: z.string().optional(),

  // Email (Resend)
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().email().default('noreply@svetozar.school'),

  // Telegram
  TELEGRAM_BOT_TOKEN: z.string().optional(),
  TELEGRAM_WEBHOOK_SECRET: z.string().optional(),
  // Username бота (без @) — для построения диплинка привязки t.me/<bot>?start=<code>.
  TELEGRAM_BOT_USERNAME: z.string().optional(),

  // Мониторинг
  SENTRY_DSN: z.string().optional(),
});

const publicSchema = z.object({
  // Может быть не задан — тогда выводим из домена Vercel (см. resolveAppUrl).
  NEXT_PUBLIC_APP_URL: z.string().url().optional(),
});

/**
 * Базовый URL приложения. Приоритет: явный NEXT_PUBLIC_APP_URL → прод-домен Vercel
 * (VERCEL_PROJECT_PRODUCTION_URL, проставляется Vercel автоматически) → localhost.
 * Так на Vercel ничего вписывать руками не нужно.
 */
function resolveAppUrl(explicit: string | undefined): string {
  if (explicit) return explicit;
  const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
  if (vercel) return `https://${vercel}`;
  return 'http://localhost:3000';
}

function formatErrors(error: z.ZodError): string {
  return error.issues.map((i) => `  • ${i.path.join('.')}: ${i.message}`).join('\n');
}

function parseEnv() {
  const parsedServer = serverSchema.safeParse(process.env);
  const parsedPublic = publicSchema.safeParse(process.env);

  if (!parsedServer.success || !parsedPublic.success) {
    const messages: string[] = [];
    if (!parsedServer.success) messages.push(formatErrors(parsedServer.error));
    if (!parsedPublic.success) messages.push(formatErrors(parsedPublic.error));
    throw new Error(
      `❌ Невалидные переменные окружения:\n${messages.join('\n')}\n` +
        `Скопируй env.example → .env.local и заполни значения.`,
    );
  }

  return {
    ...parsedServer.data,
    ...parsedPublic.data,
    NEXT_PUBLIC_APP_URL: resolveAppUrl(parsedPublic.data.NEXT_PUBLIC_APP_URL),
  };
}

export const env = parseEnv();

export type Env = typeof env;
