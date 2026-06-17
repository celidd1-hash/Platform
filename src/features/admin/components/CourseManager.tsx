'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { archiveAction } from '../actions';
import type { AdminCourseNode, TargetType } from '../service';
import { DeleteConfirm } from './DeleteConfirm';

type DeleteTarget = { target: TargetType; id: string; title: string } | null;

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
            {course.modules.map((module) => (
              <div key={module.id} className="rounded-xl border border-line bg-bg-2">
                <div className="flex items-center justify-between gap-3 px-4 py-2.5">
                  <span className="font-label text-sm tracking-[1px] text-gold">{module.title}</span>
                  <RowControls
                    target="module"
                    id={module.id}
                    title={module.title}
                    archived={module.isArchived}
                    onDelete={setDel}
                  />
                </div>
                <ul className="border-t border-line">
                  {module.lessons.map((lesson) => (
                    <li
                      key={lesson.id}
                      className="flex items-center justify-between gap-3 border-b border-line px-4 py-2 last:border-b-0"
                    >
                      <span className={`text-sm ${lesson.isArchived ? 'text-muted-2 line-through' : 'text-ink'}`}>
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
              </div>
            ))}
            {course.modules.length === 0 && (
              <p className="text-xs text-muted-2">Модулей нет</p>
            )}
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
