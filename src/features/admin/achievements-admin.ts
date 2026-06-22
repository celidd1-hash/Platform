import { z } from 'zod';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { slugify } from '@/lib/utils';
import { ACHIEVEMENT_RARITY } from '@/config/constants';
import { writeAuditLog } from './queries';
import * as q from './queries/achievements';

/** Сервис CRUD достижений (ТЗ §3.5): добавлять/редактировать может только админ. */

export const achievementSchema = z.object({
  id: z.string().optional(),
  courseId: z.string().min(1).optional(), // не задан = общее достижение
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().min(2).max(400),
  icon: z.string().trim().max(8).optional(),
  category: z.string().trim().max(60).optional(),
  rarity: z.enum(['common', 'rare', 'epic', 'legendary']),
  xpReward: z.coerce.number().int().min(0).max(100000),
  conditionType: z.enum(['lesson_completed', 'module_completed', 'homework_passed', 'streak_days']),
  threshold: z.coerce.number().int().min(1).max(100000),
});

export type AchievementInput = z.infer<typeof achievementSchema>;

export interface AdminAchievement {
  id: string;
  code: string;
  courseId: string | null;
  courseTitle: string | null;
  title: string;
  description: string;
  icon: string | null;
  category: string | null;
  rarity: string;
  xpReward: number;
  conditionType: string;
  threshold: number;
}

export interface AchievementsAdminData {
  achievements: AdminAchievement[];
  courses: Array<{ id: string; title: string }>;
}

export async function listForAdmin(): Promise<AchievementsAdminData> {
  const [rows, courses] = await Promise.all([q.listAchievements(), q.listCourses()]);
  const achievements = rows.map((a) => {
    const cond = a.conditionJson as { type?: string; threshold?: number } | null;
    return {
      id: a.id,
      code: a.code,
      courseId: a.courseId,
      courseTitle: a.course?.title ?? null,
      title: a.title,
      description: a.description,
      icon: a.icon,
      category: a.category,
      rarity: a.rarity,
      xpReward: a.xpReward,
      conditionType: cond?.type ?? 'lesson_completed',
      threshold: cond?.threshold ?? a.targetValue ?? 1,
    };
  });
  return { achievements, courses };
}

export async function saveAchievement(
  adminId: string,
  input: AchievementInput,
): Promise<ActionResult<null>> {
  // Привязка к курсу опциональна; если задана — курс должен существовать.
  const courseId = input.courseId ?? null;
  if (courseId && !(await q.courseExists(courseId))) return fail('Курс не найден');

  const conditionJson = { type: input.conditionType, threshold: input.threshold };
  const common = {
    courseId,
    title: input.title,
    description: input.description,
    icon: input.icon?.trim() || null,
    category: input.category?.trim() || null,
    rarity: input.rarity,
    xpReward: input.xpReward,
    conditionJson,
    targetValue: input.threshold,
  };

  if (input.id) {
    const exists = await q.achievementExists(input.id);
    if (!exists) return fail('Достижение не найдено');
    await q.updateAchievement(input.id, common);
    await writeAuditLog({ actorId: adminId, action: 'achievement_update', targetType: 'achievement', targetId: input.id });
    return ok(null);
  }

  // Генерируем уникальный code из названия.
  let code = slugify(input.title) || `ach-${Date.now()}`;
  if (await q.codeExists(code)) code = `${code}-${Date.now()}`;
  const created = await q.createAchievement({ ...common, code, position: 999 });
  await writeAuditLog({ actorId: adminId, action: 'achievement_create', targetType: 'achievement', targetId: created.id });
  return ok(null);
}

export async function removeAchievement(adminId: string, id: string): Promise<ActionResult<null>> {
  const exists = await q.achievementExists(id);
  if (!exists) return fail('Достижение не найдено');
  await q.deleteAchievement(id);
  await writeAuditLog({ actorId: adminId, action: 'achievement_delete', targetType: 'achievement', targetId: id });
  return ok(null);
}

export const RARITIES = Object.values(ACHIEVEMENT_RARITY);
