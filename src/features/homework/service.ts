import { getAiProvider } from '@/lib/providers/ai';
import { rateLimit } from '@/lib/rate-limit';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { HOMEWORK, HOMEWORK_VERDICT, RATE_LIMITS } from '@/config/constants';
import { onLessonCompleted, onHomeworkPassed, type LessonCompletionReward } from '@/features/gamification';
import { notifyHomeworkResult, notifyStaffHomeworkNeedsWork } from '@/features/telegram';
import * as q from './queries';

/**
 * Бизнес-логика проверки ДЗ ИИ-наставником (ТЗ §3.4, §6А.8).
 * Доступ по enrollment, rate-limit, проверка длины, проверка ИИ по базе знаний,
 * fallback при недоступном API (статус «на проверке», урок временно засчитывается).
 */

export interface SubmitResult {
  verdict: 'passed' | 'needs_work' | 'pending';
  score: number | null;
  feedback: string | null;
  attemptNo: number;
  lessonCompleted: boolean;
  /** Награда для плашки-поздравления (есть, если урок засчитан этим действием). */
  reward?: LessonCompletionReward;
}

export async function submitHomework(
  userId: string,
  lessonId: string,
  text: string,
): Promise<ActionResult<SubmitResult>> {
  const lesson = await q.getLessonForCheck(lessonId);
  if (!lesson) return fail('Урок не найден');

  const courseId = lesson.module.course.id;
  const hasAccess = await q.hasActiveEnrollment(userId, courseId);
  if (!hasAccess) return fail('Нет доступа к уроку');

  // Rate-limit отправок (защита от абьюза и роста счёта за Claude API, ТЗ §6А.6).
  const limited = rateLimit(`hw:${userId}`, RATE_LIMITS.HOMEWORK_PER_MINUTE, 60_000);
  if (!limited.allowed) {
    return fail('Слишком часто. Подождите минуту и попробуйте снова.');
  }

  const minLength = lesson.minNoteLength ?? HOMEWORK.MIN_LENGTH;
  if (text.trim().length < minLength) {
    return fail(`Конспект должен быть не короче ${minLength} символов.`);
  }

  const attemptNo = (await q.countAttempts(userId, lessonId)) + 1;

  const [knowledge, settings] = await Promise.all([
    q.getKnowledgeBase(courseId, lesson.module.id),
    q.getAiSettings(courseId),
  ]);
  const passScore = settings?.passScore ?? HOMEWORK.DEFAULT_PASS_SCORE;
  const strictness = settings?.strictness ?? HOMEWORK.DEFAULT_STRICTNESS;
  const knowledgeBase = knowledge.map((k) => `# ${k.title}\n${k.contentMd}`).join('\n\n');

  const provider = await getAiProvider();

  // Fallback: ИИ недоступен → сохраняем «на проверке», урок временно засчитывается.
  if (!provider) {
    await q.createHomework({
      userId,
      lessonId,
      text,
      verdict: HOMEWORK_VERDICT.PENDING,
      score: null,
      feedback: null,
      attemptNo,
    });
    await q.completeLesson(userId, lessonId);
    const reward = await onLessonCompleted(userId, lessonId); // урок временно засчитан → XP за урок
    return ok({
      verdict: 'pending',
      score: null,
      feedback: null,
      attemptNo,
      lessonCompleted: true,
      reward,
    });
  }

  let checkResult;
  try {
    checkResult = await provider.checkHomework({
      studentText: text,
      knowledgeBase: knowledgeBase || '(база знаний не задана — оцени общее понимание темы урока)',
      lessonTitle: lesson.title,
      passScore,
      strictness,
      promptTemplate: settings?.promptTemplate,
    });
  } catch (e) {
    // Ошибка API → fallback (деградация вместо краха, ARCHITECTURE.md §6).
    // Логируем причину для диагностики (в логи сервера, без текста ученика).
    const err = e as { status?: number; message?: string };
    console.error('[homework AI check failed]', 'status=', err.status, 'msg=', err.message);
    await q.createHomework({
      userId,
      lessonId,
      text,
      verdict: HOMEWORK_VERDICT.PENDING,
      score: null,
      feedback: null,
      attemptNo,
    });
    await q.completeLesson(userId, lessonId);
    const reward = await onLessonCompleted(userId, lessonId); // урок временно засчитан → XP за урок
    return ok({
      verdict: 'pending',
      score: null,
      feedback: null,
      attemptNo,
      lessonCompleted: true,
      reward,
    });
  }

  const passed = checkResult.verdict === 'passed';
  await q.createHomework({
    userId,
    lessonId,
    text,
    verdict: passed ? HOMEWORK_VERDICT.PASSED : HOMEWORK_VERDICT.NEEDS_WORK,
    score: checkResult.score,
    feedback: checkResult.feedback,
    attemptNo,
  });

  // При зачёте урок засчитывается + начисление XP/стрик/достижения (ТЗ §3.4-3.5).
  let reward: LessonCompletionReward | undefined;
  if (passed) {
    await q.completeLesson(userId, lessonId);
    reward = await onLessonCompleted(userId, lessonId);
    await onHomeworkPassed(userId);
  }

  // Оповещение ученику в Telegram (best-effort, ТЗ §3.9) — не ломает основной поток.
  await notifyHomeworkResult(userId, {
    verdict: passed ? 'passed' : 'needs_work',
    score: checkResult.score,
    lessonTitle: lesson.title,
    feedback: checkResult.feedback,
  }).catch(() => undefined);

  // При «на доработку» — дополнительно оповещаем админов/кураторов (best-effort).
  if (!passed) {
    await notifyStaffHomeworkNeedsWork(userId, {
      lessonTitle: lesson.title,
      score: checkResult.score,
      feedback: checkResult.feedback,
    }).catch(() => undefined);
  }

  return ok({
    verdict: passed ? 'passed' : 'needs_work',
    score: checkResult.score,
    feedback: checkResult.feedback,
    attemptNo,
    lessonCompleted: passed,
    reward,
  });
}

