'use client';

import { useActionState, useEffect, useState, useTransition } from 'react';
import type { AdminAchievement } from '../achievements-admin';
import { ACHIEVEMENT_ICONS } from '../achievement-icons';
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
const labelCls = 'mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted';

type Course = { id: string; title: string };
type Scope = 'all' | 'general' | string;

/** CRUD достижений для админа (ТЗ §3.5): плашки курсов, привязка к курсу, палитра значков. */
export function AchievementsAdmin({
  achievements,
  courses,
}: {
  achievements: AdminAchievement[];
  courses: Course[];
}) {
  const [state, action] = useActionState(saveAchievementAction, initial);
  const [editing, setEditing] = useState<AdminAchievement | null>(null);
  const [scope, setScope] = useState<Scope>('all');
  const [icon, setIcon] = useState<string>('');
  const [, startDelete] = useTransition();

  // Синхронизируем выбранный значок с редактируемым достижением.
  useEffect(() => setIcon(editing?.icon ?? ''), [editing]);

  // Сброс формы при смене режима (редактируемое достижение или активная плашка для нового).
  const formKey = editing?.id ?? `new-${scope}`;
  // Курс по умолчанию для нового достижения = активная плашка курса (если выбрана).
  const defaultCourseId =
    editing?.courseId ?? (scope !== 'all' && scope !== 'general' ? scope : '');

  const visible = achievements.filter((a) =>
    scope === 'all' ? true : scope === 'general' ? !a.courseId : a.courseId === scope,
  );

  const tabs: Array<{ key: Scope; label: string; count: number }> = [
    { key: 'all', label: 'Все', count: achievements.length },
    { key: 'general', label: 'Общие', count: achievements.filter((a) => !a.courseId).length },
    ...courses.map((c) => ({
      key: c.id,
      label: c.title,
      count: achievements.filter((a) => a.courseId === c.id).length,
    })),
  ];

  return (
    <div>
      {/* Плашки курсов */}
      <div className="mb-6 flex flex-wrap gap-2">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setScope(t.key)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              scope === t.key
                ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright'
                : 'border-line text-muted hover:text-gold'
            }`}
          >
            {t.label}
            {t.count > 0 && <span className="ml-1.5 text-muted-2">{t.count}</span>}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_380px]">
        <section>
          <div className="mb-4 flex items-center justify-between">
            <div className="sectlabel">Достижения</div>
            <button
              onClick={() => setEditing(null)}
              className="rounded-lg border border-gold/40 px-3 py-1.5 font-label text-xs tracking-[1px] text-gold-bright transition-colors hover:bg-[rgba(200,160,79,0.08)]"
            >
              + Новое достижение
            </button>
          </div>
          <div className="flex flex-col gap-2">
            {visible.map((a) => (
              <div
                key={a.id}
                className="flex items-center justify-between rounded-lg border border-line bg-panel px-4 py-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-ink">
                    <span>{a.icon ?? '🏆'}</span>
                    <span className="truncate">{a.title}</span>
                    <span className="flex-none text-xs text-muted-2">+{a.xpReward} XP</span>
                    <span className="flex-none rounded-md border border-line px-2 py-0.5 text-[10px] uppercase tracking-[1px] text-muted-2">
                      {a.courseTitle ?? 'Общее'}
                    </span>
                  </div>
                  <div className="mt-0.5 text-xs text-muted-2">
                    {a.rarity} · {a.conditionType} ≥ {a.threshold}
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
            {visible.length === 0 && <p className="text-sm text-muted-2">Достижений нет</p>}
          </div>
        </section>

        <section>
          <div className="sectlabel mb-4">{editing ? 'Редактирование' : 'Новое достижение'}</div>
          <form key={formKey} action={action} className="flex flex-col gap-3 rounded-token border border-line bg-panel p-5">
            <input type="hidden" name="id" value={editing?.id ?? ''} />
            <input type="hidden" name="icon" value={icon} />

            <label className="block">
              <span className={labelCls}>Курс</span>
              <select name="courseId" defaultValue={defaultCourseId} className={inputCls}>
                <option value="">Общее (вне курса)</option>
                {courses.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.title}
                  </option>
                ))}
              </select>
            </label>

            <input name="title" placeholder="Название" defaultValue={editing?.title ?? ''} className={inputCls} />
            <textarea name="description" rows={2} placeholder="Описание условия" defaultValue={editing?.description ?? ''} className={inputCls} />

            <div>
              <span className={labelCls}>Значок</span>
              <div className="flex flex-wrap gap-1.5">
                {ACHIEVEMENT_ICONS.map((ic) => (
                  <button
                    key={ic}
                    type="button"
                    onClick={() => setIcon(ic)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg border text-lg transition-colors ${
                      icon === ic ? 'border-gold bg-[rgba(200,160,79,0.14)]' : 'border-line hover:border-gold/40'
                    }`}
                  >
                    {ic}
                  </button>
                ))}
              </div>
            </div>

            <input name="category" placeholder="Категория (необязательно)" defaultValue={editing?.category ?? ''} className={inputCls} />

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
    </div>
  );
}
