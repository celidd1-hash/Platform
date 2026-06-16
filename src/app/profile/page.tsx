import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import {
  getProfile,
  ProfileForm,
  ChangePasswordForm,
  RatingVisibilityToggle,
  DeleteAccount,
} from '@/features/profile';
import { getTwoFactorStatus, TwoFactorSetup } from '@/features/auth';
import { getPrefs, TelegramSection } from '@/features/telegram';

export const metadata = { title: 'Профиль — SVETOZAR SCHOOL' };

const VERDICT_LABEL: Record<string, string> = {
  passed: 'зачтено',
  needs_work: 'на доработку',
  pending: 'на проверке',
};

function Stat({ value, label }: { value: string | number; label: string }) {
  return (
    <div className="rounded-token border border-line bg-gradient-to-b from-panel-2 to-panel p-4 text-center">
      <div className="font-display text-3xl text-gold-bright">{value}</div>
      <div className="mt-1 font-label text-[10px] uppercase tracking-[2px] text-muted-2">{label}</div>
    </div>
  );
}

export default async function ProfilePage() {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const [p, tg, tfa] = await Promise.all([
    getProfile(session.user.id),
    getPrefs(session.user.id),
    getTwoFactorStatus(session.user.id),
  ]);
  if (!p) redirect('/login');

  return (
    <AppShell>
      <header className="mb-7 flex items-center gap-4">
        <div className="grid h-16 w-16 place-items-center overflow-hidden rounded-full bg-gradient-to-br from-gold-bright to-gold-deep font-display text-2xl text-[#1a1206]">
          {p.avatarUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={p.avatarUrl} alt="" className="h-full w-full object-cover" />
          ) : (
            p.name.trim()[0]?.toUpperCase() ?? '·'
          )}
        </div>
        <div>
          <h1 className="font-display text-3xl font-semibold">{p.name}</h1>
          <div className="text-sm text-muted">{p.email}</div>
          <div className="text-xs text-muted-2">
            С нами с {p.createdAt.toLocaleDateString('ru-RU')}
          </div>
        </div>
      </header>

      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat value={p.xp} label="опыт" />
        <Stat value={`#${p.rank}`} label="в рейтинге" />
        <Stat value={p.streakDays} label="дней подряд" />
        <Stat value={p.achievements} label="достижений" />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="sectlabel mb-4">Мои курсы</div>
          <div className="flex flex-col gap-2">
            {p.courses.map((c) => (
              <Link
                key={c.id}
                href={`/course/${c.slug}`}
                className="rounded-lg border border-line bg-panel px-4 py-3 transition-colors hover:border-gold"
              >
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink">{c.title}</span>
                  <span className="text-gold-bright">{c.progressPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-2">
                  <div className="h-full bg-gradient-to-r from-gold-deep to-gold-bright" style={{ width: `${c.progressPct}%` }} />
                </div>
              </Link>
            ))}
            {p.courses.length === 0 && <p className="text-sm text-muted-2">Нет активных курсов</p>}
          </div>

          <div className="sectlabel mb-4 mt-6">История ДЗ</div>
          <div className="flex flex-col gap-2">
            {p.homework.slice(0, 10).map((h) => (
              <div key={h.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                <div className="flex justify-between text-sm">
                  <span className="text-ink">{h.lesson}</span>
                  <span className="text-muted-2">
                    {VERDICT_LABEL[h.verdict ?? ''] ?? '—'}
                    {h.score != null && <span className="ml-2 text-gold-bright">{h.score}/100</span>}
                  </span>
                </div>
                <div className="text-xs text-muted-2">{h.course}</div>
              </div>
            ))}
            {p.homework.length === 0 && <p className="text-sm text-muted-2">ДЗ пока нет</p>}
          </div>
        </section>

        <section>
          <div className="sectlabel mb-4">Профиль</div>
          <ProfileForm name={p.name} avatarUrl={p.avatarUrl} />

          <div className="sectlabel mb-4 mt-6">Безопасность</div>
          <ChangePasswordForm />
          <div className="mt-3">
            <TwoFactorSetup enabled={tfa.enabled} />
          </div>

          <div className="sectlabel mb-4 mt-6">Настройки</div>
          <div className="flex flex-col gap-3 rounded-token border border-line bg-panel p-5">
            <RatingVisibilityToggle isPublic={p.isPublicInRating} />
            <a
              href="/api/profile/export"
              className="border-t border-line pt-3 text-sm text-gold hover:text-gold-bright"
            >
              Экспортировать мои данные (JSON)
            </a>
          </div>

          <div className="sectlabel mb-4 mt-6">Telegram и уведомления</div>
          <TelegramSection connected={tg.connected} prefs={tg.prefs} />

          <div className="sectlabel mb-4 mt-6">Опасная зона</div>
          <DeleteAccount />
        </section>
      </div>
    </AppShell>
  );
}