export interface HomeworkHistoryItem {
  id: string;
  text: string;
  verdict: string | null;
  score: number | null;
  feedback: string | null;
  attemptNo: number;
  createdAt: Date;
}

export async function getHistory(userId: string, lessonId: string): Promise<HomeworkHistoryItem[]> {
  return q.getHomeworkHistory(userId, lessonId);
}

/** Отправлял ли ученик ДЗ по уроку хотя бы раз (для доступа к конспектам, ТЗ §3.3). */
export async function hasSubmittedHomework(userId: string, lessonId: string): Promise<boolean> {
  return (await q.countAttempts(userId, lessonId)) > 0;
}

/**
 * Ручная оценка ДЗ куратором/ментором (ТЗ §3.7): вердикт + комментарий.
 * При «зачтено» — урок засчитывается + XP/достижения (идемпотентно), ученику уходит оповещение.
 */
export async function gradeHomeworkManually(
  homeworkId: string,
  verdict: 'passed' | 'needs_work',
  feedback: string | null,
): Promise<ActionResult<null>> {
  const hw = await q.getHomeworkForGrade(homeworkId);
  if (!hw) return fail('ДЗ не найдено');

  await q.setHomeworkVerdict(homeworkId, verdict, feedback);

  if (verdict === HOMEWORK_VERDICT.PASSED) {
    await q.completeLesson(hw.userId, hw.lessonId);
    await onLessonCompleted(hw.userId, hw.lessonId);
    await onHomeworkPassed(hw.userId);
  }

  await notifyHomeworkResult(hw.userId, {
    verdict,
    score: null,
    lessonTitle: hw.lesson.title,
    feedback,
  }).catch(() => undefined);

  return ok(null);
}

/** Переместить ДЗ в корзину (мягкое удаление куратором). */
export async function trashHomework(homeworkId: string): Promise<ActionResult<null>> {
  const hw = await q.getHomeworkForGrade(homeworkId);
  if (!hw) return fail('ДЗ не найдено');
  await q.setHomeworkDeleted(homeworkId, true);
  return ok(null);
}
