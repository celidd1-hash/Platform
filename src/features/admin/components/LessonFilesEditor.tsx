'use client';

import { useActionState, useTransition } from 'react';
import { formatBytes } from '@/lib/utils';
import { uploadLessonFileAction, deleteLessonFileAction, type EditState } from '../course-edit-actions';

const initial: EditState = { status: 'idle' };

export interface EditorLessonFile {
  id: string;
  title: string;
  fileType: string;
  sizeBytes: number;
}

const ACCEPT = '.pdf,.docx,.pptx,.png,.jpg,.jpeg,.webp';

function DeleteButton({ fileId }: { fileId: string }) {
  const [pending, start] = useTransition();
  return (
    <button
      onClick={() => start(() => void deleteLessonFileAction(fileId))}
      disabled={pending}
      className="flex-none rounded-md border border-[rgba(196,90,90,0.4)] px-2.5 py-1 text-xs text-[var(--err)] transition-colors hover:bg-[rgba(196,90,90,0.08)] disabled:opacity-50"
    >
      Удалить
    </button>
  );
}

/**
 * Редактор конспектов урока (ТЗ §3.3): загрузка файла в Bunny Storage + список с удалением.
 * Лимит ~4 МБ (потолок тела запроса Vercel). Ученику файл откроется после просмотра + ДЗ.
 */
export function LessonFilesEditor({
  lessonId,
  files,
}: {
  lessonId: string;
  files: EditorLessonFile[];
}) {
  const [state, action, pending] = useActionState(uploadLessonFileAction, initial);

  return (
    <section className="flex flex-col gap-4 rounded-token border border-line bg-panel p-5">
      <div className="sectlabel">Конспекты (материалы)</div>

      {files.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li
              key={f.id}
              className="flex items-center justify-between rounded-xl border border-line bg-bg-2 px-4 py-2.5"
            >
              <div className="min-w-0">
                <div className="truncate text-sm text-ink">{f.title}</div>
                <div className="font-label text-[11px] uppercase tracking-[1px] text-muted-2">
                  {formatBytes(f.sizeBytes)}
                </div>
              </div>
              <DeleteButton fileId={f.id} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-2">Файлов пока нет.</p>
      )}

      <form action={action} className="flex flex-col gap-3 border-t border-line pt-4">
        <input type="hidden" name="lessonId" value={lessonId} />
        <input
          type="file"
          name="file"
          accept={ACCEPT}
          required
          className="block w-full text-sm text-muted file:mr-4 file:rounded-lg file:border-0 file:bg-bg-2 file:px-4 file:py-2 file:text-sm file:text-gold-bright hover:file:bg-[rgba(200,160,79,0.08)]"
        />
        <div className="flex items-center gap-3">
          <button
            disabled={pending}
            className="self-start rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright disabled:opacity-50"
          >
            {pending ? 'Загрузка…' : 'Загрузить конспект'}
          </button>
          {state.status !== 'idle' && state.message && (
            <span className={`text-sm ${state.status === 'ok' ? 'text-ok' : 'text-[var(--err)]'}`}>
              {state.message}
            </span>
          )}
        </div>
        <p className="font-label text-[11px] tracking-[1px] text-muted-2">
          PDF, DOCX, PPTX, PNG, JPEG, WEBP. До 4 МБ.
        </p>
      </form>
    </section>
  );
}
