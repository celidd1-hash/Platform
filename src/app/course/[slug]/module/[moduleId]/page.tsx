import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import { getModulePage, ModuleLessons } from '@/features/courses';

/** «102» → «1 час 42 минуты». Русское склонение часов/минут. */
function formatDuration(totalMin: number): string {
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  const parts: string[] = [];
  if (h > 0) parts.push(`${h} ${plural(h, 'час', 'часа', 'часов')}`);
  if (m > 0) parts.push(`${m} ${plural(m, 'минута', 'минуты', 'минут')}`);
  return parts.join(' ') || '0 минут';
}

function pluralLessons(n: number): string {
  return plural(n, 'урок', 'урока', 'уроков');
}

function plural(n: number, one: string, few: string, many: string): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return one;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 10 || mod100 >= 20)) return few;
  return many;
}

export default async function ModulePage({
  params,
}: {
  params: Promise<{ slug: string; moduleId: string }>;
}) {
  const { slug, moduleId } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) notFound();

  const mod = await getModulePage(slug, moduleId, userId);
  if (!mod) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <Link
          href={`/course/${mod.courseSlug}`}
          className="text-sm text-muted-2 hover:text-gold"
        >
          ← Назад к курсу
        </Link>

        {/* Плашка модуля */}
        <div className="mt-4 rounded-token border border-line bg-panel p-8">
          <div className="font-label text-xs uppercase tracking-[3px] text-muted-2">
            Модуль {mod.modulePosition + 1}
          </div>
          <h1 className="mt-3 font-display text-4xl font-semibold leading-tight">{mod.moduleTitle}</h1>

          {mod.resultText && (
            <p className="mt-4 text-base leading-relaxed text-muted">
              <span className="text-muted-2">Результат модуля:</span> {mod.resultText}
            </p>
          )}

          <div className="mt-7">
            <div className="mb-2 flex justify-between text-sm text-muted">
              <span>
                Прогресс: {mod.lessonsDone} из {mod.lessonsTotal} уроков
              </span>
              <span className="text-gold-bright">{mod.progressPct}%</span>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-bg-2">
              <div
                className="h-full bg-gradient-to-r from-gold-deep to-gold-bright"
                style={{ width: `${mod.progressPct}%` }}
              />
            </div>
          </div>

          {mod.durationMinutes != null && mod.durationMinutes > 0 && (
            <div className="mt-5 flex items-center gap-2 text-base text-muted">
              <span aria-hidden>🕑</span>
              <span>
                Время прохождения модуля:{' '}
                <span className="text-ink">{formatDuration(mod.durationMinutes)}</span>{' '}
                <span className="text-muted-2">
                  ({mod.lessonsTotal} {pluralLessons(mod.lessonsTotal)})
                </span>
              </span>
            </div>
          )}
        </div>

        <section className="mt-10">
          <div className="sectlabel mb-5">Уроки модуля</div>
          <ModuleLessons lessons={mod.lessons} />
        </section>
      </div>
    </AppShell>
  );
}
