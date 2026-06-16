import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { requireAdminWith2FA, AdminNav } from '@/features/admin';

/**
 * Единый каркас админ-зоны: серверная проверка роли admin + ОБЯЗАТЕЛЬНОЙ 2FA (ТЗ §6А.3).
 * Админа без 2FA отправляем в профиль для подключения (не под этим layout — без цикла).
 */
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const access = await requireAdminWith2FA();
  if (access.status === 'forbidden') redirect('/');
  if (access.status === 'need_2fa') redirect('/profile?setup2fa=1');

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
