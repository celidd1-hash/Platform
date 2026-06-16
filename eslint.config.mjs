import { FlatCompat } from '@eslint/eslintrc';

const compat = new FlatCompat({
  baseDirectory: import.meta.dirname,
});

const config = [
  ...compat.extends('next/core-web-vitals', 'next/typescript'),
  {
    ignores: ['.next/**', 'node_modules/**', 'prisma/migrations/**'],
  },
  {
    // Архитектурные границы (ARCHITECTURE.md §2): направление зависимостей
    // app → features → lib/config. Фичи не лезут в app; UI ни от кого не зависит.
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/app/*'],
              message:
                'features/lib/components не должны импортировать из app/. Зависимости текут app → features → lib (ARCHITECTURE.md §2).',
            },
          ],
        },
      ],
    },
  },
  {
    // Prisma — только в queries.ts / queries/*.ts (CLAUDE.md: «Доступ к БД только в queries»).
    files: ['src/**/*.{ts,tsx}'],
    ignores: ['src/**/queries.ts', 'src/**/queries/**', 'src/lib/db.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@prisma/client',
              message: 'Prisma импортируется только в features/<имя>/queries.ts и lib/db.ts.',
            },
          ],
          patterns: [
            {
              group: ['@/app/*'],
              message: 'Зависимости текут app → features → lib (ARCHITECTURE.md §2).',
            },
          ],
        },
      ],
    },
  },
];

export default config;
