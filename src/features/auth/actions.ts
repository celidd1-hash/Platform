'use server';

import QRCode from 'qrcode';
import { AuthError } from 'next-auth';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { registerSchema, requestResetSchema, resetPasswordSchema } from './schema';
import {
  registerUser,
  requestPasswordReset,
  resetPassword,
  startTwoFactorSetup,
  confirmTwoFactor,
  disableTwoFactor,
} from './service';
import { signIn, signOut, auth } from './auth';

/**
 * Server actions (ARCHITECTURE.md §2,§6): тонкие обёртки валидация → service.
 * Возвращают типизированный FormState (не кидают наружу). Совместимы с useActionState.
 */
export type FormState = {
  status: 'idle' | 'success' | 'error';
  message?: string;
  fieldErrors?: Record<string, string>;
};

/** Успешный signIn бросает NEXT_REDIRECT — это не ошибка, его нужно пробросить. */
function isRedirectError(error: unknown): boolean {
  return (
    typeof error === 'object' &&
    error !== null &&
    'digest' in error &&
    typeof (error as { digest?: unknown }).digest === 'string' &&
    (error as { digest: string }).digest.startsWith('NEXT_REDIRECT')
  );
}

function fieldErrorsFrom(error: import('zod').ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || 'form';
    out[key] ??= issue.message;
  }
  return out;
}

export async function registerAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = registerSchema.safeParse({
    name: formData.get('name'),
    email: formData.get('email'),
    password: formData.get('password'),
    acceptTerms: formData.get('acceptTerms') === 'on',
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await registerUser(parsed.data);
  } catch {
    // Не раскрываем внутренние детали (ТЗ §6А.8).
    return { status: 'error', message: 'Не удалось завершить регистрацию. Попробуйте позже.' };
  }

  // Enumeration-safe: один и тот же ответ независимо от того, занят email или нет.
  return {
    status: 'success',
    message: 'Если аккаунт можно создать — мы отправили письмо для подтверждения email.',
  };
}

export async function requestResetAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = requestResetSchema.safeParse({ email: formData.get('email') });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  try {
    await requestPasswordReset(parsed.data.email);
  } catch {
    return { status: 'error', message: 'Не удалось обработать запрос. Попробуйте позже.' };
  }

  return {
    status: 'success',
    message: 'Если аккаунт с таким email существует — мы отправили ссылку для сброса пароля.',
  };
}

export async function resetPasswordAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const parsed = resetPasswordSchema.safeParse({
    token: formData.get('token'),
    password: formData.get('password'),
  });
  if (!parsed.success) {
    return { status: 'error', fieldErrors: fieldErrorsFrom(parsed.error) };
  }

  const result = await resetPassword(parsed.data).catch(() => ({ ok: false }));
  if (!result.ok) {
    return { status: 'error', message: 'Ссылка недействительна или истекла. Запросите новую.' };
  }
  return { status: 'success', message: 'Пароль обновлён. Теперь можно войти.' };
}

export async function logoutAction(): Promise<void> {
  await signOut({ redirectTo: '/login' });
}

// ── 2FA (TOTP, ТЗ §6А.2) ──

export async function startTwoFactorAction(): Promise<
  ActionResult<{ qrDataUrl: string; secret: string }>
> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');

  const res = await startTwoFactorSetup(session.user.id);
  if (!res.ok) return res;

  const qrDataUrl = await QRCode.toDataURL(res.data.keyUri);
  return ok({ qrDataUrl, secret: res.data.secret });
}

export async function confirmTwoFactorAction(code: string): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');
  return confirmTwoFactor(session.user.id, String(code ?? '').trim());
}

export async function disableTwoFactorAction(code: string): Promise<ActionResult<null>> {
  const session = await auth();
  if (!session?.user?.id) return fail('Не авторизован');
  return disableTwoFactor(session.user.id, String(code ?? '').trim());
}

export async function loginAction(_prev: FormState, formData: FormData): Promise<FormState> {
  try {
    await signIn('credentials', {
      email: formData.get('email'),
      password: formData.get('password'),
      token: formData.get('token') ?? '',
      redirectTo: '/',
    });
    return { status: 'success' };
  } catch (error) {
    // Успешный вход бросает redirect — пробрасываем его дальше.
    if (isRedirectError(error)) throw error;
    if (error instanceof AuthError) {
      // Единое сообщение — не раскрываем, что именно неверно (ТЗ §6А.2).
      return { status: 'error', message: 'Неверный email или пароль, либо email не подтверждён.' };
    }
    return { status: 'error', message: 'Не удалось войти. Попробуйте позже.' };
  }
}
