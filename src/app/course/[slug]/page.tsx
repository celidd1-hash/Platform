import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import { getCoursePage, CourseProgram } from '@/features/courses';

export default async function CoursePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) notFound();

  const course = await getCoursePage(slug, userId);
  if (!course) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-8">
          <Link href="/" className="text-sm text-muted-2 hover:text-gold">
            ← Каталог
          </Link>
          <h1 className="mt-3 font-display text-4xl font-semibold">{course.title}</h1>
          <p className="mt-3 text-base leading-relaxed text-muted">{course.description}</p>

          {course.hasAccess ? (
            <div className="mt-6 flex items-center gap-4">
              <div className="flex-1">
                <div className="mb-2 flex justify-between text-sm text-muted">
                  <span>Прогресс курса</span>
                  <span className="text-gold-bright">{course.progressPct}%</span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-bg-2">
                  <div
                    className="h-full bg-gradient-to-r from-gold-deep to-gold-bright"
                    style={{ width: `${course.progressPct}%` }}
                  />
                </div>
              </div>
              {course.continueLessonId && (
                <Link
                  href={`/lesson/${course.continueLessonId}`}
                  className="rounded-xl bg-gradient-to-r from-gold-deep to-gold px-6 py-3 font-label text-sm tracking-[2px] text-[#1a1206] hover:to-gold-bright"
                >
                  {course.progressPct > 0 ? 'Продолжить' : 'Начать'}
                </Link>
              )}
            </div>
          ) : (
            <div className="mt-6 inline-block rounded-xl border border-line px-5 py-3 text-sm text-muted-2">
              🔒 Нет доступа к курсу. Доступ выдаёт администратор.
            </div>
          )}
        </header>

        <section>
          <div className="sectlabel mb-5">Программа курса</div>
          <CourseProgram slug={course.slug} modules={course.modules} />
        </section>
      </div>
    </AppShell>
  );
}
