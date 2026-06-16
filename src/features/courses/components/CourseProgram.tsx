import Link from 'next/link';
import type { CoursePageModule } from '../service';

/** Программа курса: аккордеон модулей с уроками и их статусом (ТЗ §3.3). */
export function CourseProgram({ modules }: { modules: CoursePageModule[] }) {
  return (
    <div className="flex flex-col gap-3">
      {modules.map((module) => (
        <details
          key={module.id}
          open
          className="overflow-hidden rounded-token border border-line bg-panel"
        >
          <summary className="cursor-pointer select-none px-5 py-4 font-label text-sm tracking-[1px] text-gold">
            {module.title}
          </summary>
          <ul className="border-t border-line">
            {module.lessons.map((lesson) => (
              <li key={lesson.id} className="border-b border-line last:border-b-0">
                {lesson.locked ? (
                  <div className="flex items-center justify-between px-5 py-3 text-sm text-muted-2">
                    <span>{lesson.title}</span>
                    <span aria-label="Закрыто">🔒</span>
                  </div>
                ) : (
                  <Link
                    href={`/lesson/${lesson.id}`}
                    className="flex items-center justify-between px-5 py-3 text-sm text-ink transition-colors hover:bg-[rgba(200,160,79,0.06)]"
                  >
                    <span>{lesson.title}</span>
                    <span className={lesson.completed ? 'text-ok' : 'text-muted-2'}>
                      {lesson.completed ? '✓ пройдено' : '○'}
                    </span>
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </details>
      ))}
    </div>
  );
}
