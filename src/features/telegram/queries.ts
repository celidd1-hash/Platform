import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/** Доступ к БД фичи telegram (CLAUDE.md: Prisma только здесь). */

const LINK_TYPE = 'telegram_link';

export function createLinkToken(userId: string, tokenHash: string, expiresAt: Date) {
  return db.authToken.create({ data: { userId, type: LINK_TYPE, tokenHash, expiresAt } });
}

export function deleteUserLinkTokens(userId: string) {
  return db.authToken.deleteMany({ where: { userId, type: LINK_TYPE, usedAt: null } });
}

export function findLinkToken(tokenHash: string) {
  return db.authToken.findUnique({
    where: { tokenHash },
    select: { id: true, userId: true, type: true, usedAt: true, expiresAt: true },
  });
}

export function markTokenUsed(id: string) {
  return db.authToken.update({ where: { id }, data: { usedAt: new Date() } });
}

export function setTelegramChatId(userId: string, chatId: string) {
  return db.user.update({ where: { id: userId }, data: { telegramChatId: chatId } });
}

export function clearTelegram(userId: string) {
  return db.user.update({ where: { id: userId }, data: { telegramChatId: null } });
}

export function getUserNotify(userId: string) {
  return db.user.findUnique({
    where: { id: userId },
    select: { telegramChatId: true, notifyPrefs: true },
  });
}

export function getUserName(userId: string) {
  return db.user.findUnique({ where: { id: userId }, select: { name: true } });
}

/** id админов/кураторов с привязанным Telegram — для оповещений о ДЗ на доработку. */
export function listStaffWithTelegram() {
  return db.user
    .findMany({
      where: { role: { in: ['admin', 'curator'] }, telegramChatId: { not: null }, deletedAt: null },
      select: { id: true },
    })
    .then((rows) => rows.map((r) => r.id));
}

export function setNotifyPrefs(userId: string, prefs: Record<string, unknown>) {
  return db.user.update({
    where: { id: userId },
    data: { notifyPrefs: prefs as Prisma.InputJsonValue },
  });
}

// ── Очередь оповещений (ТЗ §3.9) ──

export function createNotification(data: {
  userId: string;
  type: string;
  payload: Prisma.InputJsonValue;
  channel: string;
  status: string;
  sentAt?: Date | null;
}) {
  return db.notification.create({ data });
}

export function markNotification(id: string, status: string, sentAt: Date | null) {
  return db.notification.update({ where: { id }, data: { status, sentAt } });
}
