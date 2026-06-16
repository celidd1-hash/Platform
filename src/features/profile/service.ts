import { z } from 'zod';
import { computeProgressPct } from '@/lib/progress';
import { hashPassword, verifyPassword } from '@/lib/password';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { PASSWORD } from '@/config/constants';
import * as q from './queries';

/** Бизнес-логика профиля (ТЗ §3.6, §6А.11): сводка, смена пароля/имени, экспорт, удаление. */

export const updateProfileSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(80),
  avatarUrl: z.string().trim().url('Некорректная ссылка').max(500).optional().or(z.literal('')),
});

export const changePasswordSchema = z.object({
  current: z.string().min(1, 'Введите текущий пароль'),
  next: z.string().min(PASSWORD.MIN_LENGTH, `Минимум ${PASSWORD.MIN_LENGTH} символов`).max(128),
});

export interface ProfileData {
  id: string;
  name: string;
  email: string;
  avatarUrl: string | null;
  xp: number;
  streakDays: number;
  rank: number;
  achievements: number;
  isPublicInRating: boolean;
  telegramConnected: boolean;
  createdAt: Date;
  courses: Array<{ id: string; title: string; slug: string; progressPct: number }>;
  homework: Array<{
    id: string;
    course: string;
    lesson: string;
    verdict: string | null;
    score: number | null;
    feedback: string | null;
    createdAt: Date;
  }>;
}

export async function getProfile(userId: string): Promise<ProfileData | null> {
  const user = await q.getUser(userId);
  if (!user) return null;

  const [rank, achievements, enrollments, completedIds, homework] = await Promise.all([
    q.getRank(userId, user.xp),
    q.countAchievements(userId),
    q.getEnrollments(userId),
    q.getCompletedLessonIds(userId),
    q.getHomeworkHistory(userId),
  ]);
  const completed = new Set(completedIds);

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    avatarUrl: user.avatarUrl,
    xp: user.xp,
    streakDays: user.streakDays,
    rank,
    achievements,
    isPublicInRating: user.isPublicInRating,
    telegramConnected: !!user.telegramChatId,
    createdAt: user.createdAt,
    courses: enrollments.map((e) => {
      const lessonIds = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
      const done = lessonIds.filter((id) => completed.has(id)).length;
      return {
        id: e.course.id,
        title: e.course.title,
        slug: e.course.slug,
        progressPct: computeProgressPct(lessonIds.length, done),
      };
    }),
    homework: homework.map((h) => ({
      id: h.id,
      course: h.lesson.module.course.title,
      lesson: h.lesson.title,
      verdict: h.verdict,
      score: h.score,
      feedback: h.feedback,
      createdAt: h.createdAt,
    })),
  };
}

export async function updateProfile(
  userId: string,
  input: z.infer<typeof updateProfileSchema>,
): Promise<ActionResult<null>> {
  await q.updateProfile(userId, { name: input.name, avatarUrl: input.avatarUrl?.trim() || null });
  return ok(null);
}

export async function changePassword(
  userId: string,
  input: z.infer<typeof changePasswordSchema>,
): Promise<ActionResult<null>> {
  const row = await q.getAuthHash(userId);
  if (!row) return fail('Пользователь не найден');
  const valid = await verifyPassword(row.passwordHash, input.current);
  if (!valid) return fail('Текущий пароль неверен');

  const hash = await hashPassword(input.next);
  await q.updatePasswordHash(userId, hash);
  await q.writeAuditLog({ actorId: userId, action: 'password_change', targetType: 'user', targetId: userId });
  return ok(null);
}

export async function deleteAccount(userId: string): Promise<ActionResult<null>> {
  await q.writeAuditLog({ actorId: userId, action: 'account_delete', targetType: 'user', targetId: userId });
  await q.deleteUser(userId);
  return ok(null);
}

export async function exportData(userId: string): Promise<ActionResult<unknown>> {
  const data = await q.getExport(userId);
  if (!data) return fail('Нет данных');
  return ok(data);
}
