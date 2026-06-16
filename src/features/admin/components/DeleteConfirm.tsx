'use client';

import { useEffect, useState, useTransition } from 'react';
import { impactAction, deleteForeverAction } from '../actions';
import type { ImpactSummary, TargetType } from '../service';

/**
 * Подтверждение полного удаления с охватом затрагиваемых данных (Дополнение №1 §2-3).
 * Перед удалением показывает, сколько учеников/ДЗ/файлов будет затронуто.
 */
export function DeleteConfirm({
  target,
  id,
  title,
  onClose,
}: {
  target: TargetType;
  id: string;
  title: string;
  onClose: () => void;
}) {
  const [impact, setImpact] = useState<ImpactSummary | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    impactAction(target, id).then((r) => {
      if (r.ok) setImpact(r.data);
      else setError(r.error);
    });
  }, [target, id]);

  function confirm() {
    startTransition(async () => {
      const r = await deleteForeverAction(target, id);
      if (r.ok) onClose();
      else setError(r.error);
    });
  }

  const targetLabel = { course: 'курс', module: 'модуль', lesson: 'урок' }[target];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4" onClick={onClose}>
      <div
        className="w-full max-w-md rounded-token border border-[rgba(196,90,90,0.4)] bg-panel p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-display text-2xl font-semibold text-[var(--err)]">
          Удалить {targetLabel} навсегда?
        </h3>
        <p className="mt-2 text-sm text-muted">
          «{title}» и все связанные данные будут удалены <b>безвозвратно</b>. Это действие нельзя отменить.
        </p>

        {error && <div className="mt-3 text-sm text-[var(--err)]">{error}</div>}

        {impact && (
          <div className="mt-4 rounded-xl border border-line bg-bg-2 p-4 text-sm text-muted">
            <div className="mb-2 font-label text-[11px] uppercase tracking-[1px] text-muted-2">
              Будет затронуто
            </div>
            <ul className="space-y-1">
              {impact.students != null && <li>Учеников с доступом: <b className="text-ink">{impact.students}</b></li>}
              {impact.lessons != null && <li>Уроков: <b className="text-ink">{impact.lessons}</b></li>}
              <li>Сданных ДЗ: <b className="text-ink">{impact.homework}</b></li>
              <li>Файлов-вложений: <b className="text-ink">{impact.files}</b></li>
            </ul>
          </div>
        )}

        <div className="mt-5 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted hover:text-ink"
          >
            Отмена
          </button>
          <button
            onClick={confirm}
            disabled={pending || !impact}
            className="rounded-xl bg-[var(--err)] px-5 py-2.5 font-label text-sm tracking-[1px] text-white disabled:opacity-50"
          >
            {pending ? 'Удаляю…' : 'Удалить навсегда'}
          </button>
        </div>
      </div>
    </div>
  );
}
