import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    include: ['tests/**/*.test.ts', 'src/**/*.test.ts'],
    // Фиктивные значения env, чтобы валидация config/env не падала в тестах.
    env: {
      DATABASE_URL: 'postgresql://test:test@localhost:5432/test',
      AUTH_SECRET: 'test-secret-at-least-16-chars-long',
      NEXT_PUBLIC_APP_URL: 'http://localhost:3000',
    },
  },
});
