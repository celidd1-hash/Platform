'use server';

import { revalidatePath } from 'next/cache';
import { auth, signOut } from '@/features/auth';
import {
  updateProfileSchema,
  changePasswordSchema,
  updateProfile,
  changePassword,
  deleteAccount,
} from './service';

/** Server actions профиля (ТЗ §3.6, §6А.11). Каждое требует аутентификацию. */

export type ProfileState = { status: 'idle' | 'ok' | 'error'; message?: string };

export async function updateProfileAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { status: 'error', message: 'Не авторизован' };

  const parsed = updateProfileSchema.safeParse({
    name: formData.get('name'),
    avatarUrl: formData.get('avatarUrl') ?? '',
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Проверьте поля' };
  }
  const res = await updateProfile(session.user.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };
  revalidatePath('/profile');
  return { status: 'ok', message: 'Профиль обновлён' };
}

export async function changePasswordAction(_prev: ProfileState, formData: FormData): Promise<ProfileState> {
  const session = await auth();
  if (!session?.user?.id) return { status: 'error', message: 'Не авторизован' };

  const parsed = changePasswordSchema.safeParse({
    current: formData.get('current'),
    next: formData.get('next'),
  });
  if (!parsed.success) {
    return { status: 'error', message: parsed.error.issues[0]?.message ?? 'Проверьте поля' };
  }
  const res = await changePassword(session.user.id, parsed.data);
  if (!res.ok) return { status: 'error', message: res.error };
  return { status: 'ok', message: 'Пароль изменён' };
}

export async function deleteAccountAction(): Promise<void> {
  const session = await auth();
  if (!session?.user?.id) return;
  await deleteAccount(session.user.id);
  await signOut({ redirectTo: '/register' });
}
