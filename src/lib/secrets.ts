import { db } from '@/lib/db';
import { encryptSecret, decryptSecret } from '@/lib/crypto';

/**
 * Резолвер секретов/настроек интеграций (ТЗ §6А.5).
 * Приоритет: значение из БД (app_settings, зашифровано) → переменная окружения.
 * Так ключи можно задавать прямо в админке, а env остаётся надёжным fallback.
 *
 * Доступ к БД здесь — к таблице app_settings через singleton `db` (инфраструктурный
 * слой, как сам lib/db). @prisma/client не импортируется, граница линтера соблюдена.
 */

const TTL_MS = 30_000;
const cache = new Map<string, { value: string | undefined; expires: number }>();

/** Список ключей, которыми можно управлять из админки (allowlist). */
export const MANAGED_KEYS = [
  'ANTHROPIC_API_KEY',
  'ANTHROPIC_MODEL',
  'BUNNY_API_KEY',
  'BUNNY_LIBRARY_ID',
  'BUNNY_TOKEN_AUTH_KEY',
  'BUNNY_CDN_HOSTNAME',
  'BUNNY_STORAGE_ZONE',
  'BUNNY_STORAGE_PASSWORD',
  'RESEND_API_KEY',
  'EMAIL_FROM',
  'TELEGRAM_BOT_TOKEN',
  'TELEGRAM_WEBHOOK_SECRET',
  'TELEGRAM_BOT_USERNAME',
] as const;
export type ManagedKey = (typeof MANAGED_KEYS)[number];

async function readFromDb(key: string): Promise<string | undefined> {
  try {
    const row = await db.appSetting.findUnique({ where: { key }, select: { value: true } });
    return row ? decryptSecret(row.value) : undefined;
  } catch {
    // Таблицы может не быть до миграции, или сбой расшифровки — деградируем на env.
    return undefined;
  }
}

/** Значение настройки: БД → env. Кэшируется на TTL для производительности провайдеров. */
export async function getSecret(key: string): Promise<string | undefined> {
  const now = Date.now();
  const hit = cache.get(key);
  if (hit && hit.expires > now) return hit.value;

  const fromDb = await readFromDb(key);
  const value = fromDb ?? process.env[key] ?? undefined;
  cache.set(key, { value, expires: now + TTL_MS });
  return value;
}

/** Сохранить значение в БД (зашифровано). Сбрасывает кэш ключа. */
export async function setSecret(key: string, plain: string): Promise<void> {
  const value = encryptSecret(plain);
  await db.appSetting.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });
  cache.delete(key);
}

/** Удалить значение из БД (вернуться к env). */
export async function deleteSecret(key: string): Promise<void> {
  await db.appSetting.deleteMany({ where: { key } });
  cache.delete(key);
}

export interface SecretMeta {
  source: 'db' | 'env' | 'none';
  masked: string | null;
}

function mask(v: string): string {
  if (v.length <= 4) return '••••';
  return `••••${v.slice(-4)}`;
}

/** Метаданные для админки: откуда значение и маскированный предпросмотр (без раскрытия). */
export async function getSecretMeta(key: string): Promise<SecretMeta> {
  const fromDb = await readFromDb(key);
  if (fromDb) return { source: 'db', masked: mask(fromDb) };
  const fromEnv = process.env[key];
  if (fromEnv) return { source: 'env', masked: mask(fromEnv) };
  return { source: 'none', masked: null };
}
