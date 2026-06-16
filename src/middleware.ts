import NextAuth from 'next-auth';
import { authConfig } from '@/features/auth/config';

/**
 * Защита маршрутов на сервере (ТЗ §6А.3): проверка прав на КАЖДОМ запросе, не только в UI.
 * Использует edge-safe config (без Prisma/argon2) — логика доступа в authConfig.callbacks.authorized.
 *
 * Импорт идёт напрямую из features/auth/config (а не index), чтобы в edge-бандл
 * middleware НЕ попали node-зависимости полного auth.ts.
 */
export const { auth: middleware } = NextAuth(authConfig);

export default middleware;

export const config = {
  // Исключаем статику, изображения, api/auth (NextAuth) и api/telegram (вебхук с секретом).
  matcher: ['/((?!api/auth|api/telegram|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)'],
};
