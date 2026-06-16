'use client';

import { useActionState } from 'react';
import { saveCourseAction, type EditState } from '../course-edit-actions';

const initial: EditState = { status: 'idle' };
const inputCls =
  'w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold';

export interface CourseFormValues {
  id?: string;
  title: string;
  description: string;
  durationWeeks: number | null;
  isStrictOrder: boolean;
  isPublished: boolean;
}

/** Форма создания/редактирования курса (ТЗ §3.7). */
export function CourseForm({ course }: { course?: CourseFormValues }) {
  const [state, action] = useActionState(saveCourseAction, initial);

  return (
    <form action={action} className="flex flex-col gap-4 rounded-token border border-line bg-panel p-5">
      {course?.id && <input type="hidden" name="id" value={course.id} />}
      <label className="block">
        <span className="mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted">Название</span>
        <input name="title" defaultValue={course?.title ?? ''} className={inputCls} />
      </label>
      <label className="block">
        <span className="mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted">Описание</span>
        <textarea name="description" rows={3} defaultValue={course?.description ?? ''} className={inputCls} />
      </label>
      <label className="block max-w-[200px]">
        <span className="mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted">Длительность (недель)</span>
        <input name="durationWeeks" type="number" min={0} defaultValue={course?.durationWeeks ?? ''} className={inputCls} />
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="isStrictOrder" defaultChecked={course?.isStrictOrder ?? true} className="accent-[var(--gold)]" />
        Строгий порядок прохождения уроков
      </label>
      <label className="flex items-center gap-2 text-sm text-muted">
        <input type="checkbox" name="isPublished" defaultChecked={course?.isPublished ?? false} className="accent-[var(--gold)]" />
        Опубликован (виден ученикам с доступом)
      </label>

      {state.status !== 'idle' && state.message && (
        <div className={`text-sm ${state.status === 'ok' ? 'text-ok' : 'text-[var(--err)]'}`}>{state.message}</div>
      )}

      <button className="self-start rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright">
        {course?.id ? 'Сохранить курс' : 'Создать курс'}
      </button>
    </form>
  );
}
