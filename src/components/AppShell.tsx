import { auth, SignOutButton } from '@/features/auth';
import { Celebration } from '@/features/gamification';
import { Sidebar } from './ui/Sidebar';

/**
 * Композиционная оболочка приложения: читает сессию и собирает «глупый» Sidebar
 * с данными пользователя и кнопкой выхода (фоновые свечения + основная область, ТЗ §8).
 * Живёт вне components/ui, т.к. зависит от фичи auth (ARCHITECTURE.md §2).
 */
export async function AppShell({ children }: { children: React.ReactNode }) {
  const session = await auth();
  const user = session?.user
    ? {
        name: session.user.name ?? 'Ученик',
        email: session.user.email ?? '',
        role: session.user.role,
      }
    : null;

  return (
    <div className="relative flex min-h-screen overflow-hidden bg-bg">
      <div className="glow glow-a" aria-hidden />
      <div className="glow glow-b" aria-hidden />
      <Sidebar user={user} signOutSlot={<SignOutButton />} />
      <main className="relative z-10 flex-1 overflow-y-auto p-8">{children}</main>
      <Celebration />
    </div>
  );
}
