import { z } from 'zod';
import { PASSWORD } from '@/config/constants';

/**
 * Контракты данных фичи auth (ARCHITECTURE.md §3). Любой вход валидируется здесь.
 */

const email = z.string().trim().toLowerCase().email('Введите корректный email');

const password = z
  .string()
  .min(PASSWORD.MIN_LENGTH, `Пароль должен быть не короче ${PASSWORD.MIN_LENGTH} символов`)
  .max(128, 'Пароль слишком длинный');

export const registerSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(80),
  email,
  password,
  // Согласие на обработку ПД — обязательно при регистрации (ТЗ §6А.11).
  acceptTerms: z.literal(true, {
    errorMap: () => ({ message: 'Необходимо принять условия и политику конфиденциальности' }),
  }),
});

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Введите пароль'),
  // Код 2FA (TOTP) — нужен только если у аккаунта включена 2FA (ТЗ §6А.2).
  token: z.string().trim().optional(),
});

export const requestResetSchema = z.object({ email });

export const resetPasswordSchema = z.object({
  token: z.string().min(10),
  password,
});

export const verifyEmailSchema = z.object({
  token: z.string().min(10),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type RequestResetInput = z.infer<typeof requestResetSchema>;
export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
