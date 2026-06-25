import Link from 'next/link';
import type { CoursePageLesson } from '../service';

const badgeBase =
  'flex h-9 w-9 flex-none items-center justify-center rounded-full font-display text-sm';

/** Список уроков модуля — карточка урока: номер/статус, кнопка «Открыть»/«Повторить» (ТЗ §3.3). */
export function ModuleLessons({ lessons }: { lessons: CoursePageLesson[] }) {
  if (lessons.length === 0) {
    return <p className="text-sm text-muted-2">Уроков в модуле пока нет.</p>;
  }

  return (
    <div className="flex flex-col gap-3">
      {lessons.map((lesson, i) => {
        const card = (
          <div
            className={`flex items-center gap-4 rounded-token border px-4 py-4 transition-colors ${
              lesson.locked
                ? 'border-line bg-bg-2/40 opacity-70'
                : 'border-line bg-panel hover:border-gold/40'
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
    </div>
  );
}
