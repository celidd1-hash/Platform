import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем доступ к БД и ИИ-провайдера — тестируем чистую бизнес-логику submitHomework.
vi.mock('@/features/homework/queries', () => ({
  getLessonForCheck: vi.fn(),
  hasActiveEnrollment: vi.fn(),
  getKnowledgeBase: vi.fn(),
  getAiSettings: vi.fn(),
  countAttempts: vi.fn(),
  createHomework: vi.fn(),
  completeLesson: vi.fn(),
  getHomeworkHistory: vi.fn(),
  getLatestHomework: vi.fn(),
}));
vi.mock('@/lib/providers/ai', () => ({ getAiProvider: vi.fn() }));
// Изолируем ДЗ от геймификации (хуки начисления тестируются отдельно).
vi.mock('@/features/gamification', () => ({
  onLessonCompleted: vi.fn(),
  onHomeworkPassed: vi.fn(),
}));
vi.mock('@/features/telegram', () => ({
  notifyHomeworkResult: vi.fn().mockResolvedValue(undefined),
}));

import * as q from '@/features/homework/queries';
import { getAiProvider } from '@/lib/providers/ai';
import { submitHomework } from '@/features/homework/service';

const LESSON = {
  id: 'l1',
  title: 'Урок',
  requiresNote: true,
  minNoteLength: 10,
  module: { course: { id: 'c1' } },
};
const LONG_TEXT = 'a'.repeat(50);

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(q.getLessonForCheck).mockResolvedValue(LESSON as never);
  vi.mocked(q.hasActiveEnrollment).mockResolvedValue(true);
  vi.mocked(q.getKnowledgeBase).mockResolvedValue([] as never);
  vi.mocked(q.getAiSettings).mockResolvedValue(null as never);
  vi.mocked(q.countAttempts).mockResolvedValue(0);
  vi.mocked(q.createHomework).mockResolvedValue({} as never);
  vi.mocked(q.completeLesson).mockResolvedValue({} as never);
});

describe('submitHomework', () => {
  it('отказывает без доступа (ownership, ТЗ §6А.3)', async () => {
    vi.mocked(q.hasActiveEnrollment).mockResolvedValue(false);
    const r = await submitHomework('u-access', 'l1', LONG_TEXT);
    expect(r.ok).toBe(false);
  });

  it('отклоняет слишком короткий конспект', async () => {
    const r = await submitHomework('u-short', 'l1', 'короткий');
    expect(r.ok).toBe(false);
  });

  it('fallback: ИИ недоступен → verdict pending, урок временно засчитан (ТЗ §3.4)', async () => {
    vi.mocked(getAiProvider).mockReturnValue(null);
    const r = await submitHomework('u-fallback', 'l1', LONG_TEXT);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.verdict).toBe('pending');
      expect(r.data.lessonCompleted).toBe(true);
    }
    expect(q.completeLesson).toHaveBeenCalledOnce();
  });

  it('passed → урок засчитан', async () => {
    vi.mocked(getAiProvider).mockReturnValue({
      checkHomework: vi.fn().mockResolvedValue({ verdict: 'passed', score: 88, feedback: 'Отлично' }), chat: vi.fn(),
    });
    const r = await submitHomework('u-pass', 'l1', LONG_TEXT);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.verdict).toBe('passed');
      expect(r.data.score).toBe(88);
      expect(r.data.lessonCompleted).toBe(true);
    }
    expect(q.completeLesson).toHaveBeenCalledOnce();
  });

  it('needs_work → урок НЕ засчитан', async () => {
    vi.mocked(getAiProvider).mockReturnValue({
      checkHomework: vi.fn().mockResolvedValue({ verdict: 'needs_work', score: 40, feedback: 'Доработайте' }), chat: vi.fn(),
    });
    const r = await submitHomework('u-needs', 'l1', LONG_TEXT);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.verdict).toBe('needs_work');
      expect(r.data.lessonCompleted).toBe(false);
    }
    expect(q.completeLesson).not.toHaveBeenCalled();
  });

  it('ошибка API → fallback pending (деградация вместо краха)', async () => {
    vi.mocked(getAiProvider).mockReturnValue({
      checkHomework: vi.fn().mockRejectedValue(new Error('timeout')), chat: vi.fn(),
    });
    const r = await submitHomework('u-error', 'l1', LONG_TEXT);
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.verdict).toBe('pending');
    expect(q.completeLesson).toHaveBeenCalledOnce();
  });
});
