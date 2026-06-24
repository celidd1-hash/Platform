import { MENTOR } from '@/config/constants';
import * as q from './queries';

/**
 * Бизнес-логика ИИ-наставника (ТЗ §3): сбор контекста из курсов ученика — база знаний +
 * кастомный промт куратора, чтобы наставник отвечал по материалам курса, а не наугад.
 * Контекст берётся только из курсов с активным доступом (ТЗ §6А.3).
 */
export interface MentorContext {
  /** База знаний курсов ученика (для системного промта) или null. */
  knowledge: string | null;
  /** Указания куратора из /admin/ai (промт), объединённые по курсам, или null. */
  instructions: string | null;
}

function joinKnowledge(items: Array<{ title: string; contentMd: string }>): string {
  return items.map((k) => `# ${k.title}\n${k.contentMd}`).join('\n\n');
}

export async function buildMentorContext(userId: string): Promise<MentorContext> {
  const courses = await q.getEnrolledCoursesContext(userId);
  if (courses.length === 0) return { knowledge: null, instructions: null };

  const knowledgeParts: string[] = [];
  const instructionParts: string[] = [];
  for (const c of courses) {
    if (c.knowledge.length > 0) {
      knowledgeParts.push(`Курс «${c.title}»:\n${joinKnowledge(c.knowledge)}`);
    }
    if (c.promptTemplate?.trim()) {
      instructionParts.push(`Курс «${c.title}»: ${c.promptTemplate.trim()}`);
    }
  }

  let knowledge = knowledgeParts.length > 0 ? knowledgeParts.join('\n\n') : null;
  if (knowledge && knowledge.length > MENTOR.MAX_CONTEXT_CHARS) {
    knowledge = `${knowledge.slice(0, MENTOR.MAX_CONTEXT_CHARS)}\n…(контекст сокращён)`;
  }

  return {
    knowledge,
    instructions: instructionParts.length > 0 ? instructionParts.join('\n') : null,
  };
}
