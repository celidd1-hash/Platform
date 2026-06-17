import { formatBytes } from '@/lib/utils';

type LessonFile = { id: string; title: string; fileType: string; sizeBytes: number };

/**
 * Список файлов-вложений урока (ТЗ §3.3). Скачивание — по подписанной ссылке
 * с проверкой доступа. Конспекты открыты только после просмотра видео и (если урок
 * требует) отправки ДЗ — пока закрыто, показываем подсказку вместо ссылки.
 */
export function LessonFiles({
  lessonId,
  files,
  materialsUrl,
  unlocked,
  lockHint,
}: {
  lessonId: string;
  files: LessonFile[];
  materialsUrl: string | null;
  unlocked: boolean;
  lockHint: string;
}) {
  if (files.length === 0 && !materialsUrl) return null;

  return (
    <section>
      <div className="sectlabel mb-3">Материалы урока</div>
      {!unlocked && (
        <p className="mb-3 rounded-xl border border-dashed border-line bg-bg-2/50 px-4 py-3 text-xs text-muted-2">
          🔒 {lockHint}
        </p>
      )}

      {materialsUrl && (
        <div className="mb-2 flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3">
          <div className="min-w-0">
            <div className="truncate text-sm text-ink">Материалы курса (внешний диск)</div>
            <div className="font-label text-[11px] uppercase tracking-[1px] text-muted-2">
              Просмотр и скачивание
            </div>
          </div>
          {unlocked ? (
            <a
              href={materialsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-none rounded-lg border border-line-strong px-3 py-1.5 font-label text-xs tracking-[1px] text-gold-bright transition-colors hover:bg-[rgba(200,160,79,0.08)]"
            >
              Открыть
            </a>
          ) : (
            <span className="flex-none rounded-lg border border-line px-3 py-1.5 font-label text-xs tracking-[1px] text-muted-2">
              🔒 Закрыто
            </span>
          )}
        </div>
      )}

      <ul className="flex flex-col gap-2">
        {files.map((file) => (
          <li
            key={file.id}
            className={`flex items-center justify-between rounded-xl border border-line bg-panel px-4 py-3 ${unlocked ? '' : 'opacity-60'}`}
          >
            <div className="min-w-0">
              <div className="truncate text-sm text-ink">{file.title}</div>
              <div className="font-label text-[11px] uppercase tracking-[1px] text-muted-2">
                {file.fileType} · {formatBytes(file.sizeBytes)}
              </div>
            </div>
            {unlocked ? (
              <a
                href={`/api/files/${lessonId}/${file.id}`}
                className="flex-none rounded-lg border border-line-strong px-3 py-1.5 font-label text-xs tracking-[1px] text-gold-bright transition-colors hover:bg-[rgba(200,160,79,0.08)]"
              >
                Скачать
              </a>
            ) : (
              <span className="flex-none rounded-lg border border-line px-3 py-1.5 font-label text-xs tracking-[1px] text-muted-2">
                🔒 Закрыто
              </span>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
