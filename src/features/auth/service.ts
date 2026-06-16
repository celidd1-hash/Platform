import { randomBytes, createHash } from 'node:crypto';
import { hashPassword, verifyPassword } from '@/lib/password';
import { getEmailProvider } from '@/lib/providers/email';
import { rateLimit, rateLimitReset } from '@/lib/rate-limit';
import { generateTotpSecret, totpKeyUri, verifyTotp } from '@/lib/totp';
import { encryptSecret, decryptSecret } from '@/lib/crypto';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { env } from '@/config/env';
import { RATE_LIMITS, TOKEN_TTL } from '@/config/constants';
import type { RegisterInput, ResetPasswordInput } from './schema';
import * as q from './queries';

/**
 * Бизнес-логика аутентификации (ARCHITECTURE.md §1, ТЗ §3.1 / §6А.2-3).
 * Принципы: enumeration-safe ответы, argon2id, одноразовые токены, rate-limit.
 */

const TOKEN_TYPE = { EMAIL_VERIFY: 'email_verify', PASSWORD_RESET: 'password_reset' } as const;

function generateToken(): { raw: string; hash: string } {
  const raw = randomBytes(32).toString('hex');
  const hash = createHash('sha256').update(raw).digest('hex');
  return { raw, hash };
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

async function issueToken(userId: string, type: string, ttlMs: number): Promise<string> {
  await q.deleteUserTokens(userId, type);
  const { raw, hash } = generateToken();
  await q.createAuthToken({ userId, type, tokenHash: hash, expiresAt: new Date(Date.now() + ttlMs) });
  return raw;
}

async function sendVerifyEmail(email: string, rawToken: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_APP_URL}/verify?token=${rawToken}`;
  await getEmailProvider().send(
    email,
    'Подтверждение email — SVETOZAR SCHOOL',
    `<p>Добро пожаловать на Путь Мастера.</p>
     <p>Подтвердите email, перейдя по ссылке (действует 30 минут):</p>
     <p><a href="${url}">${url}</a></p>`,
  );
}

async function sendResetEmail(email: string, rawToken: string): Promise<void> {
  const url = `${env.NEXT_PUBLIC_APP_URL}/reset/${rawToken}`;
  await getEmailProvider().send(
    email,
    'Сброс пароля — SVETOZAR SCHOOL',
    `<p>Вы запросили сброс пароля.</p>
     <p>Перейдите по ссылке, чтобы задать новый пароль (действует 30 минут):</p>
     <p><a href="${url}">${url}</a></p>
     <p>Если это были не вы — просто проигнорируйте письмо.</p>`,
  );
}

/**
 * Регистрация. Enumeration-safe: при любом исходе ответ одинаков (ТЗ §6А.2).
 * Если email уже занят — новый аккаунт не создаём, но возвращаем тот же успех.
 */
export async function registerUser(input: RegisterInput): Promise<void> {
  const existing = await q.findUserByEmail(input.email);
  if (existing) {
    // Не раскрываем существование аккаунта. Можно мягко уведомить владельца.
    await getEmailProvider().send(
      input.email,
      'Попытка регистрации — SVETOZAR SCHOOL',
      `<p>На этот email уже есть аккаунт. Если это были вы — просто войдите или восстановите пароль.</p>`,
    );
    return;
  }

  const passwordHash = await hashPassword(input.password);
  const user = await q.createStudent({
    email: input.email,
    name: input.name,
    passwordHash,
  });
  const rawToken = await issueToken(user.id, TOKEN_TYPE.EMAIL_VERIFY, TOKEN_TTL.EMAIL_VERIFY_MS);
  await sendVerifyEmail(user.email, rawToken);
}

/** Подтверждение email по одноразовому токену. */
export async function verifyEmail(rawToken: string): Promise<{ ok: boolean }> {
  const token = await q.findAuthToken(hashToken(rawToken));
  if (
    !token ||
    token.type !== TOKEN_TYPE.EMAIL_VERIFY ||
    token.usedAt ||
    token.expiresAt < new Date()
  ) {
    return { ok: false };
  }
  await q.setEmailVerified(token.userId);
  await q.markTokenUsed(token.id);
  return { ok: true };
}

/**
 * Запрос сброса пароля. Enumeration-safe: всегда одинаковый успех (ТЗ §6А.2).
 */
export async function requestPasswordReset(email: string): Promise<void> {
  const user = await q.findUserByEmail(email);
  if (!user) return; // молча — не раскрываем отсутствие аккаунта
  const rawToken = await issueToken(user.id, TOKEN_TYPE.PASSWORD_RESET, TOKEN_TTL.PASSWORD_RESET_MS);
  await sendResetEmail(user.email, rawToken);
}

/** Установка нового пароля по токену сброса. Инвалидирует токен. */
export async function resetPassword(input: ResetPasswordInput): Promise<{ ok: boolean }> {
  const token = await q.findAuthToken(hashToken(input.token));
  if (
    !token ||
    token.type !== TOKEN_TYPE.PASSWORD_RESET ||
    token.usedAt ||
    token.expiresAt < new Date()
  ) {
    return { ok: false };
  }
  const passwordHash = await hashPassword(input.password);
  await q.updatePasswordHash(token.userId, passwordHash);
  await q.markTokenUsed(token.id);
  await q.writeAuditLog({ actorId: token.userId, action: 'password_change' });
  return { ok: true };
}

export type AuthenticatedUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

/**
 * Проверка учётных данных для NextAuth (ТЗ §6А.2-3).
 * Возвращает пользователя или null. Внутри: rate-limit, argon2-verify,
 * требование подтверждённого email. Ошибки — без раскрытия деталей.
 */
export async function authenticateCredentials(
  email: string,
  password: string,
  token?: string,
): Promise<AuthenticatedUser | null> {
  const limit = rateLimit(
    `login:${email}`,
    RATE_LIMITS.LOGIN_ATTEMPTS,
    RATE_LIMITS.LOGIN_LOCKOUT_MS,
  );
  if (!limit.allowed) return null;

  const user = await q.findUserByEmail(email);
  if (!user) {
    // Тратим время на фиктивную проверку, чтобы не отличался тайминг (anti-enumeration).
    await verifyPassword(
      '$argon2id$v=19$m=19456,t=2,p=1$Y2FmZWNhZmVjYWZlY2FmZQ$3hQp1mFf0Vn9rGZ8oQ0u6lH7nQ1c2x3y4z5a6b7c8d9',
      password,
    ).catch(() => false);
    return null;
  }

  const valid = await verifyPassword(user.passwordHash, password);
  if (!valid) return null;

  // Требуем подтверждённый email перед входом (ТЗ §3.1).
  if (!user.emailVerifiedAt) return null;

  // Заблокированный аккаунт не входит (ТЗ §3.7).
  if (user.isBlocked) return null;

  // Второй фактор (TOTP), если включён (ТЗ §6А.2). Обязателен для админов.
  if (user.twoFactorEnabled && user.twoFactorSecret) {
    if (!token) return null;
    const secret = decryptSecret(user.twoFactorSecret);
    if (!verifyTotp(token, secret)) return null;
  }

  rateLimitReset(`login:${email}`);
  await q.writeAuditLog({ actorId: user.id, action: 'login' });
  return { id: user.id, email: user.email, name: user.name, role: user.role };
}

// ── Настройка 2FA (TOTP, ТЗ §6А.2) ──

export interface TwoFactorStatus {
  enabled: boolean;
}

export async function getTwoFactorStatus(userId: string): Promise<TwoFactorStatus> {
  const row = await q.getTwoFactor(userId);
  return { enabled: !!row?.twoFactorEnabled };
}

/** Начать подключение 2FA: сгенерировать секрет (зашифровать), вернуть otpauth-URI для QR. */
export async function startTwoFactorSetup(
  userId: string,
): Promise<ActionResult<{ keyUri: string; secret: string }>> {
  const user = await q.getTwoFactor(userId);
  if (!user) return fail('Пользователь не найден');
  if (user.twoFactorEnabled) return fail('2FA уже включена');

  const secret = generateTotpSecret();
  await q.setTwoFactorSecret(userId, encryptSecret(secret));
  const keyUri = totpKeyUri(user.email, secret);
  return ok({ keyUri, secret });
}

/** Подтвердить и включить 2FA кодом из приложения-аутентификатора. */
export async function confirmTwoFactor(userId: string, code: string): Promise<ActionResult<null>> {
  const user = await q.getTwoFactor(userId);
  if (!user?.twoFactorSecret) return fail('Сначала начните подключение 2FA');
  const secret = decryptSecret(user.twoFactorSecret);
  if (!verifyTotp(code, secret)) return fail('Неверный код. Попробуйте ещё раз.');
  await q.enableTwoFactor(userId);
  await q.writeAuditLog({ actorId: userId, action: 'two_factor_enable' });
  return ok(null);
}

/** Отключить 2FA (требует действующий код для подтверждения личности). */
export async function disableTwoFactor(userId: string, code: string): Promise<ActionResult<null>> {
  const user = await q.getTwoFactor(userId);
  if (!user?.twoFactorEnabled || !user.twoFactorSecret) return fail('2FA не включена');
  const secret = decryptSecret(user.twoFactorSecret);
  if (!verifyTotp(code, secret)) return fail('Неверный код');
  await q.disableTwoFactor(userId);
  await q.writeAuditLog({ actorId: userId, action: 'two_factor_disable' });
  return ok(null);
}
