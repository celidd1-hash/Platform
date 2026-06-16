import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import { getCatalog, CourseCard } from '@/features/courses';
import { getSummary } from '@/features/gamification';

export default async function CatalogPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const [courses, summary] = userId
    ? await Promise.all([getCatalog(userId), getSummary(userId)])
    : [[], { xp: 0, streakDays: 0, isPublicInRating: true }];

  return (
    <AppShell>
      <header className="mb-8 flex items-end justify-between">
        <div>
          <div className="font-display text-base italic text-muted">Добро пожаловать на Путь</div>
          <h1 className="mt-1 font-display text-5xl font-semibold leading-none">
            Выберите свой <span className="text-gold-bright">путь</span>
          </h1>
        </div>
        <div className="flex items-center gap-6 font-display">
          <div className="text-center">
            <div className="text-3xl leading-none text-gold-bright">{summary.xp}</div>
            <div className="mt-1 font-label text-[10px] uppercase tracking-[2px] text-muted-2">опыт</div>
          </div>
          <div className="h-8 w-px bg-line" />
          <div className="text-center">
            <div className="text-3xl leading-none text-gold-bright">{summary.streakDays}</div>
            <div className="mt-1 font-label text-[10px] uppercase tracking-[2px] text-muted-2">дней подряд</div>
          </div>
        </div>
      </header>

      <section>
        <div className="sectlabel mb-5">Доступные курсы</div>
        {courses.length === 0 ? (
          <p className="text-sm text-muted">
            Пока нет доступных курсов. Доступ выдаёт администратор.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        )}
      </section>
    </AppShell>
  );
}
