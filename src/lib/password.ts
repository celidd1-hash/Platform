import { hash, verify } from '@node-rs/argon2';

/**
 * Хеширование паролей argon2id (ТЗ §6А.2). Открытые пароли НИГДЕ не логируются.
 * Параметры — рекомендованные OWASP для argon2id.
 */
const OPTIONS = {
  memoryCost: 19_456, // 19 MiB
  timeCost: 2,
  parallelism: 1,
} as const;

export function hashPassword(plain: string): Promise<string> {
  return hash(plain, OPTIONS);
}

export function verifyPassword(hashed: string, plain: string): Promise<boolean> {
  return verify(hashed, plain, OPTIONS);
}
