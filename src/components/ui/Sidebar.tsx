import Link from 'next/link';
import { BrandMark } from './BrandMark';

type SidebarUser = { name: string; email: string; role: string } | null;

type NavItem = { href: string; label: string; icon: React.ReactNode };

const LEARN: NavItem[] = [
  { href: '/', label: 'Курсы', icon: <path d="M4 6h16M4 12h16M4 18h10" /> },
  {
    href: '/mentor',
    label: 'AI-Наставник',
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 7v5l3 2" />
      </>
    ),
  },
  { href: '/rating', label: 'Рейтинг', icon: <path d="M6 21V10M12 21V4M18 21v-7" /> },
];

const PERSONAL: NavItem[] = [
  {
    href: '/profile',
    label: 'Мой профиль',
    icon: (
      <>
        <circle cx="12" cy="8" r="4" />
        <path d="M4 21c0-4 4-6 8-6s8 2 8 6" />
      </>
    ),
  },
  {
    href: '/achievements',
    label: 'Достижения',
    icon: <path d="M12 3l2.5 6 6.5.5-5 4.2 1.6 6.3L12 18l-5.6 1.5L8 13.7 3 9.5 9.5 9z" />,
  },
  {
    href: '/knowledge',
    label: 'Центр знаний',
    icon: <path d="M4 5a2 2 0 0 1 2-2h7v18H6a2 2 0 0 0-2 2zM13 3h5a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2h-5" />,
  },
];

/** Строка лого: буквы распределяются по фиксированной ширине (точное выравнивание по краям). */
function Spread({ text, className = '' }: { text: string; className?: string }) {
  return (
    <span className={`flex justify-between ${className}`} aria-label={text}>
      {Array.from(text).map((ch, i) => (
        <span key={i} aria-hidden>
          {ch === ' ' ? ' ' : ch}
        </span>
      ))}
    </span>
  );
}

function NavLink({ item }: { item: NavItem }) {
  return (
    <Link
      href={item.href}
      className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted transition-colors hover:bg-[rgba(200,160,79,0.08)] hover:text-ink"
    >
      <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.6">
        {item.icon}
      </svg>
      {item.label}
    </Link>
  );
}

/** Боковая навигация — «глупый» UI-компонент (ARCHITECTURE.md §2). */
export function Sidebar({
  user,
  signOutSlot,
}: {
  user: SidebarUser;
  signOutSlot?: React.ReactNode;
}) {
  const initial = user?.name?.trim()?.[0]?.toUpperCase() ?? '·';
  return (
    <aside className="relative z-10 flex w-64 flex-col border-r border-line bg-gradient-to-b from-[rgba(18,16,23,0.86)] to-[rgba(8,7,10,0.92)] p-5">
      <div className="mb-8 flex items-center gap-3">
        <BrandMark size={54} />
        <div className="w-[150px] font-label leading-tight">
          <Spread text="SVETOZAR" className="text-lg text-gold-bright" />
          <Spread text="SCHOOL" className="mt-1 text-sm text-muted" />
          <Spread text="ПУТЬ МАСТЕРА" className="mt-1.5 text-[11px] text-muted-2" />
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-1">
        <div className="mb-2 mt-2 px-3 font-label text-[10px] uppercase tracking-[3px] text-muted-2">
          Обучение
        </div>
        {LEARN.map((i) => (
          <NavLink key={i.href} item={i} />
        ))}

        <div className="mb-2 mt-4 px-3 font-label text-[10px] uppercase tracking-[3px] text-muted-2">
          Личное
        </div>
        {PERSONAL.map((i) => (
          <NavLink key={i.href} item={i} />
        ))}

        {user?.role === 'admin' && (
          <>
            <div className="mb-2 mt-4 px-3 font-label text-[10px] uppercase tracking-[3px] text-muted-2">
              Администратор
            </div>
            <NavLink
              item={{
                href: '/admin',
                label: 'Админ-панель',
                icon: (
                  <>
                    <path d="M12 2l8 4v6c0 5-3.5 8-8 10-4.5-2-8-5-8-10V6z" />
                    <path d="M9 12l2 2 4-4" />
                  </>
                ),
              }}
            />
          </>
        )}
      </nav>

      {user && (
        <div className="mt-4 flex items-center gap-3 border-t border-line pt-4">
          <div className="grid h-9 w-9 flex-none place-items-center rounded-full bg-gradient-to-br from-gold-bright to-gold-deep font-label text-sm text-[#1a1206]">
            {initial}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm text-ink">{user.name}</div>
            <div className="truncate text-[11px] text-muted-2">{user.email}</div>
          </div>
          {signOutSlot}
        </div>
      )}
    </aside>
  );
}
