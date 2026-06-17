import { getSecretMeta, setSecret, deleteSecret, MANAGED_KEYS, type ManagedKey } from '@/lib/secrets';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { writeAuditLog } from './queries';

/**
 * Сервис страницы «Интеграции» админки (ТЗ §3.7, §6А.5).
 * Ключи задаются в платформе, хранятся зашифрованно в БД, провайдеры читают БД→env.
 */

export interface IntegrationField {
  key: ManagedKey;
  label: string;
  group: string;
  secret: boolean; // true → значение маскируется и не показывается
  placeholder?: string;
}

/** Описание полей интеграций (группировка для UI). */
export const INTEGRATION_FIELDS: IntegrationField[] = [
  { key: 'ANTHROPIC_API_KEY', label: 'API-ключ Claude', group: 'Anthropic (проверка ДЗ, наставник)', secret: true, placeholder: 'sk-ant-...' },
  { key: 'ANTHROPIC_MODEL', label: 'Модель', group: 'Anthropic (проверка ДЗ, наставник)', secret: false, placeholder: 'claude-haiku-4-5-20251001' },

  { key: 'BUNNY_LIBRARY_ID', label: 'Library ID', group: 'Bunny (видео)', secret: false },
  { key: 'BUNNY_CDN_HOSTNAME', label: 'CDN Hostname', group: 'Bunny (видео)', secret: false, placeholder: 'vz-xxxxxxxx-xxx.b-cdn.net' },
  { key: 'BUNNY_API_KEY', label: 'API-ключ библиотеки', group: 'Bunny (видео)', secret: true },
  { key: 'BUNNY_TOKEN_AUTH_KEY', label: 'Token Authentication Key', group: 'Bunny (видео)', secret: true },
  { key: 'BUNNY_STORAGE_ZONE', label: 'Storage Zone', group: 'Bunny (файлы)', secret: false },
  { key: 'BUNNY_STORAGE_PASSWORD', label: 'Storage Password', group: 'Bunny (файлы)', secret: true },

  { key: 'RESEND_API_KEY', label: 'API-ключ Resend', group: 'Email (Resend)', secret: true, placeholder: 're_...' },
  { key: 'EMAIL_FROM', label: 'Адрес отправителя', group: 'Email (Resend)', secret: false, placeholder: 'noreply@домен' },

  { key: 'TELEGRAM_BOT_TOKEN', label: 'Bot Token', group: 'Telegram', secret: true },
  { key: 'TELEGRAM_WEBHOOK_SECRET', label: 'Webhook Secret', group: 'Telegram', secret: true },
  { key: 'TELEGRAM_BOT_USERNAME', label: 'Username бота (без @)', group: 'Telegram', secret: false },
];

export interface IntegrationView extends IntegrationField {
  source: 'db' | 'env' | 'none';
  masked: string | null;
}

export async function getIntegrations(): Promise<IntegrationView[]> {
  return Promise.all(
    INTEGRATION_FIELDS.map(async (f) => {
      const meta = await getSecretMeta(f.key);
      return { ...f, source: meta.source, masked: meta.masked };
    }),
  );
}

function isManaged(key: string): key is ManagedKey {
  return (MANAGED_KEYS as readonly string[]).includes(key);
}

export async function saveIntegration(
  adminId: string,
  key: string,
  value: string,
): Promise<ActionResult<null>> {
  if (!isManaged(key)) return fail('Неизвестный ключ');
  const trimmed = value.trim();
  if (!trimmed) return fail('Пустое значение');
  // Ключи/настройки — только печатаемый ASCII. Ловим «кривые» символы из Word/заметок
  // (напр. типографское тире «—» вместо дефиса), которые ломают HTTP-заголовки.
  if (/[^\x20-\x7E]/.test(trimmed)) {
    return fail(
      'Значение содержит недопустимый символ (возможно, «—» вместо «-» из Word). ' +
        'Скопируйте ключ заново прямо из консоли сервиса.',
    );
  }
  await setSecret(key, trimmed);
  // В аудит пишем только факт изменения ключа, без значения (ТЗ §6А.9).
  await writeAuditLog({ actorId: adminId, action: 'integration_set', targetType: 'setting', targetId: key });
  return ok(null);
}

export async function removeIntegration(adminId: string, key: string): Promise<ActionResult<null>> {
  if (!isManaged(key)) return fail('Неизвестный ключ');
  await deleteSecret(key);
  await writeAuditLog({ actorId: adminId, action: 'integration_clear', targetType: 'setting', targetId: key });
  return ok(null);
}
