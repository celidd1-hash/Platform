import Link from 'next/link';
import type { LessonNeighbor } from '../service';

/** Навигация между уроками: предыдущий/следующий (ТЗ §3.3). */
export function LessonNav({
  prev,
  next,
  courseSlug,
}: {
  prev: LessonNeighbor | null;
  next: LessonNeighbor | null;
  courseSlug: string;
}) {
  return (
    <nav className="flex items-center justify-between gap-3 border-t border-line pt-5">
      {prev ? (
        <Link
          href={`/lesson/${prev.id}`}
          className="flex-1 rounded-xl border border-line px-4 py-3 text-sm text-muted transition-colors hover:border-gold hover:text-ink"
        >
          ← <span className="text-muted-2">Предыдущий</span> {prev.title}
        </Link>
      ) : (
        <span className="flex-1" />
      )}

      <Link
        href={`/course/${courseSlug}`}
        className="rounded-xl border border-line px-4 py-3 text-sm text-muted-2 transition-colors hover:text-gold"
      >
        К программе
      </Link>

      {next ? (
        <Link
          href={`/lesson/${next.id}`}
          className="flex-1 rounded-xl border border-line px-4 py-3 text-right text-sm text-muted transition-colors hover:border-gold hover:text-ink"
        >
          {next.title} <span className="text-muted-2">Следующий</span> →
        </Link>
      ) : (
        <span className="flex-1" />
      )}
    </nav>
  );
}
