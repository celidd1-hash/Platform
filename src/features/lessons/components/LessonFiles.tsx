import { formatBytes } from '@/lib/utils';

type LessonFile = { id: string; title: string; fileType: string; sizeBytes: number };

/**
 * Список файлов-вложений урока (ТЗ §3.3). Скачивание — по подписанной ссылке
 * с проверкой доступа (эндпоинт реализуется отдельно; здесь ссылка на него).
 */
export function LessonFiles({ lessonId, files }: { lessonId: string; files: LessonFile[] }) {
  if (files.length === 0) return null;

  return (
    <section>
      <div className="sectlabel mb-3">Материалы урока</div>
      <ul className="flex flex-col gap-2">
        {files.map((file) => (
          <li
            key={file.id}
            className="flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3"
          >
            <div className="min-w-0">
              <div className="truncate text-sm text-ink">{file.title}</div>
              <div className="font-label text-[11px] uppercase tracking-[1px] text-muted-2">
                {file.fileType} · {formatBytes(file.sizeBytes)}
              </div>
            </div>
            <a
              href={`/api/files/${lessonId}/${file.id}`}
              className="flex-none rounded-lg border border-line-strong px-3 py-1.5 font-label text-xs tracking-[1px] text-gold-bright transition-colors hover:bg-[rgba(200,160,79,0.08)]"
            >
              Скачать
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
