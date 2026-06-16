'use client';

import { useState, useTransition } from 'react';
import {
  connectTelegramAction,
  disconnectTelegramAction,
  saveNotifyPrefsAction,
} from '../actions';
import type { NotifyPrefs } from '@/lib/notify-prefs';
import type { ConnectInfo } from '../service';

const TYPES: Array<{ key: keyof NotifyPrefs; label: string }> = [
  { key: 'homework', label: 'Результаты проверки ДЗ' },
  { key: 'lessons', label: 'Новые уроки и модули' },
  { key: 'achievements', label: 'Новые достижения' },
  { key: 'rating', label: 'Изменения в рейтинге' },
  { key: 'motivation', label: 'Мотивационные сообщения' },
];

/** Секция Telegram в профиле (ТЗ §3.9): привязка по коду/диплинку + настройки уведомлений. */
export function TelegramSection({
  connected,
  prefs: initialPrefs,
}: {
  connected: boolean;
  prefs: NotifyPrefs;
}) {
  const [isConnected, setConnected] = useState(connected);
  const [connect, setConnect] = useState<ConnectInfo | null>(null);
  const [prefs, setPrefs] = useState<NotifyPrefs>(initialPrefs);
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);

  function onConnect() {
    start(async () => {
      const res = await connectTelegramAction();
      if (res.ok) setConnect(res.data);
    });
  }

  function onDisconnect() {
    start(async () => {
      const res = await disconnectTelegramAction();
      if (res.ok) {
        setConnected(false);
        setConnect(null);
      }
    });
  }

  function update<K extends keyof NotifyPrefs>(key: K, value: NotifyPrefs[K]) {
    const next = { ...prefs, [key]: value };
    setPrefs(next);
    setSaved(false);
    start(async () => {
      const res = await saveNotifyPrefsAction(next);
      if (res.ok) setSaved(true);
    });
  }

  return (
    <div className="flex flex-col gap-4 rounded-token border border-line bg-panel p-5">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-ink">Telegram</div>
          <div className="text-xs text-muted-2">
            {isConnected ? 'Подключён — оповещения приходят в бот' : 'Получайте результаты ДЗ и напоминания'}
          </div>
        </div>
        {isConnected ? (
          <button
            onClick={onDisconnect}
            disabled={pending}
            className="rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-[var(--err)] disabled:opacity-50"
          >
            Отключить
          </button>
        ) : (
          <button
            onClick={onConnect}
            disabled={pending}
            className="rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold-bright hover:bg-[rgba(200,160,79,0.08)] disabled:opacity-50"
          >
            Подключить
          </button>
        )}
      </div>

      {connect && !isConnected && (
        <div className="rounded-xl border border-line bg-bg-2 p-4 text-sm">
          {connect.deeplink ? (
            <a href={connect.deeplink} target="_blank" rel="noreferrer" className="text-gold hover:text-gold-bright">
              Открыть бота и подтвердить привязку →
            </a>
          ) : (
            <p className="text-muted">
              Напишите боту команду:{' '}
              <code className="rounded bg-bg px-1.5 py-0.5 text-gold-bright">/start {connect.code}</code>
            </p>
          )}
          <p className="mt-2 text-xs text-muted-2">Код действует 15 минут.</p>
        </div>
      )}

      {isConnected && (
        <div className="border-t border-line pt-3">
          <label className="flex items-center justify-between text-sm text-muted">
            Получать уведомления
            <input
              type="checkbox"
              checked={prefs.enabled}
              onChange={(e) => update('enabled', e.target.checked)}
              className="accent-[var(--gold)]"
            />
          </label>

          {prefs.enabled && (
            <div className="mt-3 flex flex-col gap-2">
              {TYPES.map((t) => (
                <label key={t.key} className="flex items-center justify-between text-sm text-muted">
                  {t.label}
                  <input
                    type="checkbox"
                    checked={prefs[t.key] as boolean}
                    onChange={(e) => update(t.key, e.target.checked as never)}
                    className="accent-[var(--gold)]"
                  />
                </label>
              ))}
              <div className="mt-2 flex items-center gap-2 text-sm text-muted">
                Тихие часы:
                <input
                  type="number" min={0} max={23} placeholder="с"
                  value={prefs.quietFrom ?? ''}
                  onChange={(e) => update('quietFrom', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-16 rounded-lg border border-line bg-bg-2 px-2 py-1 text-sm text-ink outline-none focus:border-gold"
                />
                <input
                  type="number" min={0} max={23} placeholder="до"
                  value={prefs.quietTo ?? ''}
                  onChange={(e) => update('quietTo', e.target.value === '' ? null : Number(e.target.value))}
                  className="w-16 rounded-lg border border-line bg-bg-2 px-2 py-1 text-sm text-ink outline-none focus:border-gold"
                />
              </div>
            </div>
          )}
          {saved && <div className="mt-2 text-xs text-ok">Настройки сохранены</div>}
        </div>
      )}
    </div>
  );
}
