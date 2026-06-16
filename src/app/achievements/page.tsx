import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import { getAchievementsPage, AchievementsGrid } from '@/features/gamification';

export const metadata = { title: 'Достижения — SVETOZAR SCHOOL' };

export default async function AchievementsPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const page = await getAchievementsPage(session.user.id);

  return (
    <AppShell>
      <header className="mb-7 flex items-end justify-between">
        <div>
          <div className="font-display text-base italic text-muted">Путь Мастера</div>
          <h1 className="mt-1 font-display text-4xl font-semibold">Достижения</h1>
        </div>
        <div className="flex items-center gap-6 font-display">
          <div className="text-center">
            <div className="text-3xl leading-none text-gold-bright">
              {page.earnedCount}<span className="text-muted-2">/{page.totalCount}</span>
            </div>
            <div className="mt-1 font-label text-[10px] uppercase tracking-[2px] text-muted-2">получено</div>
          </div>
          <div className="h-8 w-px bg-line" />
          <div className="text-center">
            <div className="text-3xl leading-none text-gold-bright">{page.totalXpFromAchievements}</div>
            <div className="mt-1 font-label text-[10px] uppercase tracking-[2px] text-muted-2">XP наград</div>
          </div>
        </div>
      </header>

      <AchievementsGrid achievements={page.achievements} />
    </AppShell>
  );
}
