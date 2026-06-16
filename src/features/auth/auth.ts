import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import { authConfig } from './config';
import { loginSchema } from './schema';
import { authenticateCredentials } from './service';

/**
 * Полный инстанс NextAuth (node runtime): Credentials-провайдер с argon2/Prisma.
 * Экспортируется наружу через index.ts. Middleware использует НЕ это, а config.ts (edge).
 */
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    Credentials({
      credentials: { email: {}, password: {}, token: {} },
      async authorize(raw) {
        const parsed = loginSchema.safeParse(raw);
        if (!parsed.success) return null;
        const user = await authenticateCredentials(
          parsed.data.email,
          parsed.data.password,
          parsed.data.token,
        );
        if (!user) return null;
        return { id: user.id, email: user.email, name: user.name, role: user.role };
      },
    }),
  ],
});
