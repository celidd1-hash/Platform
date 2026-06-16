/**
 * Простой in-memory rate-limiter с фиксированным окном (ТЗ §6А.2, §6А.6).
 * Защита от перебора входа и абьюза ИИ-проверок.
 *
 * ОГРАНИЧЕНИЕ: состояние в памяти процесса — корректно для одного инстанса (MVP).
 * При горизонтальном масштабировании заменить на Redis/Upstash (правка одного модуля).
 */
type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  /** Сколько мс до сброса окна. */
  retryAfterMs: number;
}

/**
 * Регистрирует попытку для ключа. Возвращает, разрешено ли действие.
 * @param key уникальный ключ (например, `login:email` или `hw:userId`)
 * @param limit максимум попыток в окне
 * @param windowMs длительность окна, мс
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now >= bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return { allowed: true, remaining: limit - 1, retryAfterMs: windowMs };
  }

  bucket.count += 1;
  const allowed = bucket.count <= limit;
  return {
    allowed,
    remaining: Math.max(0, limit - bucket.count),
    retryAfterMs: bucket.resetAt - now,
  };
}

/** Сбросить счётчик (например, после успешного входа). */
export function rateLimitReset(key: string): void {
  buckets.delete(key);
}
