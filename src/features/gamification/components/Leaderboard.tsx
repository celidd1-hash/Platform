'use client';

import { useState, useTransition } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { setRatingVisibilityAction } from '../actions';
import type { LeaderboardRow, LeaderboardPeriod } from '../service';

/** Таблица рейтинга: за всё время / за месяц, со скрытием себя из публичного рейтинга (ТЗ §3.5). */
export function Leaderboard({
  rows,
  period,
  isPublic,
}: {
  rows: LeaderboardRow[];
  period: LeaderboardPeriod;
  isPublic: boolean;
}) {
  const router = useRouter();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();
  const [publicState, setPublicState] = useState(isPublic);

  function switchPeriod(p: LeaderboardPeriod) {
    const sp = new URLSearchParams(params.toString());
    sp.set('period', p);
    router.push(`/rating?${sp.toString()}`);
  }

  function toggleVisibility() {
    const next = !publicState;
    setPublicState(next);
    startTransition(() => void setRatingVisibilityAction(next));
  }

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <div className="flex gap-2">
          {(['all', 'month'] as const).map((p) => (
            <button
              key={p}
              onClick={() => switchPeriod(p)}
              className={`rounded-full border px-4 py-1.5 text-xs transition-colors ${
                period === p ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright' : 'border-line text-muted hover:text-gold'
              }`}
            >
              {p === 'all' ? 'За всё время' : 'За месяц'}
            </button>
          ))}
        </div>
        <label className="flex items-center gap-2 text-xs text-muted">
          <input
            type="checkbox"
            checked={publicState}
            onChange={toggleVisibility}
            disabled={pending}
            className="accent-[var(--gold)]"
          />
          Показывать меня в рейтинге
        </label>
      </div>

      <div className="overflow-hidden rounded-token border border-line">
        <div className="grid grid-cols-[48px_1fr_auto_auto_auto] gap-3 border-b border-line bg-panel-2 px-4 py-2 font-label text-[10px] uppercase tracking-[2px] text-muted-2">
          <span>#</span>
          <span>Ученик</span>
          <span>Прогресс</span>
          <span>Стрик</span>
          <span>XP</span>
        </div>
        {rows.length === 0 && <div className="px-4 py-6 text-center text-sm text-muted">Пока пусто</div>}
        {rows.map((row) => (
          <div
            key={row.userId}
            className={`grid grid-cols-[48px_1fr_auto_auto_auto] items-center gap-3 border-b border-line px-4 py-3 last:border-b-0 ${
              row.isYou ? 'border-l-2 border-l-gold bg-[rgba(200,160,79,0.08)]' : ''
            }`}
          >
            <span className="font-display text-xl text-muted">{row.rank}</span>
            <span className="flex items-center gap-3">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-gradient-to-br from-gold-bright to-gold-deep font-label text-xs text-[#1a1206]">
                {row.name.trim()[0]?.toUpperCase() ?? '·'}
              </span>
              <span className="text-sm text-ink">
                {row.name} {row.isYou && <span className="text-gold-bright">(вы)</span>}
              </span>
            </span>
            <span className="text-sm text-gold">{row.progressPct != null ? `${row.progressPct}%` : '—'}</span>
            <span className="text-sm text-muted-2">🔥 {row.streakDays}</span>
            <span className="font-display text-lg text-gold-bright">{row.xp}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
