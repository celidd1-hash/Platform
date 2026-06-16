'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const TABS = [
  { href: '/admin', label: 'Дашборд' },
  { href: '/admin/courses', label: 'Курсы и уроки' },
  { href: '/admin/ai', label: 'Обучение ИИ-агента' },
  { href: '/admin/students', label: 'Ученики' },
  { href: '/admin/homework', label: 'Проверка ДЗ' },
  { href: '/admin/achievements', label: 'Достижения' },
];

/** Подменю админки (ТЗ §3.7). */
export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav className="mb-7 flex flex-wrap gap-1 border-b border-line pb-3">
      {TABS.map((tab) => {
        const active = tab.href === '/admin' ? pathname === '/admin' : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`rounded-lg px-3 py-2 font-label text-xs tracking-[1px] transition-colors ${
              active ? 'bg-[rgba(200,160,79,0.12)] text-gold-bright' : 'text-muted hover:text-gold'
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
