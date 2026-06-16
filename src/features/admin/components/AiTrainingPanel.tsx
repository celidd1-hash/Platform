'use client';

import { useActionState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AiTrainingData } from '../ai-training';
import {
  saveSettingsAction,
  addKnowledgeAction,
  removeKnowledgeAction,
  type AiFormState,
} from '../ai-actions';

const initial: AiFormState = { status: 'idle' };

function Note({ state }: { state: AiFormState }) {
  if (state.status === 'idle' || !state.message) return null;
  return (
    <div className={`text-sm ${state.status === 'ok' ? 'text-ok' : 'text-[var(--err)]'}`}>
      {state.message}
    </div>
  );
}

/** Панель «Обучение ИИ-агента» (ТЗ §3.4): выбор курса, параметры проверки, база знаний. */
export function AiTrainingPanel({ data }: { data: AiTrainingData }) {
  const router = useRouter();
  const [settingsState, settingsAction] = useActionState(saveSettingsAction, initial);
  const [kbState, kbAction] = useActionState(addKnowledgeAction, initial);
  const [, startDelete] = useTransition();

  if (!data.selected) {
    return <p className="text-sm text-muted">Сначала создайте курс.</p>;
  }

  const courseId = data.selected.id;

  return (
    <div>
      <div className="mb-6 flex flex-wrap gap-2">
        {data.courses.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/admin/ai?course=${c.id}`)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              c.id === courseId ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright' : 'border-line text-muted hover:text-gold'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Параметры проверки */}
        <section>
          <div className="sectlabel mb-4">Параметры проверки</div>
          <form action={settingsAction} className="flex flex-col gap-4 rounded-token border border-line bg-panel p-5">
            <input type="hidden" name="courseId" value={courseId} />
            <label className="block">
              <span className="mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted">
                Проходной балл (0–100)
              </span>
              <input
                name="passScore"
                type="number"
                min={0}
                max={100}
                defaultValue={data.settings.passScore}
                className="w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted">
                Строгость
              </span>
              <select
                name="strictness"
                defaultValue={data.settings.strictness}
                className="w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
              >
                <option value="lenient">Мягкая</option>
                <option value="normal">Обычная</option>
                <option value="strict">Строгая</option>
              </select>
            </label>
            <label className="block">
              <span className="mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted">
                Доп. инструкция наставнику (необязательно)
              </span>
              <textarea
                name="promptTemplate"
                rows={3}
                defaultValue={data.settings.promptTemplate ?? ''}
                className="w-full resize-y rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
              />
            </label>
            <Note state={settingsState} />
            <button className="self-start rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright">
              Сохранить параметры
            </button>
          </form>
        </section>

        {/* База знаний */}
        <section>
          <div className="sectlabel mb-4">База знаний курса</div>
          <div className="mb-4 flex flex-col gap-2">
            {data.knowledge.map((k) => (
              <div key={k.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm text-ink">{k.title}</div>
                    <p className="mt-1 line-clamp-2 text-xs text-muted">{k.contentMd}</p>
                  </div>
                  <button
                    onClick={() => startDelete(() => void removeKnowledgeAction(k.id))}
                    className="flex-none text-xs text-[var(--err)] hover:underline"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            ))}
            {data.knowledge.length === 0 && (
              <p className="text-sm text-muted-2">База знаний пуста — добавьте тезисы и эталоны.</p>
            )}
          </div>

          <form action={kbAction} className="flex flex-col gap-3 rounded-token border border-line bg-panel p-5">
            <input type="hidden" name="courseId" value={courseId} />
            <input
              name="title"
              placeholder="Заголовок материала"
              className="w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
            />
            <textarea
              name="contentMd"
              rows={5}
              placeholder="Тезисы, эталонные ответы, критерии оценки…"
              className="w-full resize-y rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
            />
            <Note state={kbState} />
            <button className="self-start rounded-xl border border-gold/40 px-5 py-2.5 font-label text-sm tracking-[1px] text-gold-bright hover:bg-[rgba(200,160,79,0.08)]">
              + Добавить в базу знаний
            </button>
          </form>
        </section>
      </div>
    </div>
  );
}
