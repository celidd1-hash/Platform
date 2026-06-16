import { z } from 'zod';

/** Контракты данных админ-действий (ARCHITECTURE.md §3). */
export const targetSchema = z.object({
  target: z.enum(['course', 'module', 'lesson']),
  id: z.string().min(1),
});

export const archiveSchema = targetSchema.extend({
  archived: z.boolean(),
});

export type TargetInput = z.infer<typeof targetSchema>;
export type ArchiveInput = z.infer<typeof archiveSchema>;
