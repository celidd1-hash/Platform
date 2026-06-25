import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import { getModulePage, ModuleLessons } from '@/features/courses';

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
      <Link
        href={`/course/${mod.courseSlug}`}
        className="text-xs text-muted-2 hover:text-gold"
      >
        ← Назад к курсу
      </Link>

      {/* Плашка модуля */}
      <div className="mt-3 rounded-token border border-line bg-panel p-6">
        <div className="font-label text-[11px] uppercase tracking-[2px] text-muted-2">
          Модуль {mod.modulePosition + 1}
        </div>
        <h1 className="mt-2 font-display text-3xl font-semibold">{mod.moduleTitle}</h1>

        <div className="mt-5">
          <div className="mb-1 flex justify-between text-xs text-muted">
            <span>
              Прогресс: {mod.lessonsDone} из {mod.lessonsTotal} уроков
            </span>
            <span className="text-gold-bright">{mod.progressPct}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-bg-2">
            <div
              className="h-full bg-gradient-to-r from-gold-deep to-gold-bright"
              style={{ width: `${mod.progressPct}%` }}
            />
          </div>
        </div>
      </div>

      <section className="mt-8">
        <div className="sectlabel mb-4">Уроки модуля</div>
        <ModuleLessons lessons={mod.lessons} />
      </section>
    </AppShell>
  );
}
