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

        // Кнопка по прогрессу модуля: ещё не начат → Открыть, в процессе → Продолжить,
        // всё пройдено → Повторить. У пустого модуля кнопки нет.
        const cta =
          total === 0 ? null : done === 0 ? 'Открыть' : done >= total ? 'Повторить' : 'Продолжить';

        return (
          <Link
            key={module.id}
            href={`/course/${slug}/module/${module.id}`}
            className="flex items-center gap-5 rounded-token border border-line bg-panel px-7 py-6 transition-colors hover:border-gold/40"
          >
            <div className="min-w-0 flex-1">
              <div className="font-label text-lg tracking-[1px] text-gold">{module.title}</div>
              <div className="mt-1.5 font-label text-xs uppercase tracking-[1px] text-muted-2">
                {total === 0 ? 'Уроков пока нет' : `${done} из ${total} уроков пройдено`}
              </div>
            </div>
            {cta && (
              <span className="flex-none w-40 rounded-lg border border-gold/40 py-2 text-center font-label text-sm tracking-[1px] text-gold-bright">
                {cta}
              </span>
            )}
          </Link>
        );
      })}
    </div>
  );
}
