import type { DefaultSession } from 'next-auth';

/**
 * Расширяем типы сессии/пользователя ролью и id (выводятся через JWT-callbacks).
 */
declare module 'next-auth' {
  interface Session {
    user: {
      id: string;
      role: string;
    } & DefaultSession['user'];
  }

  interface User {
    role: string;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id?: string;
    role?: string;
  }
}
