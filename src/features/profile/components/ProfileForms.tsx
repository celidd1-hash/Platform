'use client';

import { useActionState, useState, useTransition } from 'react';
import { setRatingVisibilityAction } from '@/features/gamification';
import { updateProfileAction, changePasswordAction, deleteAccountAction, type ProfileState } from '../actions';

const initial: ProfileState = { status: 'idle' };
const inputCls =
  'w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold';
const labelCls = 'mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted';

function Note({ state }: { state: ProfileState }) {
  if (state.status === 'idle' || !state.message) return null;
  return <div className={`text-sm ${state.status === 'ok' ? 'text-ok' : 'text-[var(--err)]'}`}>{state.message}</div>;
}

/** Редактирование имени и аватара (ТЗ §3.6). */
export function ProfileForm({ name, avatarUrl }: { name: string; avatarUrl: string | null }) {
  const [state, action] = useActionState(updateProfileAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-token border border-line bg-panel p-5">
      <label className="block">
        <span className={labelCls}>Имя</span>
        <input name="name" defaultValue={name} className={inputCls} />
      </label>
      <label className="block">
        <span className={labelCls}>Ссылка на аватар (необязательно)</span>
        <input name="avatarUrl" defaultValue={avatarUrl ?? ''} placeholder="https://…" className={inputCls} />
      </label>
      <Note state={state} />
      <button className="self-start rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright">
        Сохранить
      </button>
    </form>
  );
}

/** Смена пароля (ТЗ §6А.2). */
export function ChangePasswordForm() {
  const [state, action] = useActionState(changePasswordAction, initial);
  return (
    <form action={action} className="flex flex-col gap-3 rounded-token border border-line bg-panel p-5">
      <label className="block">
        <span className={labelCls}>Текущий пароль</span>
        <input name="current" type="password" autoComplete="current-password" className={inputCls} />
      </label>
      <label className="block">
        <span className={labelCls}>Новый пароль</span>
        <input name="next" type="password" autoComplete="new-password" className={inputCls} />
      </label>
      <Note state={state} />
      <button className="self-start rounded-xl border border-gold/40 px-5 py-2.5 font-label text-sm tracking-[1px] text-gold-bright hover:bg-[rgba(200,160,79,0.08)]">
        Сменить пароль
      </button>
    </form>
  );
}

/** Видимость в рейтинге (ТЗ §3.5). */
export function RatingVisibilityToggle({ isPublic }: { isPublic: boolean }) {
  const [pending, start] = useTransition();
  const [state, setState] = useState(isPublic);
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <input
        type="checkbox"
        checked={state}
        disabled={pending}
        onChange={() => {
          const next = !state;
          setState(next);
          start(() => void setRatingVisibilityAction(next));
        }}
        className="accent-[var(--gold)]"
      />
      Показывать меня в публичном рейтинге
    </label>
  );
}

/** Удаление аккаунта (право «быть забытым», ТЗ §6А.11). */
export function DeleteAccount() {
  const [confirm, setConfirm] = useState(false);
  const [pending, start] = useTransition();
  return (
    <div className="rounded-token border border-[rgba(196,90,90,0.4)] bg-panel p-5">
      <h3 className="font-display text-xl text-[var(--err)]">Удаление аккаунта</h3>
      <p className="mt-1 text-sm text-muted">
        Аккаунт и связанные данные (прогресс, ДЗ, достижения) будут удалены безвозвратно.
      </p>
      {!confirm ? (
        <button onClick={() => setConfirm(true)} className="mt-4 rounded-xl border border-[rgba(196,90,90,0.4)] px-4 py-2 text-sm text-[var(--err)] hover:bg-[rgba(196,90,90,0.08)]">
          Удалить аккаунт
        </button>
      ) : (
        <div className="mt-4 flex items-center gap-3">
          <span className="text-sm text-ink">Точно удалить?</span>
          <button
            onClick={() => start(() => void deleteAccountAction())}
            disabled={pending}
            className="rounded-xl bg-[var(--err)] px-4 py-2 text-sm text-white disabled:opacity-50"
          >
            {pending ? 'Удаляю…' : 'Да, удалить навсегда'}
          </button>
          <button onClick={() => setConfirm(false)} className="text-sm text-muted hover:text-ink">
            Отмена
          </button>
        </div>
      )}
    </div>
  );
}
