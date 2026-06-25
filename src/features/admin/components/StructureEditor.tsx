'use client';

import { useActionState } from 'react';
import Link from 'next/link';
import { saveModuleAction, saveLessonAction, type EditState } from '../course-edit-actions';

const initial: EditState = { status: 'idle' };
const inputCls =
  'rounded-lg border border-line bg-bg-2 px-3 py-2 text-sm text-ink outline-none focus:border-gold';

export interface EditorModule {
  id: string;
  title: string;
  resultText: string | null;
  durationMinutes: number | null;
  isArchived: boolean;
  lessons: Array<{ id: string; title: string; isArchived: boolean; requiresNote: boolean }>;
}

const labelCls = 'mb-1 block font-label text-[11px] uppercase tracking-[1px] text-muted-2';

/** Форма настроек модуля: название, результат, длительность (плашка модуля у ученика). */
function EditModuleForm({ module, courseId }: { module: EditorModule; courseId: string }) {
  const [state, action] = useActionState(saveModuleAction, initial);
  return (
    <details className="border-t border-line">
      <summary className="cursor-pointer select-none px-4 py-2 text-xs text-muted hover:text-gold">
        ✎ Настройки модуля (результат, длительность)
      </summary>
      <form action={action} className="flex flex-col gap-3 px-4 pb-4 pt-1">
        <input type="hidden" name="id" value={module.id} />
        <input type="hidden" name="courseId" value={courseId} />
        <label className="block">
          <span className={labelCls}>Название</span>
          <input name="title" defaultValue={module.title} className={`${inputCls} w-full`} />
        </label>
        <label className="block">
          <span className={labelCls}>Результат модуля (показывается ученику в плашке)</span>
          <textarea
            name="resultText"
            rows={2}
            defaultValue={module.resultText ?? ''}
            placeholder="Что ученик умеет/получает после модуля"
            className={`${inputCls} w-full`}
          />
        </label>
        <label className="block w-56">
          <span className={labelCls}>Время прохождения (минуты)</span>
          <input
            name="durationMinutes"
            type="number"
            min={0}
            defaultValue={module.durationMinutes ?? ''}
            placeholder="напр. 102"
            className={`${inputCls} w-full`}
          />
        </label>
        <div className="flex items-center gap-3">
          <button className="rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold-bright hover:bg-[rgba(200,160,79,0.08)]">
            Сохранить модуль
          </button>
          {state.status !== 'idle' && state.message && (
            <span className={`text-xs ${state.status === 'ok' ? 'text-ok' : 'text-[var(--err)]'}`}>
              {state.message}
            </span>
          )}
        </div>
      </form>
    </details>
  );
}

function AddModuleForm({ courseId }: { courseId: string }) {
  const [state, action] = useActionState(saveModuleAction, initial);
  return (
    <form action={action} className="flex items-center gap-2">
      <input type="hidden" name="courseId" value={courseId} />
      <input name="title" placeholder="Название нового модуля" className={`${inputCls} flex-1`} />
      <button className="rounded-lg border border-gold/40 px-4 py-2 text-sm text-gold-bright hover:bg-[rgba(200,160,79,0.08)]">
        + Модуль
      </button>
      {state.status === 'error' && <span className="text-xs text-[var(--err)]">{state.message}</span>}
    </form>
  );
}

function AddLessonForm({ moduleId, courseId }: { moduleId: string; courseId: string }) {
  const [state, action] = useActionState(saveLessonAction, initial);
  return (
    <form action={action} className="flex items-center gap-2 px-4 py-3">
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="returnCourseId" value={courseId} />
      <input type="hidden" name="requiresNote" value="on" />
      <input name="title" placeholder="Название нового урока" className={`${inputCls} flex-1`} />
      <button className="rounded-lg border border-line px-3 py-2 text-xs text-muted hover:text-gold">
        + Урок
      </button>
      {state.status === 'error' && <span className="text-xs text-[var(--err)]">{state.message}</span>}
    </form>
  );
}

/** Редактор структуры курса: модули и уроки (ТЗ §3.7). */
export function StructureEditor({ courseId, modules }: { courseId: string; modules: EditorModule[] }) {
  return (
    <div className="flex flex-col gap-4">
      {modules.map((m) => (
        <div key={m.id} className={`rounded-token border bg-panel ${m.isArchived ? 'border-[rgba(217,160,102,0.3)] opacity-70' : 'border-line'}`}>
          <div className="flex items-center justify-between border-b border-line px-4 py-3">
            <span className="font-label text-sm tracking-[1px] text-gold">
              {m.title} {m.isArchived && <span className="text-[10px] text-[var(--warn)]">архив</span>}
            </span>
          </div>
          <ul>
            {m.lessons.map((l) => (
              <li key={l.id} className="flex items-center justify-between border-b border-line px-4 py-2.5 last:border-b-0">
                <span className={`text-sm ${l.isArchived ? 'text-muted-2 line-through' : 'text-ink'}`}>
                  {l.title}
                  {!l.requiresNote && <span className="ml-2 text-[10px] text-muted-2">без ДЗ</span>}
                </span>
                <Link href={`/admin/lesson/${l.id}/edit`} className="text-xs text-gold hover:underline">
                  Редактировать
                </Link>
              </li>
            ))}
            {m.lessons.length === 0 && <li className="px-4 py-2 text-xs text-muted-2">Уроков нет</li>}
          </ul>
          <EditModuleForm module={m} courseId={courseId} />
          <div className="border-t border-line bg-bg-2/50">
            <AddLessonForm moduleId={m.id} courseId={courseId} />
          </div>
        </div>
      ))}

      <div className="rounded-token border border-dashed border-line p-4">
        <AddModuleForm courseId={courseId} />
      </div>
    </div>
  );
}
