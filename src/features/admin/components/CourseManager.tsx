'use client';

import { useState, useTransition, useActionState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { archiveAction } from '../actions';
import { saveModuleAction, saveLessonAction, type EditState } from '../course-edit-actions';
import type { AdminCourseNode, TargetType } from '../service';
import { DeleteConfirm } from './DeleteConfirm';

type DeleteTarget = { target: TargetType; id: string; title: string } | null;

const addInitial: EditState = { status: 'idle' };
const addInputCls =
  'flex-1 rounded-lg border border-line bg-bg-2 px-3 py-1.5 text-sm text-ink outline-none focus:border-gold';

/** Название модуля с инлайн-переименованием. */
function ModuleTitle({
  courseId,
  moduleId,
  title,
}: {
  courseId: string;
  moduleId: string;
  title: string;
}) {
  const [editing, setEditing] = useState(false);
  const [state, action] = useActionState(saveModuleAction, addInitial);
  const router = useRouter();
  useEffect(() => {
    if (state.status === 'ok') {
      setEditing(false);
      router.refresh();
    }
  }, [state, router]);

  if (!editing) {
    return (
      <div className="flex min-w-0 items-center gap-2">
        <span className="truncate font-label text-sm tracking-[1px] text-gold">{title}</span>
        <button
          onClick={() => setEditing(true)}
          className="flex-none rounded-md border border-line px-2 py-0.5 text-[11px] text-muted transition-colors hover:text-gold"
        >
          Переименовать
        </button>
      </div>
    );
  }

  return (
    <form action={action} className="flex min-w-0 flex-1 items-center gap-2">
      <input type="hidden" name="id" value={moduleId} />
      <input type="hidden" name="courseId" value={courseId} />
      <input name="title" defaultValue={title} required minLength={2} autoFocus className={`${addInputCls} max-w-md`} />
      <button className="flex-none rounded-md border border-gold/40 px-2.5 py-1 text-xs text-gold-bright hover:bg-[rgba(200,160,79,0.08)]">
        Сохранить
      </button>
      <button
        type="button"
        onClick={() => setEditing(false)}
        className="flex-none rounded-md border border-line px-2.5 py-1 text-xs text-muted hover:text-ink"
      >
        Отмена
      </button>
      {state.status === 'error' && <span className="text-xs text-[var(--err)]">{state.message}</span>}
    </form>
  );
}

/** Быстрое добавление модуля прямо в списке курсов. */
function AddModuleRow({ courseId }: { courseId: string }) {
  const [state, action] = useActionState(saveModuleAction, addInitial);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state.status === 'ok') {
      formRef.current?.reset();
      router.refresh(); // показать новый модуль в списке сразу
    }
  }, [state, router]);
  return (
    <form
      ref={formRef}
      action={action}
      className="flex items-center gap-2 rounded-xl border border-dashed border-line px-4 py-2.5"
    >
      <input type="hidden" name="courseId" value={courseId} />
      <input
        name="title"
        required
        minLength={2}
        placeholder="Название нового модуля"
        className={addInputCls}
      />
      <button className="flex-none rounded-lg border border-gold/40 px-3 py-1.5 text-xs text-gold-bright hover:bg-[rgba(200,160,79,0.08)]">
        + Модуль
      </button>
      {state.status === 'error' && <span className="text-xs text-[var(--err)]">{state.message}</span>}
    </form>
  );
}

/** Быстрое добавление урока в модуль прямо в списке курсов. */
function AddLessonRow({ moduleId }: { moduleId: string }) {
  const [state, action] = useActionState(saveLessonAction, addInitial);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();
  useEffect(() => {
    if (state.status === 'ok') {
      formRef.current?.reset();
      router.refresh(); // показать новый урок в списке сразу (с кнопками, как у остальных)
    }
  }, [state, router]);
  return (
    <form
      ref={formRef}
      action={action}
      className="flex items-center gap-2 border-t border-line px-4 py-2.5"
    >
      <input type="hidden" name="moduleId" value={moduleId} />
      <input type="hidden" name="requiresNote" value="on" />
      <input
        name="title"
        required
        minLength={2}
        placeholder="Название нового урока"
        className={addInputCls}
      />
      <button className="flex-none rounded-lg border border-line px-3 py-1.5 text-xs text-muted hover:text-gold">
        + Урок
      </button>
      {state.status === 'error' && <span className="text-xs text-[var(--err)]">{state.message}</span>}
    </form>
  );
}

