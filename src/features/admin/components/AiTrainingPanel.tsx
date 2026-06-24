'use client';

import { useActionState, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import type { AiTrainingData } from '../ai-training';
import {
  saveSettingsAction,
  addKnowledgeAction,
  removeKnowledgeAction,
  type AiFormState,
} from '../ai-actions';

const initial: AiFormState = { status: 'idle' };
const inputCls =
  'w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold';
const labelCls = 'mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted';

function Note({ state }: { state: AiFormState }) {
  if (state.status === 'idle' || !state.message) return null;
  return (
    <div className={`text-sm ${state.status === 'ok' ? 'text-ok' : 'text-[var(--err)]'}`}>
      {state.message}
    </div>
  );
}

type View = 'prompt' | 'kb';

/**
 * Панель «Обучение ИИ-агента» (ТЗ §3.4): выбор курса + два раздела по кнопкам —
 * «Промт» (инструкция и параметры проверки) и «База знаний» (тезисы/эталоны/критерии).
 */
export function AiTrainingPanel({ data }: { data: AiTrainingData }) {
  const router = useRouter();
  const [view, setView] = useState<View>('prompt');
  const [settingsState, settingsAction] = useActionState(saveSettingsAction, initial);
  const [kbState, kbAction] = useActionState(addKnowledgeAction, initial);
  const [, startDelete] = useTransition();

  if (!data.selected) {
    return <p className="text-sm text-muted">Сначала создайте курс.</p>;
  }

  const courseId = data.selected.id;

  return (
    <div>
      {/* Выбор курса */}
      <div className="mb-1 font-label text-[11px] uppercase tracking-[2px] text-muted-2">Курс</div>
      <div className="mb-6 flex flex-wrap gap-2">
        {data.courses.map((c) => (
          <button
            key={c.id}
            onClick={() => router.push(`/admin/ai?course=${c.id}`)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              c.id === courseId
                ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright'
                : 'border-line text-muted hover:text-gold'
            }`}
          >
            {c.title}
          </button>
        ))}
      </div>

      {/* Две кнопки-раздела: Промт | База знаний */}
      <div className="mb-6 flex gap-2 border-b border-line pb-3">
        <button
          onClick={() => setView('prompt')}
          className={`rounded-lg px-4 py-2 font-label text-sm tracking-[1px] transition-colors ${
            view === 'prompt' ? 'bg-[rgba(200,160,79,0.14)] text-gold-bright' : 'text-muted hover:text-gold'
          }`}
        >
          Промт
        </button>
        <button
          onClick={() => setView('kb')}
          className={`rounded-lg px-4 py-2 font-label text-sm tracking-[1px] transition-colors ${
            view === 'kb' ? 'bg-[rgba(200,160,79,0.14)] text-gold-bright' : 'text-muted hover:text-gold'
          }`}
        >
          База знаний{data.knowledge.length > 0 ? ` (${data.knowledge.length})` : ''}
        </button>
      </div>

      {/* ───────── Раздел «Промт» ───────── */}
      {view === 'prompt' && (
        <section className="max-w-2xl">
          <div className="sectlabel mb-4">Промт агента для курса «{data.selected.title}»</div>
          <form action={settingsAction} className="flex flex-col gap-4 rounded-token border border-line bg-panel p-5">
            <input type="hidden" name="courseId" value={courseId} />

            <label className="block">
              <span className={labelCls}>Инструкция наставнику (промт)</span>
              <textarea
                name="promptTemplate"
                rows={8}
                defaultValue={data.settings.promptTemplate ?? ''}
                placeholder="Например: оценивай глубину понимания и рефлексию, а не дословный пересказ. Хвали за личные примеры. Снижай балл за общие фразы без сути."
                className={inputCls}
              />
              <span className="mt-1 block text-xs text-muted-2">
                Эта инструкция добавляется к проверке ДЗ по этому курсу. База знаний (соседняя кнопка) — отдельно.
              </span>
            </label>

            <div className="flex gap-4">
              <label className="block w-44">
                <span className={labelCls}>Проходной балл (0–100)</span>
                <input
                  name="passScore"
                  type="number"
                  min={0}
                  max={100}
                  defaultValue={data.settings.passScore}
                  className={inputCls}
                />
              </label>
              <label className="block flex-1">
                <span className={labelCls}>Строгость</span>
                <select name="strictness" defaultValue={data.settings.strictness} className={inputCls}>
                  <option value="lenient">Мягкая</option>
                  <option value="normal">Обычная</option>
                  <option value="strict">Строгая</option>
                </select>
              </label>
            </div>

            <Note state={settingsState} />
            <button className="self-start rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright">
              Сохранить промт
            </button>
          </form>
        </section>
      )}

      {/* ───────── Раздел «База знаний» ───────── */}
      {view === 'kb' && (
        <section className="max-w-2xl">
          <div className="sectlabel mb-4">База знаний курса «{data.selected.title}»</div>

          <div className="mb-5 flex flex-col gap-2">
            {data.knowledge.map((k) => (
              <div key={k.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-ink">{k.title}</span>
                      <span className="flex-none rounded-md border border-line px-2 py-0.5 text-[10px] uppercase tracking-[1px] text-muted-2">
                        {k.moduleTitle ?? 'Весь курс'}
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-3 whitespace-pre-wrap text-xs text-muted">{k.contentMd}</p>
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
              <p className="text-sm text-muted-2">
                Пусто. Добавьте тезисы, эталонные ответы и критерии — по ним агент проверяет ДЗ.
              </p>
            )}
          </div>

          <form action={kbAction} className="flex flex-col gap-3 rounded-token border border-line bg-panel p-5">
            <input type="hidden" name="courseId" value={courseId} />
            <div className="sectlabel mb-1">Добавить материал</div>
            <label className="block">
              <span className={labelCls}>Привязка</span>
              <select name="moduleId" defaultValue="" className={inputCls}>
                <option value="">Весь курс (общая база)</option>
                {data.modules.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.title}
                  </option>
                ))}
              </select>
              <span className="mt-1 block text-xs text-muted-2">
                При проверке ДЗ агент получит общую базу курса + базу модуля этого урока.
              </span>
            </label>
            <input name="title" placeholder="Заголовок (напр. «Сценарий модуля 1»)" className={inputCls} />
            <textarea
              name="contentMd"
              rows={6}
              placeholder="Вставьте ТЕКСТ: сценарий/транскрипт урока, тезисы, эталонные ответы, критерии…"
              className={inputCls}
            />
            <span className="block text-xs text-muted-2">
              Только текст (вставкой), файлы сюда не загружаются. Можно вставить весь сценарий
              модуля (до ~60 000 символов). По этому тексту агент проверяет ДЗ и отвечает в чате-наставнике.
            </span>
            <Note state={kbState} />
            <button className="self-start rounded-xl border border-gold/40 px-5 py-2.5 font-label text-sm tracking-[1px] text-gold-bright hover:bg-[rgba(200,160,79,0.08)]">
              + Добавить в базу знаний
            </button>
          </form>
        </section>
      )}
    </div>
  );
}
