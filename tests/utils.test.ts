import { describe, it, expect } from 'vitest';
import { slugify, formatBytes, ok, fail } from '@/lib/utils';

describe('slugify', () => {
  it('транслитерирует кириллицу в kebab-case', () => {
    expect(slugify('Я Целитель')).toBe('ya-celitel');
    expect(slugify('Погружение в прошлые жизни')).toBe('pogruzhenie-v-proshlye-zhizni');
  });

  it('убирает лишние символы и края', () => {
    expect(slugify('  Hello,  World!  ')).toBe('hello-world');
  });
});

describe('formatBytes', () => {
  it('форматирует размеры', () => {
    expect(formatBytes(512)).toBe('512 Б');
    expect(formatBytes(2048)).toBe('2.0 КБ');
    expect(formatBytes(5 * 1024 * 1024)).toBe('5.0 МБ');
  });
});

describe('ActionResult', () => {
  it('ok/fail формируют типизированный результат', () => {
    expect(ok(42)).toEqual({ ok: true, data: 42 });
    expect(fail('boom')).toEqual({ ok: false, error: 'boom' });
  });
});