function RowControls({
  target,
  id,
  title,
  archived,
  onDelete,
}: {
  target: TargetType;
  id: string;
  title: string;
  archived: boolean;
  onDelete: (t: DeleteTarget) => void;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-none items-center gap-2">
      {archived && (
        <span className="rounded-md bg-[rgba(217,160,102,0.15)] px-2 py-0.5 text-[10px] uppercase tracking-[1px] text-[var(--warn)]">
          в архиве
        </span>
      )}
      <button
        onClick={() => startTransition(() => void archiveAction(target, id, !archived))}
        disabled={pending}
        className="rounded-md border border-line px-2.5 py-1 text-xs text-muted transition-colors hover:text-gold disabled:opacity-50"
      >
        {archived ? 'Восстановить' : 'Архивировать'}
      </button>
      <button
        onClick={() => onDelete({ target, id, title })}
        className="rounded-md border border-[rgba(196,90,90,0.4)] px-2.5 py-1 text-xs text-[var(--err)] transition-colors hover:bg-[rgba(196,90,90,0.08)]"
      >
        Удалить
      </button>
    </div>
  );
}

/**
 * Управление структурой курсов для админа (Дополнение №1): архив/восстановление/полное
 * удаление на уровнях курс→модуль→урок. Кнопки видны только в роли admin (страница защищена).
 */
export function CourseManager({ courses }: { courses: AdminCourseNode[] }) {
  const [del, setDel] = useState<DeleteTarget>(null);

  if (courses.length === 0) {
    return <p className="text-sm text-muted">Курсов пока нет.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {courses.map((course) => (
        <div
          key={course.id}
          className={`rounded-token border bg-panel ${course.isArchived ? 'border-[rgba(217,160,102,0.3)] opacity-70' : 'border-line'}`}
        >
          <div className="flex items-center justify-between gap-3 border-b border-line px-5 py-4">
            <div className="min-w-0">
              <div className="font-display text-xl font-semibold">{course.title}</div>
              <div className="font-label text-[11px] tracking-[1px] text-muted-2">
                {course.students} учеников · {course.isPublished ? 'опубликован' : 'черновик'}
              </div>
            </div>
            <div className="flex flex-none items-center gap-2">
              <Link
                href={`/admin/courses/${course.id}`}
                className="rounded-md border border-gold/40 px-2.5 py-1 text-xs text-gold-bright transition-colors hover:bg-[rgba(200,160,79,0.08)]"
              >
                Открыть / редактировать
              </Link>
              <RowControls
                target="course"
                id={course.id}
                title={course.title}
                archived={course.isArchived}
                onDelete={setDel}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3 p-4">
            {course.modules.map((module, mIdx) => {
              // Сквозная нумерация: модуль продолжает счёт уроков предыдущих модулей.
              const lessonOffset = course.modules
                .slice(0, mIdx)
                .reduce((sum, m) => sum + m.lessons.length, 0);
              return (
              <div key={module.id} className="rounded-xl border border-line bg-bg-2">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <ModuleTitle courseId={course.id} moduleId={module.id} title={module.title} />
                  <RowControls
                    target="module"
                    id={module.id}
                    title={module.title}
                    archived={module.isArchived}
                    onDelete={setDel}
                  />
                </div>
                <ul className="border-t border-line">
                  {module.lessons.map((lesson, i) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 last:border-b-0"
                    >
                      <span className={`flex items-center gap-3 text-sm ${lesson.isArchived ? 'text-muted-2 line-through' : 'text-ink'}`}>
                        <span className="flex h-9 w-9 flex-none items-center justify-center rounded-full border border-gold/50 font-display text-base text-gold-bright tabular-nums">
                          {lessonOffset + i + 1}
                        </span>
                        {lesson.title}
                      </span>
                      <div className="flex flex-none items-center gap-2">
                        <Link
                          href={`/admin/lesson/${lesson.id}/edit`}
                          className="rounded-md border border-line px-2.5 py-1 text-xs text-gold transition-colors hover:bg-[rgba(200,160,79,0.08)]"
                        >
                          Видео / описание
                        </Link>
                        <RowControls
                          target="lesson"
                          id={lesson.id}
                          title={lesson.title}
                          archived={lesson.isArchived}
                          onDelete={setDel}
                        />
                      </div>
                    </li>
                  ))}
                  {module.lessons.length === 0 && (
                    <li className="px-4 py-2 text-xs text-muted-2">Уроков нет</li>
                  )}
                </ul>
                <AddLessonRow moduleId={module.id} />
              </div>
              );
            })}
            {course.modules.length === 0 && (
              <p className="text-xs text-muted-2">Модулей нет</p>
            )}
            <AddModuleRow courseId={course.id} />
          </div>
        </div>
      ))}

      {del && (
        <DeleteConfirm
          target={del.target}
          id={del.id}
          title={del.title}
          onClose={() => setDel(null)}
        />
      )}
    </div>
  );
}
