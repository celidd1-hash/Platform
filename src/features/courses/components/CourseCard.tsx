import Link from 'next/link';
import type { CatalogCourse } from '../service';

/** Карточка курса в каталоге (ТЗ §3.2). «Глупый» презентационный компонент. */
export function CourseCard({ course }: { course: CatalogCourse }) {
  const locked = course.status === 'locked';

  return (
    <article className="flex flex-col rounded-token border border-line bg-gradient-to-b from-panel-2 to-panel p-6">
      <h3 className="font-display text-2xl font-semibold leading-tight">{course.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted">{course.description}</p>

      <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 font-label text-xs tracking-[1px] text-muted-2">
        {course.durationWeeks != null && <span>{course.durationWeeks} недель</span>}
        <span>{course.moduleCount} модулей</span>
        <span>{course.lessonCount} уроков</span>
      </div>

      {course.status === 'continue' && (
        <div className="mt-4">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>Прогресс</span>
            <span className="text-gold-bright">{course.progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-2">
            <div
              className="h-full bg-gradient-to-r from-gold-deep to-gold-bright"
              style={{ width: `${course.progressPct}%` }}
            />
          </div>
        </div>
      )}

      <div className="mt-5">
        {locked ? (
          <div className="w-full rounded-xl border border-line py-3 text-center font-label text-sm tracking-[2px] text-muted-2">
            🔒 Недоступен
          </div>
        ) : (
          <Link
            href={`/course/${course.slug}`}
            className="block w-full rounded-xl bg-gradient-to-r from-gold-deep to-gold py-3 text-center font-label text-sm tracking-[2px] text-[#1a1206] transition-colors hover:to-gold-bright"
          >
            {course.status === 'continue' ? 'Продолжить' : 'Начать обучение'}
          </Link>
        )}
      </div>
    </article>
  );
}
