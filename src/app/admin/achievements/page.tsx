import { listForAdmin, AchievementsAdmin } from '@/features/admin';

export const metadata = { title: 'Достижения — Админ — SVETOZAR SCHOOL' };

export default async function AdminAchievementsPage() {
  const achievements = await listForAdmin();

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Достижения</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Создание и редактирование достижений. Ученикам видны только их прогресс и награды (ТЗ §3.5).
        </p>
      </header>
      <AchievementsAdmin achievements={achievements} />
    </div>
  );
}
