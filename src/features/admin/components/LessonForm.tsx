'use client';

import { useActionState } from 'react';
import { saveLessonAction, type EditState } from '../course-edit-actions';

const initial: EditState = { status: 'idle' };
const inputCls =
  'w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold';
const labelCls = 'mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted';

export interface LessonFormValues {
  id: string;
  moduleId: string;
  title: string;
  position: number;
  contentMd: string | null;
  videoUrl: string | null;
  materialsUrl: string | null;
  requiresNote: boolean;
  minNoteLength: number | null;
  xpReward: number;
}

/** Редактор урока: видео, описание (markdown), ДЗ-настройки (ТЗ §3.3, §3.7). */
export function LessonForm({ lesson }: { lesson: LessonFormValues }) {
  const [state, action] = useActionState(saveLessonAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-token border border-line bg-panel p-5">
      <input type="hidden" name="id" value={lesson.id} />
      <input type="hidden" name="moduleId" value={lesson.moduleId} />

      <label className="block">
        <span className={labelCls}>Название</span>
        <input name="title" defaultValue={lesson.title} className={inputCls} />
      </label>

      <div className="flex gap-4">
        <label className="block w-32">
          <span className={labelCls}>Позиция</span>
          <input name="position" type="number" min={0} defaultValue={lesson.position} className={inputCls} />
        </label>
        <label className="block w-40">
          <span className={labelCls}>XP за урок</span>
          <input name="xpReward" type="number" min={0} defaultValue={lesson.xpReward} className={inputCls} />
        </label>
      </div>

      <label className="block">
        <span className={labelCls}>Видео (ID/ссылка Bunny)</span>
        <input name="videoUrl" defaultValue={lesson.videoUrl ?? ''} placeholder="напр. GUID видео в Bunny Stream" className={inputCls} />
      </label>

      <label className="block">
        <span className={labelCls}>Ссылка на материалы (Google Диск и т.п.)</span>
        <input
          name="materialsUrl"
          type="url"
          defaultValue={lesson.materialsUrl ?? ''}
          placeholder="https://drive.google.com/..."
          className={inputCls}
        />
        <span className="mt-1 block text-[11px] text-muted-2">
          Необязательно. Откроется ученику кнопкой после просмотра видео и отправки ДЗ.
        </span>
      </label>

      <label className="block">
        <span className={labelCls}>Введение (показывается ученику под названием урока, markdown)</span>
        <textarea name="contentMd" rows={8} defaultValue={lesson.contentMd ?? ''} className={inputCls} />
      </label>

      <div className="flex items-center gap-6">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="requiresNote" defaultChecked={lesson.requiresNote} className="accent-[var(--gold)]" />
          Требуется ДЗ для зачёта
        </label>
        <label className="flex items-center gap-2 text-sm text-muted">
          Мин. длина ДЗ:
          <input name="minNoteLength" type="number" min={0} defaultValue={lesson.minNoteLength ?? ''} placeholder="200" className={`${inputCls} w-24`} />
        </label>
      </div>

      {state.status !== 'idle' && state.message && (
        <div className={`text-sm ${state.status === 'ok' ? 'text-ok' : 'text-[var(--err)]'}`}>{state.message}</div>
      )}

      <button className="self-start rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright">
        Сохранить урок
      </button>
    </form>
  );
}
