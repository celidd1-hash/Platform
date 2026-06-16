import { describe, it, expect } from 'vitest';
import { registerSchema, loginSchema, resetPasswordSchema } from '@/features/auth/schema';
import { rateLimit, rateLimitReset } from '@/lib/rate-limit';
import { PASSWORD, RATE_LIMITS } from '@/config/constants';

describe('registerSchema', () => {
  it('нормализует email в нижний регистр и обрезает пробелы', () => {
    const r = registerSchema.parse({
      name: 'Иван',
      email: '  IVAN@Mail.RU ',
      password: 'a'.repeat(PASSWORD.MIN_LENGTH),
      acceptTerms: true,
    });
    expect(r.email).toBe('ivan@mail.ru');
  });

  it('отклоняет короткий пароль', () => {
    const r = registerSchema.safeParse({
      name: 'Иван',
      email: 'ivan@mail.ru',
      password: 'short',
      acceptTerms: true,
    });
    expect(r.success).toBe(false);
  });

  it('требует согласие с условиями (ТЗ §6А.11)', () => {
    const r = registerSchema.safeParse({
      name: 'Иван',
      email: 'ivan@mail.ru',
      password: 'a'.repeat(PASSWORD.MIN_LENGTH),
      acceptTerms: false,
    });
    expect(r.success).toBe(false);
  });
});

describe('loginSchema', () => {
  it('требует непустой пароль', () => {
    expect(loginSchema.safeParse({ email: 'a@b.com', password: '' }).success).toBe(false);
  });
});

describe('resetPasswordSchema', () => {
  it('проверяет минимальную длину нового пароля', () => {
    const r = resetPasswordSchema.safeParse({ token: 'x'.repeat(12), password: 'short' });
    expect(r.success).toBe(false);
  });
});

describe('rateLimit (login lockout, ТЗ §6А.2)', () => {
  it('блокирует после превышения лимита попыток', () => {
    const key = 'test:login:lock';
    rateLimitReset(key);
    let last = { allowed: true };
    for (let i = 0; i < RATE_LIMITS.LOGIN_ATTEMPTS; i++) {
      last = rateLimit(key, RATE_LIMITS.LOGIN_ATTEMPTS, RATE_LIMITS.LOGIN_LOCKOUT_MS);
      expect(last.allowed).toBe(true);
    }
    // Следующая попытка сверх лимита — запрещена.
    expect(rateLimit(key, RATE_LIMITS.LOGIN_ATTEMPTS, RATE_LIMITS.LOGIN_LOCKOUT_MS).allowed).toBe(
      false,
    );
    rateLimitReset(key);
  });

  it('сброс счётчика разрешает снова', () => {
    const key = 'test:login:reset';
    rateLimit(key, 1, 60_000);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(false);
    rateLimitReset(key);
    expect(rateLimit(key, 1, 60_000).allowed).toBe(true);
    rateLimitReset(key);
  });
});
