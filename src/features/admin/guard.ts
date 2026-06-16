import { auth, getTwoFactorStatus } from '@/features/auth';
import { ROLES } from '@/config/constants';

/**
 * Серверный guard роли admin (ТЗ §6А.3, Дополнение №1 §5).
 * Возвращает id админа или null. Контроль доступа — на сервере, не только в UI.
 */
export async function requireAdmin(): Promise<{ id: string } | null> {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== ROLES.ADMIN) return null;
  return { id: session.user.id };
}

/**
 * Guard для админ-зоны с обязательной 2FA (ТЗ §6А.3: «админ-маршруты — зона с обязательной 2FA»).
 * Возвращает статус: нет доступа / нужна 2FA / ок.
 */
export async function requireAdminWith2FA(): Promise<
  { status: 'forbidden' } | { status: 'need_2fa' } | { status: 'ok'; id: string }
> {
  const admin = await requireAdmin();
  if (!admin) return { status: 'forbidden' };
  const tfa = await getTwoFactorStatus(admin.id);
  if (!tfa.enabled) return { status: 'need_2fa' };
  return { status: 'ok', id: admin.id };
}
