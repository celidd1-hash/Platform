import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { requireAdmin, AdminNav } from '@/features/admin';

/**
 * Каркас админ-зоны: серверная проверка роли admin (ТЗ §6А.3).
 * 2FA для админа — по желанию (включается в профиле), не блокирует доступ.
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) redirect('/');

  return (
    <AppShell>
      <div className="mb-2 font-label text-[11px] uppercase tracking-[3px] text-muted-2">
        Администратор
      </div>
      <AdminNav />
      {children}
    </AppShell>
  );
}
