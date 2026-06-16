'use client';

import { useActionState, useState, useTransition } from 'react';
import type { AdminAchievement } from '../achievements-admin';
import {
  saveAchievementAction,
  deleteAchievementAction,
  type AchievementFormState,
} from '../achievement-actions';

const initial: AchievementFormState = { status: 'idle' };

const CONDITIONS = [
  { value: 'lesson_completed', label: 'Пройдено уроков' },
  { value: 'module_completed', label: 'Завершено модулей' },
  { value: 'homework_passed', label: 'Зачтено ДЗ' },
  { value: 'streak_days', label: 'Дней стрика' },
];
const RARITIES = [
  { value: 'common', label: 'Обычное' },
  { value: 'rare', label: 'Редкое' },
  { value: 'epic', label: 'Эпическое' },
  { value: 'legendary', label: 'Легендарное' },
];

const inputCls =
  'w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold';

/** CRUD достижений для админа (ТЗ §3.5). Управляющие элементы видны только админу. */
export function AchievementsAdmin({ achievements }: { achievements: AdminAchievement[] }) {
  const [state, action] = useActionState(saveAchievementAction, initial);
  const [editing, setEditing] = useState<AdminAchievement | null>(null);
  const [, startDelete] = useTransition();
  // key сбрасывает неконтролируемую форму при смене редактируемого достижения.
  const formKey = editing?.id ?? 'new';

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
      <section>
        <div className="sectlabel mb-4">Все достижения</div>
        <div className="flex flex-col gap-2">
          {achievements.map((a) => (
            <div key={a.id} className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3">
              <div className="min-w-0">
                <div className="text-sm text-ink">
                  {a.icon ?? '🏆'} {a.title}
                  <span className="ml-2 text-xs text-muted-2">+{a.xpReward} XP</span>
                </div>
                <div className="text-xs text-muted-2">
                  {a.category ?? 'Без категории'} · {a.rarity} · {a.conditionType} ≥ {a.threshold}
                </div>
              </div>
              <div className="flex flex-none gap-2">
                <button onClick={() => setEditing(a)} className="text-xs text-gold hover:underline">
                  Изменить
                </button>
                <button
                  onClick={() => startDelete(() => void deleteAchievementAction(a.id))}
                  className="text-xs text-[var(--err)] hover:underline"
                >
                  Удалить
                </button>
              </div>
            </div>
          ))}
          {achievements.length === 0 && <p className="text-sm text-muted-2">Достижений нет</p>}
        </div>
      </section>

      <section>
        <div className="sectlabel mb-4">{editing ? 'Редактирование' : 'Новое достижение'}</div>
        <form key={formKey} action={action} className="flex flex-col gap-3 rounded-token border border-line bg-panel p-5">
          <input type="hidden" name="id" value={editing?.id ?? ''} />
          <input name="title" placeholder="Название" defaultValue={editing?.title ?? ''} className={inputCls} />
          <textarea name="description" rows={2} placeholder="Описание условия" defaultValue={editing?.description ?? ''} className={inputCls} />
          <div className="flex gap-3">
            <input name="icon" placeholder="🏆" defaultValue={editing?.icon ?? ''} className={`${inputCls} w-20`} />
            <input name="category" placeholder="Категория" defaultValue={editing?.category ?? ''} className={inputCls} />
          </div>
          <select name="rarity" defaultValue={editing?.rarity ?? 'common'} className={inputCls}>
            {RARITIES.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          <div className="flex gap-3">
            <select name="conditionType" defaultValue={editing?.conditionType ?? 'lesson_completed'} className={inputCls}>
              {CONDITIONS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
            </select>
            <input name="threshold" type="number" min={1} placeholder="Порог" defaultValue={editing?.threshold ?? 1} className={`${inputCls} w-28`} />
          </div>
          <input name="xpReward" type="number" min={0} placeholder="Награда XP" defaultValue={editing?.xpReward ?? 0} className={inputCls} />

          {state.status !== 'idle' && state.message && (
            <div className={`text-sm ${state.status === 'ok' ? 'text-ok' : 'text-[var(--err)]'}`}>{state.message}</div>
          )}

          <div className="flex gap-2">
            <button className="rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright">
              {editing ? 'Сохранить' : 'Создать'}
            </button>
            {editing && (
              <button type="button" onClick={() => setEditing(null)} className="rounded-xl border border-line px-4 py-2.5 text-sm text-muted hover:text-ink">
                Отмена
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
