import type { Config } from 'tailwindcss';

/**
 * Дизайн-токены (чёрный + золото, сакральная геометрия) заданы CSS-переменными
 * в src/styles/tokens.css — здесь они только маппятся в утилиты Tailwind.
 * Сменить оттенок золота = одно значение в tokens.css (ARCHITECTURE.md §4).
 */
const config: Config = {
  content: ['./src/**/*.{ts,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--bg)',
        'bg-2': 'var(--bg-2)',
        panel: 'var(--panel)',
        'panel-2': 'var(--panel-2)',
        line: 'var(--line)',
        'line-strong': 'var(--line-strong)',
        gold: 'var(--gold)',
        'gold-bright': 'var(--gold-bright)',
        'gold-deep': 'var(--gold-deep)',
        ink: 'var(--ink)',
        muted: 'var(--muted)',
        'muted-2': 'var(--muted-2)',
        ok: 'var(--ok)',
      },
      fontFamily: {
        display: ['var(--font-display)', 'Cormorant Garamond', 'serif'],
        label: ['var(--font-label)', 'Forum', 'serif'],
        body: ['var(--font-body)', 'Manrope', 'sans-serif'],
      },
      borderRadius: {
        token: 'var(--r)',
      },
    },
  },
  plugins: [],
};

export default config;
