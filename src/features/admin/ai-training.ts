import { z } from 'zod';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { HOMEWORK } from '@/config/constants';
import { writeAuditLog } from './queries';
import * as q from './queries/ai';

/**
 * Сервис «Обучение ИИ-агента» (ТЗ §3.4): база знаний по курсу + параметры проверки ДЗ.
 * Вызывается после проверки роли admin.
 */

export const settingsSchema = z.object({
  courseId: z.string().min(1),
  passScore: z.coerce.number().int().min(0).max(100),
  strictness: z.enum(['lenient', 'normal', 'strict']),
  promptTemplate: z.string().max(4000).optional(),
});

export const knowledgeSchema = z.object({
  courseId: z.string().min(1),
  title: z.string().trim().min(2).max(200),
  contentMd: z.string().trim().min(1).max(20_000),
});

export interface AiTrainingData {
  courses: Array<{ id: string; title: string }>;
  selected: { id: string; title: string } | null;
  settings: { passScore: number; strictness: string; promptTemplate: string | null };
  knowledge: Array<{ id: string; title: string; contentMd: string; createdAt: Date }>;
}

export async function getAiTraining(courseId?: string): Promise<AiTrainingData> {
  const courses = await q.listCourses();
  const selectedId = courseId ?? courses[0]?.id;
  if (!selectedId) {
    return {
      courses,
      selected: null,
      settings: { passScore: HOMEWORK.DEFAULT_PASS_SCORE, strictness: HOMEWORK.DEFAULT_STRICTNESS, promptTemplate: null },
      knowledge: [],
    };
  }

  const [course, settings, knowledge] = await Promise.all([
    q.getCourse(selectedId),
    q.getSettings(selectedId),
    q.listKnowledge(selectedId),
  ]);

  return {
    courses,
    selected: course,
    settings: settings ?? {
      passScore: HOMEWORK.DEFAULT_PASS_SCORE,
      strictness: HOMEWORK.DEFAULT_STRICTNESS,
      promptTemplate: null,
    },
    knowledge: knowledge.map((k) => ({ id: k.id, title: k.title, contentMd: k.contentMd, createdAt: k.createdAt })),
  };
}

export async function saveSettings(
  adminId: string,
  input: z.infer<typeof settingsSchema>,
): Promise<ActionResult<null>> {
  await q.upsertSettings(input.courseId, {
    passScore: input.passScore,
    strictness: input.strictness,
    promptTemplate: input.promptTemplate?.trim() || null,
  });
  await writeAuditLog({ actorId: adminId, action: 'ai_settings_update', targetType: 'course', targetId: input.courseId });
  return ok(null);
}

export async function addKnowledge(
  adminId: string,
  input: z.infer<typeof knowledgeSchema>,
): Promise<ActionResult<null>> {
  await q.createKnowledge({ courseId: input.courseId, title: input.title, contentMd: input.contentMd });
  await writeAuditLog({ actorId: adminId, action: 'ai_knowledge_add', targetType: 'course', targetId: input.courseId });
  return ok(null);
}

export async function removeKnowledge(adminId: string, id: string): Promise<ActionResult<null>> {
  const k = await q.knowledgeBelongsToCourse(id);
  if (!k) return fail('Запись не найдена');
  await q.deleteKnowledge(id);
  await writeAuditLog({ actorId: adminId, action: 'ai_knowledge_delete', targetType: 'course', targetId: k.courseId });
  return ok(null);
}
