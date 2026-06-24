'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { createStudentAction } from '../student-actions';

const inputCls =
  'w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold';

/** Генерация читаемого временного пароля (для выдачи ученику; ученик сменит сам). */
function generatePassword(): string {
  const alphabet = 'abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let out = '';
  for (let i = 0; i < 12; i++) {
    out += alphabet[Math.floor(Math.random() * alphabet.length)];
  }
  return out;
}

/**
 * Создание ученика админом вручную (ТЗ §3.7): аккаунт сразу активен, вход по выданному
 * паролю без письма-подтверждения. После создания показываем логин+пароль для передачи.
 */
export function CreateStudentForm() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pending, start] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [created, setCreated] = useState<{ email: string; password: string } | null>(null);

  function submit() {
    setError(null);
    start(async () => {
      const r = await createStudentAction({ name: name.trim(), email: email.trim(), password });
      if (r.ok) {
        setCreated({ email: r.data.email, password });
        setName('');
        setEmail('');
        setPassword('');
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  if (!open) {
    return (
      <button
        onClick={() => {
          setOpen(true);
          setCreated(null);
        }}
        className="rounded-xl border border-gold/40 px-4 py-2 text-xs text-gold-bright transition-colors hover:bg-[rgba(200,160,79,0.08)]"
      >
        + Добавить ученика
      </button>
    );
  }

  return (
    <div className="rounded-token border border-line bg-panel p-5">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="font-display text-lg font-semibold">Новый ученик</h2>
        <button onClick={() => setOpen(false)} className="text-xs text-muted hover:text-ink">
          Закрыть
        </button>
      </div>

      {created && (
        <div className="mb-4 rounded-xl border border-ok/40 bg-[rgba(123,191,143,0.08)] px-4 py-3 text-sm">
          <div className="mb-1.5 text-ok">Ученик создан. Передайте данные для входа:</div>
          <div className="font-mono text-xs text-ink">
            <div>Логин: {created.email}</div>
            <div>Пароль: {created.password}</div>
          </div>
          <div className="mt-1.5 text-[11px] text-muted-2">
            Пароль больше не будет показан. Ученик сможет сменить его в профиле.
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Имя ученика"
          autoComplete="off"
          className={inputCls}
        />
        <input
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="email@домен"
          autoComplete="off"
          className={inputCls}
        />
        <div className="flex gap-2 sm:col-span-2">
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Пароль (минимум 10 символов)"
            autoComplete="off"
            className={inputCls}
          />
          <button
            type="button"
            onClick={() => setPassword(generatePassword())}
            className="flex-none rounded-xl border border-line px-3 py-2.5 text-xs text-muted hover:text-gold"
          >
            Сгенерировать
          </button>
        </div>
      </div>

      {error && <div className="mt-2 text-xs text-[var(--err)]">{error}</div>}

      <div className="mt-4 flex justify-end">
        <button
          onClick={submit}
          disabled={pending || !name.trim() || !email.trim() || password.length < 10}
          className="rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-xs tracking-[1px] text-[#1a1206] hover:to-gold-bright disabled:opacity-50"
        >
          {pending ? 'Создаю…' : 'Создать ученика'}
        </button>
      </div>
    </div>
  );
}
