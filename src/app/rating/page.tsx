import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import {
  getLeaderboard,
  getSummary,
  Leaderboard,
  type LeaderboardPeriod,
} from '@/features/gamification';

export const metadata = { title: 'Рейтинг — SVETOZAR SCHOOL' };

export default async function RatingPage({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const { period: periodParam } = await searchParams;
  const period: LeaderboardPeriod = periodParam === 'month' ? 'month' : 'all';
  const [rows, summary] = await Promise.all([
    getLeaderboard(period, session.user.id),
    getSummary(session.user.id),
  ]);

  return (
    <AppShell>
      <header className="mb-7">
        <div className="font-display text-base italic text-muted">Путь Мастера</div>
        <h1 className="mt-1 font-display text-4xl font-semibold">Рейтинг учеников</h1>
      </header>
      <Leaderboard rows={rows} period={period} isPublic={summary.isPublicInRating} />
    </AppShell>
  );
}
