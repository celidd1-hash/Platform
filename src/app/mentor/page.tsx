import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import { MentorChat } from '@/features/mentor';

export const metadata = { title: 'AI-Наставник — SVETOZAR SCHOOL' };

export default async function MentorPage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  return (
    <AppShell>
      <header className="mb-6">
        <div className="font-display text-base italic text-muted">Путь Мастера</div>
        <h1 className="mt-1 font-display text-4xl font-semibold">AI-Наставник</h1>
      </header>
      <MentorChat />
    </AppShell>
  );
}
