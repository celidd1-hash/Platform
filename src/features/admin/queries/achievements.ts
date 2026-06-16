import { db } from '@/lib/db';
import { Prisma } from '@prisma/client';

/** Доступ к БД для CRUD достижений админом (ТЗ §3.5). Prisma в queries/ — разрешено линтером. */

export function listAchievements() {
  return db.achievement.findMany({
    orderBy: { position: 'asc' },
    select: {
      id: true,
      code: true,
      title: true,
      description: true,
      icon: true,
      category: true,
      rarity: true,
      xpReward: true,
      conditionJson: true,
      targetValue: true,
      position: true,
    },
  });
}

export function createAchievement(data: {
  code: string;
  title: string;
  description: string;
  icon: string | null;
  category: string | null;
  rarity: string;
  xpReward: number;
  conditionJson: Prisma.InputJsonValue;
  targetValue: number;
  position: number;
}) {
  return db.achievement.create({ data });
}

export function updateAchievement(
  id: string,
  data: {
    title: string;
    description: string;
    icon: string | null;
    category: string | null;
    rarity: string;
    xpReward: number;
    conditionJson: Prisma.InputJsonValue;
    targetValue: number;
  },
) {
  return db.achievement.update({ where: { id }, data });
}

export function deleteAchievement(id: string) {
  return db.achievement.delete({ where: { id } });
}

export function achievementExists(id: string) {
  return db.achievement.findUnique({ where: { id }, select: { id: true } });
}

export function codeExists(code: string) {
  return db.achievement.findUnique({ where: { code }, select: { id: true } });
}
