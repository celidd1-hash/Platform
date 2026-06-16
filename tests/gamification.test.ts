import { describe, it, expect } from 'vitest';
import {
  computeStreak,
  evaluateAchievement,
  homeworkXpBonus,
} from '@/lib/gamification';

describe('computeStreak (ТЗ §3.5)', () => {
  const today = new Date('2026-06-12T10:00:00Z');

  it('первая активность → стрик 1', () => {
    expect(computeStreak(null, today, 0)).toBe(1);
  });

  it('активность в тот же день → без изменений', () => {
    const sameDay = new Date('2026-06-12T08:00:00Z');
    expect(computeStreak(sameDay, today, 5)).toBe(5);
  });

  it('активность вчера → +1', () => {
    const yesterday = new Date('2026-06-11T22:00:00Z');
    expect(computeStreak(yesterday, today, 5)).toBe(6);
  });

  it('пропуск дня → сброс к 1', () => {
    const threeDaysAgo = new Date('2026-06-09T10:00:00Z');
    expect(computeStreak(threeDaysAgo, today, 9)).toBe(1);
  });
});

describe('evaluateAchievement (ТЗ §3.5)', () => {
  const stats = { lessonsCompleted: 3, modulesCompleted: 1, homeworkPassed: 5, streakDays: 7 };

  it('прогресс X/Y и факт получения', () => {
    const r = evaluateAchievement({ type: 'lesson_completed', threshold: 1 }, stats);
    expect(r).toEqual({ current: 1, target: 1, earned: true });
  });

  it('не получено, если порог не достигнут', () => {
    const r = evaluateAchievement({ type: 'homework_passed', threshold: 10 }, stats);
    expect(r.earned).toBe(false);
    expect(r.current).toBe(5);
    expect(r.target).toBe(10);
  });

  it('стрик ровно на пороге → получено', () => {
    const r = evaluateAchievement({ type: 'streak_days', threshold: 7 }, stats);
    expect(r.earned).toBe(true);
  });
});

describe('homeworkXpBonus (ТЗ §3.5)', () => {
  it('бонус = score * factor (округление вниз)', () => {
    expect(homeworkXpBonus(88, 0.5)).toBe(44);
    expect(homeworkXpBonus(75, 0.5)).toBe(37);
    expect(homeworkXpBonus(0, 0.5)).toBe(0);
  });
});
