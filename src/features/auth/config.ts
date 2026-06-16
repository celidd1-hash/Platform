import type { NextAuthConfig } from 'next-auth';

/**
 * Edge-safe конфиг NextAuth (используется в middleware).
 * НЕ содержит node-зависимостей (Prisma/argon2) — только JWT-сессия, страницы и callbacks.
 * Полный конфиг с Credentials-провайдером — в auth.ts (node runtime).
 */
export const authConfig = {
  session: { strategy: 'jwt' },
  pages: {
    signIn: '/login',
  },
  // Маршруты приложения, требующие входа. Публичны только auth-страницы и api/auth.
  callbacks: {
    authorized({ auth, request }) {
      const { pathname } = request.nextUrl;
      const isLoggedIn = !!auth?.user;
      const role = auth?.user?.role;

      // Публичные правовые страницы (политика/соглашение) — доступны без входа (ТЗ §6А.11).
      if (pathname.startsWith('/legal')) return true;

      const isAuthPage =
        pathname.startsWith('/login') ||
        pathname.startsWith('/register') ||
        pathname.startsWith('/reset') ||
        pathname.startsWith('/verify');

      // Уже вошедшего уводим с auth-страниц на главную.
      if (isAuthPage) return isLoggedIn ? Response.redirect(new URL('/', request.nextUrl)) : true;

      // Зона админа — только роль admin (ТЗ §6А.3).
      if (pathname.startsWith('/admin')) return isLoggedIn && role === 'admin';

      // Остальное приложение — требует входа.
      return isLoggedIn;
    },
    // Прокидываем id и роль в токен и сессию.
    jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
      }
      return token;
    },
    session({ session, token }) {
      if (token.id) session.user.id = token.id as string;
      if (token.role) session.user.role = token.role as string;
      return session;
    },
  },
  providers: [], // заполняется в auth.ts
} satisfies NextAuthConfig;
