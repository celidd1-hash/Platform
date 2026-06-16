'use client';

import { useState } from 'react';
import type { AchievementView } from '../service';

const RARITY_LABEL: Record<string, string> = {
  common: 'обычное',
  rare: 'редкое',
  epic: 'эпическое',
  legendary: 'легендарное',
};

/** Сетка достижений: все возможные + полученные, прогресс X/Y, фильтр по категории (ТЗ §3.5). */
export function AchievementsGrid({ achievements }: { achievements: AchievementView[] }) {
  const categories = ['Все', ...Array.from(new Set(achievements.map((a) => a.category ?? 'Прочее')))];
  const [filter, setFilter] = useState('Все');

  const visible =
    filter === 'Все' ? achievements : achievements.filter((a) => (a.category ?? 'Прочее') === filter);

  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              filter === c ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright' : 'border-line text-muted hover:text-gold'
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {visible.map((a) => {
          const pct = a.target > 0 ? Math.round((a.current / a.target) * 100) : 0;
          return (
            <article
              key={a.id}
              className={`rounded-token border p-5 ${
                a.earned ? 'border-gold/40 bg-gradient-to-b from-panel-2 to-panel' : 'border-line bg-panel opacity-80'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className={`text-3xl ${a.earned ? '' : 'grayscale'}`}>{a.icon ?? '🏆'}</div>
                <span className="font-label text-[10px] uppercase tracking-[1px] text-muted-2">
                  {RARITY_LABEL[a.rarity] ?? a.rarity}
                </span>
              </div>
              <h3 className="mt-3 font-display text-xl font-semibold">{a.title}</h3>
              <p className="mt-1 text-sm text-muted">{a.description}</p>

              <div className="mt-4">
                <div className="mb-1 flex justify-between text-xs text-muted-2">
                  <span>{a.earned ? 'Получено' : `${a.current}/${a.target}`}</span>
                  <span className="text-gold-bright">+{a.xpReward} XP</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-2">
                  <div
                    className={`h-full ${a.earned ? 'bg-ok' : 'bg-gradient-to-r from-gold-deep to-gold-bright'}`}
                    style={{ width: `${a.earned ? 100 : pct}%` }}
                  />
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
