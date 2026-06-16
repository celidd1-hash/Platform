import { describe, it, expect } from 'vitest';
import { computeProgressPct, computeUnlocks } from '@/lib/progress';

describe('computeProgressPct', () => {
  it('считает процент завершения', () => {
    expect(computeProgressPct(0, 0)).toBe(0);
    expect(computeProgressPct(4, 0)).toBe(0);
    expect(computeProgressPct(4, 1)).toBe(25);
    expect(computeProgressPct(4, 2)).toBe(50);
    expect(computeProgressPct(4, 4)).toBe(100);
  });

  it('не превышает 100% при пересчёте', () => {
    expect(computeProgressPct(3, 5)).toBe(100);
  });
});

describe('computeUnlocks — строгий порядок (ТЗ §3.3)', () => {
  const lessons = ['l1', 'l2', 'l3'];

  it('первый урок открыт, остальные закрыты без прохождения', () => {
    const r = computeUnlocks(lessons, new Set(), true);
    expect(r.lockedById).toEqual({ l1: false, l2: true, l3: true });
    expect(r.continueLessonId).toBe('l1');
  });

  it('следующий урок открывается после завершения предыдущего', () => {
    const r = computeUnlocks(lessons, new Set(['l1']), true);
    expect(r.lockedById.l2).toBe(false);
    expect(r.lockedById.l3).toBe(true);
    expect(r.continueLessonId).toBe('l2');
  });

  it('все пройдены — continueLessonId = null', () => {
    const r = computeUnlocks(lessons, new Set(['l1', 'l2', 'l3']), true);
    expect(r.continueLessonId).toBeNull();
    expect(Object.values(r.lockedById).every((v) => v === false)).toBe(true);
  });

  it('пропуск в середине: l3 закрыт, если l2 не завершён', () => {
    const r = computeUnlocks(lessons, new Set(['l1']), true);
    expect(r.lockedById.l3).toBe(true);
  });
});

describe('computeUnlocks — свободный порядок', () => {
  it('все уроки открыты независимо от прогресса', () => {
    const r = computeUnlocks(['a', 'b', 'c'], new Set(), false);
    expect(Object.values(r.lockedById).every((v) => v === false)).toBe(true);
    expect(r.continueLessonId).toBe('a');
  });
});
