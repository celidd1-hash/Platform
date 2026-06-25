import Link from 'next/link';
import type { CoursePageModule } from '../service';

const badgeBase =
  'flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-sm';

/** Программа курса: модули с карточками уроков — номер, статус, кнопка «Открыть» (ТЗ §3.3). */
export function CourseProgram({ modules }: { modules: CoursePageModule[] }) {
  return (
    <div className="flex flex-col gap-4">
      {modules.map((module) => (
        <details
          key={module.id}
          open
          className="overflow-hidden rounded-token border border-line bg-panel"
        >
          <summary className="cursor-pointer select-none px-5 py-4 font-label text-sm tracking-[1px] text-gold">
            {module.title}
          </summary>

          <div className="flex flex-col gap-2 border-t border-line p-3">
            {module.lessons.map((lesson, i) => {
              const card = (
                <div
                  className={`flex items-center gap-4 rounded-xl border px-4 py-3 transition-colors ${
                    lesson.locked
                      ? 'border-line bg-bg-2/40 opacity-70'
                      : 'border-line bg-bg-2 hover:border-gold/40'
                  }`}
                >
                  <div
                    className={`${badgeBase} ${
                      lesson.locked
                        ? 'border border-line text-muted-2'
                        : lesson.completed
                          ? 'bg-gradient-to-br from-gold-deep to-gold text-[#1a1206]'
                          : 'border border-gold/50 text-gold-bright'
                    }`}
                  >
                    {lesson.completed ? '✓' : i + 1}
                  </div>

                  <div className="min-w-0 flex-1">
                    <div className={`truncate text-sm ${lesson.locked ? 'text-muted-2' : 'text-ink'}`}>
                      {lesson.title}
                    </div>
                    <div className="mt-0.5 font-label text-[11px] uppercase tracking-[1px] text-muted-2">
                      {lesson.locked ? 'Закрыто' : lesson.completed ? 'Пройдено' : 'Доступен'}
                    </div>
                  </div>

                  {lesson.locked ? (
                    <span className="flex-none text-muted-2" aria-label="Закрыто">
                      🔒
                    </span>
                  ) : (
                    <span className="flex-none rounded-lg border border-gold/40 px-4 py-1.5 font-label text-xs tracking-[1px] text-gold-bright">
                      {lesson.completed ? 'Повторить' : 'Открыть'}
                    </span>
                  )}
                </div>
              );

              return lesson.locked ? (
                <div key={lesson.id}>{card}</div>
              ) : (
                <Link key={lesson.id} href={`/lesson/${lesson.id}`} className="block">
                  {card}
                </Link>
              );
            })}

            {module.lessons.length === 0 && (
              <p className="px-2 py-1 text-xs text-muted-2">Уроков пока нет.</p>
            )}
          </div>
        </details>
      ))}
    </div>
  );
}
