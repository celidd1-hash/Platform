import { DEFAULT_NOTIFY_PREFS, NOTIFY_TYPES, type NotifyType } from '@/config/constants';

/**
 * Чистая логика настроек Telegram-уведомлений (ТЗ §3.9): какие типы слать, тихие часы.
 * Без БД — покрыта тестами.
 */

export interface NotifyPrefs {
  enabled: boolean;
  homework: boolean;
  lessons: boolean;
  achievements: boolean;
  rating: boolean;
  motivation: boolean;
  quietFrom: number | null;
  quietTo: number | null;
}

const TYPE_TO_KEY: Record<NotifyType, keyof NotifyPrefs> = {
  [NOTIFY_TYPES.HOMEWORK_RESULT]: 'homework',
  [NOTIFY_TYPES.NEW_LESSON]: 'lessons',
  [NOTIFY_TYPES.ACHIEVEMENT]: 'achievements',
  [NOTIFY_TYPES.RATING]: 'rating',
  [NOTIFY_TYPES.MOTIVATION]: 'motivation',
};

/** Слить пользовательские настройки (JSON из БД) с дефолтными. */
export function parseNotifyPrefs(raw: unknown): NotifyPrefs {
  const base = { ...DEFAULT_NOTIFY_PREFS };
  if (raw && typeof raw === 'object') {
    const r = raw as Record<string, unknown>;
    for (const key of Object.keys(base) as Array<keyof NotifyPrefs>) {
      const v = r[key];
      if (key === 'quietFrom' || key === 'quietTo') {
        if (typeof v === 'number' || v === null) (base[key] as number | null) = v;
      } else if (typeof v === 'boolean') {
        (base[key] as boolean) = v;
      }
    }
  }
  return base;
}

/** Попадает ли час в интервал тихих часов (поддерживает переход через полночь). */
export function isQuietHour(prefs: NotifyPrefs, hour: number): boolean {
  const { quietFrom, quietTo } = prefs;
  if (quietFrom === null || quietTo === null) return false;
  if (quietFrom === quietTo) return false;
  if (quietFrom < quietTo) return hour >= quietFrom && hour < quietTo;
  // через полночь: напр. 22→7
  return hour >= quietFrom || hour < quietTo;
}

/** Разрешена ли отправка уведомления данного типа сейчас. */
export function isNotifyAllowed(prefs: NotifyPrefs, type: NotifyType, hour: number): boolean {
  if (!prefs.enabled) return false;
  if (isQuietHour(prefs, hour)) return false;
  const key = TYPE_TO_KEY[type];
  return prefs[key] === true;
}
