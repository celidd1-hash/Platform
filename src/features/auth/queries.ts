import { db } from '@/lib/db';
import { Role, Prisma } from '@prisma/client';

/**
 * Доступ к БД фичи auth (CLAUDE.md: Prisma ТОЛЬКО здесь).
 * Бизнес-решения (хеширование, enumeration-safety) — в service.ts, не тут.
 */

export function findUserByEmail(email: string) {
  return db.user.findUnique({ where: { email } });
}

export function findUserById(id: string) {
  return db.user.findUnique({ where: { id } });
}

/** Новые аккаунты ВСЕГДА role=student (ТЗ §6А.3). Роль задаётся жёстко тут. */
export function createStudent(data: { email: string; name: string; passwordHash: string }) {
  return db.user.create({
    data: {
      email: data.email,
      name: data.name,
      passwordHash: data.passwordHash,
      role: Role.student,
    },
  });
}

export function setEmailVerified(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { emailVerifiedAt: new Date() },
  });
}

export function updatePasswordHash(userId: string, passwordHash: string) {
  return db.user.update({ where: { id: userId }, data: { passwordHash } });
}

// ── 2FA (TOTP, ТЗ §6А.2) ──

export function getTwoFactor(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: { twoFactorEnabled: true, twoFactorSecret: true, email: true },
  });
}

/** Сохранить (зашифрованный) секрет, ещё НЕ включая 2FA — до подтверждения кодом. */
export function setTwoFactorSecret(userId: string, encryptedSecret: string) {
  return db.user.update({
    where: { id: userId },
    data: { twoFactorSecret: encryptedSecret, twoFactorEnabled: false },
  });
}

export function enableTwoFactor(userId: string) {
  return db.user.update({ where: { id: userId }, data: { twoFactorEnabled: true } });
}

export function disableTwoFactor(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { twoFactorEnabled: false, twoFactorSecret: null },
  });
}

// ── Одноразовые токены (подтверждение email / сброс пароля) ──

export function createAuthToken(data: {
  userId: string;
  type: string;
  tokenHash: string;
  expiresAt: Date;
}) {
  return db.authToken.create({ data });
}

export function findAuthToken(tokenHash: string) {
  return db.authToken.findUnique({ where: { tokenHash } });
}

export function markTokenUsed(id: string) {
  return db.authToken.update({ where: { id }, data: { usedAt: new Date() } });
}

/** Удаляет неиспользованные токены этого типа у пользователя (перед выпуском нового). */
export function deleteUserTokens(userId: string, type: string) {
  return db.authToken.deleteMany({ where: { userId, type, usedAt: null } });
}

// ── Аудит (ТЗ §6А.9) ──

export function writeAuditLog(data: {
  actorId?: string | null;
  action: string;
  targetType?: string;
  targetId?: string;
  meta?: Prisma.InputJsonValue;
}) {
  return db.auditLog.create({
    data: {
      actorId: data.actorId ?? null,
      action: data.action,
      targetType: data.targetType,
      targetId: data.targetId,
      meta: data.meta,
    },
  });
}
