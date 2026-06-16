import type { Metadata } from 'next';
import { Cormorant_Garamond, Forum, Manrope } from 'next/font/google';
import '@/styles/globals.css';

// Шрифты бренда (ТЗ §8): крупная серифная антиква + лейбл-антиква + body.
const display = Cormorant_Garamond({
  subsets: ['latin', 'cyrillic'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-display',
  display: 'swap',
});
const label = Forum({
  subsets: ['latin', 'cyrillic'],
  weight: '400',
  variable: '--font-label',
  display: 'swap',
});
const body = Manrope({
  subsets: ['latin', 'cyrillic'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-body',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SVETOZAR SCHOOL — Путь Мастера',
  description: 'Образовательная платформа: курсы, уроки, ИИ-наставник, рейтинг.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" className={`${display.variable} ${label.variable} ${body.variable}`}>
      <body>{children}</body>
    </html>
  );
}
