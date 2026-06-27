import Link from 'next/link';
import type { CoursePageLesson } from '../service';

const badgeBase =
  'flex h-12 w-12 flex-none items-center justify-center rounded-full font-display text-lg';

/** «31» → «31 мин», «75» → «1 ч 15 мин». */
function formatDuration(min: number): string {
  if (min < 60) return `${min} мин`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h} ч ${m} мин` : `${h} ч`;
}

/** Список уроков модуля — карточка урока: номер, длительность + статус, кнопка (ТЗ §3.3). */
export function ModuleLessons({ lessons }: { lessons: CoursePageLesson[] }) {
  if (lessons.length === 0) {
    return <p className="text-base text-muted-2">Уроков в модуле пока нет.</p>;
  }

  return (
    <div className="flex flex-col gap-4">
      {lessons.map((lesson, i) => {
        const status = lesson.locked ? 'Закрыто' : lesson.completed ? 'Пройдено' : 'Доступен';

        const card = (
          <div
            className={`flex items-center gap-5 rounded-token border px-6 py-5 transition-colors ${
              lesson.locked
                ? 'border-line bg-bg-2/40 opacity-70'
                : 'border-line bg-panel hover:border-gold/40'
            }`}
          >
            <div
              className={`${badgeBase} ${
                lesson.locked
                  ? 'border border-line text-muted-2'
                  : 'bg-gradient-to-br from-gold-deep to-gold text-[#1a1206] shadow-[0_0_16px_rgba(200,160,79,0.35)]'
              }`}
            >
              {i + 1}
            </div>

            <div className="min-w-0 flex-1">
              <div className={`truncate text-lg ${lesson.locked ? 'text-muted-2' : 'text-ink'}`}>
                {lesson.title}
              </div>
              <div className="mt-1.5 flex items-center gap-3 font-label text-xs uppercase tracking-[1px] text-muted-2">
                {lesson.durationMinutes != null && lesson.durationMinutes > 0 && (
                  <span className="flex items-center gap-1.5">
                    <span aria-hidden>🕑</span>
                    {formatDuration(lesson.durationMinutes)}
                  </span>
                )}
                <span
                  className={`flex items-center gap-1.5 ${
                    lesson.locked ? 'text-muted-2' : lesson.completed ? 'text-ok' : 'text-gold'
                  }`}
                >
                  <span aria-hidden>{lesson.locked ? '🔒' : lesson.completed ? '✓' : '▶'}</span>
                  {status}
                </span>
              </div>
            </div>

            {lesson.locked ? (
              <span className="flex-none text-xl text-muted-2" aria-label="Закрыто">
                🔒
              </span>
            ) : (
              <span className="flex-none w-40 rounded-lg bg-gradient-to-r from-gold-deep to-gold py-2.5 text-center font-label text-sm tracking-[1px] text-[#1a1206] shadow-[0_0_16px_rgba(200,160,79,0.3)] transition-colors hover:to-gold-bright">
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
