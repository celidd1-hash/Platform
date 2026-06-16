import { z } from 'zod';
import { HOMEWORK } from '@/config/constants';

/**
 * Контракты данных ДЗ (ARCHITECTURE.md §3, ТЗ §3.4).
 * Текст ученика валидируется по длине; при проверке передаётся ИИ как ДАННЫЕ (§6А.8).
 */
export const submitHomeworkSchema = z.object({
  lessonId: z.string().min(1),
  text: z
    .string()
    .trim()
    .min(1, 'Напишите конспект')
    .max(HOMEWORK.MAX_LENGTH, 'Слишком длинный текст'),
});

export type SubmitHomeworkInput = z.infer<typeof submitHomeworkSchema>;
