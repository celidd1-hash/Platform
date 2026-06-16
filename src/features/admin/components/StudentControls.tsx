'use client';

import { useTransition } from 'react';
import { grantAccessAction, revokeAccessAction, setBlockedAction } from '../student-actions';

/** Кнопка блокировки/разблокировки ученика (ТЗ §3.7). */
export function BlockToggle({ userId, blocked }: { userId: string; blocked: boolean }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => void setBlockedAction(userId, !blocked))}
      disabled={pending}
      className={`rounded-lg border px-3 py-1.5 text-xs transition-colors disabled:opacity-50 ${
        blocked
          ? 'border-ok/40 text-ok hover:bg-[rgba(123,191,143,0.08)]'
          : 'border-[rgba(196,90,90,0.4)] text-[var(--err)] hover:bg-[rgba(196,90,90,0.08)]'
      }`}
    >
      {blocked ? 'Разблокировать' : 'Заблокировать'}
    </button>
  );
}

/** Переключатель доступа ученика к курсу (выдать/отозвать, ТЗ §3.7). */
export function AccessToggle({
  userId,
  courseId,
  title,
  granted,
  archived,
}: {
  userId: string;
  courseId: string;
  title: string;
  granted: boolean;
  archived: boolean;
}) {
  const [pending, start] = useTransition();
  return (
    <div className="flex items-center justify-between rounded-lg border border-line bg-bg-2 px-4 py-2.5">
      <span className="text-sm text-ink">
        {title}
        {archived && <span className="ml-2 text-[10px] uppercase tracking-[1px] text-[var(--warn)]">архив</span>}
      </span>
      <button
        onClick={() =>
          start(() =>
            void (granted
              ? revokeAccessAction(userId, courseId)
              : grantAccessAction(userId, courseId)),
          )
        }
        disabled={pending}
        className={`rounded-md border px-3 py-1 text-xs transition-colors disabled:opacity-50 ${
          granted
            ? 'border-line text-muted hover:text-[var(--err)]'
            : 'border-gold/40 text-gold-bright hover:bg-[rgba(200,160,79,0.08)]'
        }`}
      >
        {granted ? 'Отозвать' : 'Выдать доступ'}
      </button>
    </div>
  );
}
