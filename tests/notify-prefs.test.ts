import { describe, it, expect } from 'vitest';
import { parseNotifyPrefs, isQuietHour, isNotifyAllowed } from '@/lib/notify-prefs';
import { NOTIFY_TYPES } from '@/config/constants';

describe('parseNotifyPrefs', () => {
  it('даёт дефолты при пустом вводе', () => {
    const p = parseNotifyPrefs(null);
    expect(p.enabled).toBe(true);
    expect(p.homework).toBe(true);
    expect(p.quietFrom).toBeNull();
  });

  it('переопределяет только валидные поля', () => {
    const p = parseNotifyPrefs({ homework: false, quietFrom: 22, quietTo: 7, bogus: 1 });
    expect(p.homework).toBe(false);
    expect(p.lessons).toBe(true);
    expect(p.quietFrom).toBe(22);
  });
});

describe('isQuietHour (ТЗ §3.9)', () => {
  const base = parseNotifyPrefs(null);
  it('нет тихих часов без настройки', () => {
    expect(isQuietHour(base, 3)).toBe(false);
  });
  it('интервал в пределах суток', () => {
    const p = parseNotifyPrefs({ quietFrom: 1, quietTo: 6 });
    expect(isQuietHour(p, 3)).toBe(true);
    expect(isQuietHour(p, 8)).toBe(false);
  });
  it('интервал через полночь', () => {
    const p = parseNotifyPrefs({ quietFrom: 22, quietTo: 7 });
    expect(isQuietHour(p, 23)).toBe(true);
    expect(isQuietHour(p, 5)).toBe(true);
    expect(isQuietHour(p, 12)).toBe(false);
  });
});

describe('isNotifyAllowed (ТЗ §3.9)', () => {
  it('блокирует всё при enabled=false', () => {
    const p = parseNotifyPrefs({ enabled: false });
    expect(isNotifyAllowed(p, NOTIFY_TYPES.HOMEWORK_RESULT, 12)).toBe(false);
  });
  it('блокирует выключенный тип', () => {
    const p = parseNotifyPrefs({ homework: false });
    expect(isNotifyAllowed(p, NOTIFY_TYPES.HOMEWORK_RESULT, 12)).toBe(false);
  });
  it('блокирует в тихие часы', () => {
    const p = parseNotifyPrefs({ quietFrom: 22, quietTo: 7 });
    expect(isNotifyAllowed(p, NOTIFY_TYPES.HOMEWORK_RESULT, 23)).toBe(false);
  });
  it('разрешает включённый тип вне тихих часов', () => {
    const p = parseNotifyPrefs(null);
    expect(isNotifyAllowed(p, NOTIFY_TYPES.HOMEWORK_RESULT, 12)).toBe(true);
  });
});
