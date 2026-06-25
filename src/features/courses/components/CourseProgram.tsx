import Link from 'next/link';
import type { CoursePageModule } from '../service';

/**
 * Программа курса: модули — кликабельные карточки. Клик ведёт на страницу модуля,
 * где раскрываются его уроки (ТЗ §3.3).
 */
export function CourseProgram({ slug, modules }: { slug: string; modules: CoursePageModule[] }) {
  return (
    <div className="flex flex-col gap-4">
      {modules.map((module) => {
        const total = module.lessons.length;
        const done = module.lessons.filter((l) => l.completed).length;

        return (
          <Link
            key={module.id}
            href={`/course/${slug}/module/${module.id}`}
            className="flex items-center gap-4 rounded-token border border-line bg-panel px-5 py-5 transition-colors hover:border-gold/40"
          >
            <div className="min-w-0 flex-1">
              <div className="font-label text-sm tracking-[1px] text-gold">{module.title}</div>
              <div className="mt-1 font-label text-[11px] uppercase tracking-[1px] text-muted-2">
                {total === 0 ? 'Уроков пока нет' : `${done} из ${total} уроков пройдено`}
              </div>
            </div>
            <span className="flex-none text-gold-bright" aria-hidden>
              →
            </span>
          </Link>
        );
      })}
    </div>
  );
}
