import { handlers } from '@/features/auth';

/** Служебные эндпоинты NextAuth (callback, csrf, session). Тонкий роут (ARCHITECTURE.md §2). */
export const { GET, POST } = handlers;
