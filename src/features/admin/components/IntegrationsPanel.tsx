'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { IntegrationView } from '../integrations';
import { saveIntegrationAction, clearIntegrationAction } from '../integration-actions';

const inputCls =
  'w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold';

function SourceBadge({ source }: { source: IntegrationView['source'] }) {
  const map = {
    db: { label: 'задано в платформе', cls: 'text-ok' },
    env: { label: 'из переменных Vercel', cls: 'text-muted' },
    none: { label: 'не задано', cls: 'text-muted-2' },
  }[source];
  return <span className={`text-[11px] ${map.cls}`}>● {map.label}</span>;
}

function Field({ item }: { item: IntegrationView }) {
  const router = useRouter();
  const [value, setValue] = useState('');
  const [pending, start] = useTransition();
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  function save() {
    if (!value.trim()) return;
    start(async () => {
      const r = await saveIntegrationAction(item.key, value);
      setMsg(r.ok ? { ok: true, text: 'Сохранено' } : { ok: false, text: r.error });
      if (r.ok) {
        setValue('');
        router.refresh();
      }
    });
  }

  function clear() {
    start(async () => {
      const r = await clearIntegrationAction(item.key);
      setMsg(r.ok ? { ok: true, text: 'Сброшено к env' } : { ok: false, text: r.error });
      if (r.ok) router.refresh();
    });
  }

  return (
    <div className="rounded-xl border border-line bg-panel px-4 py-3">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <span className="text-sm text-ink">{item.label}</span>
        <SourceBadge source={item.source} />
      </div>
      {item.masked && (
        <div className="mb-2 font-mono text-xs text-muted-2">
          текущее: {item.secret ? item.masked : item.masked}
        </div>
      )}
      <div className="flex gap-2">
        <input
          type={item.secret ? 'password' : 'text'}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder={item.placeholder ?? (item.masked ? 'новое значение…' : 'значение…')}
          autoComplete="off"
          className={inputCls}
        />
        <button
          onClick={save}
          disabled={pending || !value.trim()}
          className="flex-none rounded-xl bg-gradient-to-r from-gold-deep to-gold px-4 py-2.5 font-label text-xs tracking-[1px] text-[#1a1206] hover:to-gold-bright disabled:opacity-50"
        >
          Сохранить
        </button>
        {item.source === 'db' && (
          <button
            onClick={clear}
            disabled={pending}
            className="flex-none rounded-xl border border-line px-3 py-2.5 text-xs text-muted hover:text-[var(--err)] disabled:opacity-50"
          >
            Сбросить
          </button>
        )}
      </div>
      {msg && <div className={`mt-1.5 text-xs ${msg.ok ? 'text-ok' : 'text-[var(--err)]'}`}>{msg.text}</div>}
    </div>
  );
}

/** Панель «Интеграции»: ключи сервисов задаются в платформе (ТЗ §6А.5). */
export function IntegrationsPanel({ items }: { items: IntegrationView[] }) {
  // Группируем поля по сервису.
  const groups = items.reduce<Record<string, IntegrationView[]>>((acc, it) => {
    (acc[it.group] ??= []).push(it);
    return acc;
  }, {});

  return (
    <div className="flex flex-col gap-8">
      {Object.entries(groups).map(([group, fields]) => (
        <section key={group}>
          <div className="sectlabel mb-4">{group}</div>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {fields.map((f) => (
              <Field key={f.key} item={f} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
