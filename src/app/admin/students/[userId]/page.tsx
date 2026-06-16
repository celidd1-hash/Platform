import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getStudentCabinet, BlockToggle, AccessToggle } from '@/features/admin';

export const metadata = { title: 'Кабинет ученика — Админ — SVETOZAR SCHOOL' };

const VERDICT_LABEL: Record<string, string> = {
  passed: 'зачтено',
  needs_work: 'на доработку',
  pending: 'на проверке',
};

export default async function StudentCabinetPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  const s = await getStudentCabinet(userId);
  if (!s) notFound();

  return (
    <div>
      <Link href="/admin/students" className="text-xs text-muted-2 hover:text-gold">
        ← Все ученики
      </Link>

      <header className="mt-2 mb-6 flex items-start justify-between gap-4">
        <div>
          <h1 className="font-display text-3xl font-semibold">{s.name}</h1>
          <div className="text-sm text-muted">{s.email}</div>
          <div className="mt-2 flex gap-4 text-sm text-muted-2">
            <span>XP: <b className="text-gold-bright">{s.xp}</b></span>
            <span>Стрик: 🔥 {s.streakDays}</span>
            <span>{s.isBlocked ? <b className="text-[var(--err)]">заблокирован</b> : 'активен'}</span>
          </div>
        </div>
        <BlockToggle userId={s.id} blocked={s.isBlocked} />
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        <section>
          <div className="sectlabel mb-3">Доступы к курсам</div>
          <div className="flex flex-col gap-2">
            {s.allCourses.map((c) => (
              <AccessToggle
                key={c.id}
                userId={s.id}
                courseId={c.id}
                title={c.title}
                granted={c.granted}
                archived={c.isArchived}
              />
            ))}
          </div>

          <div className="sectlabel mb-3 mt-6">Прогресс</div>
          <div className="flex flex-col gap-2">
            {s.courses.filter((c) => c.granted).map((c) => (
              <div key={c.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                <div className="mb-1 flex justify-between text-sm">
                  <span className="text-ink">{c.title}</span>
                  <span className="text-gold-bright">{c.progressPct}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-bg-2">
                  <div className="h-full bg-gradient-to-r from-gold-deep to-gold-bright" style={{ width: `${c.progressPct}%` }} />
                </div>
              </div>
            ))}
            {s.courses.filter((c) => c.granted).length === 0 && (
              <p className="text-sm text-muted-2">Нет активных курсов</p>
            )}
          </div>

          {s.achievements.length > 0 && (
            <>
              <div className="sectlabel mb-3 mt-6">Достижения</div>
              <div className="flex flex-wrap gap-2">
                {s.achievements.map((a, i) => (
                  <span key={i} className="rounded-lg border border-gold/30 bg-panel px-3 py-1.5 text-sm">
                    {a.icon ?? '🏆'} {a.title}
                  </span>
                ))}
              </div>
            </>
          )}
        </section>

        <section>
          <div className="sectlabel mb-3">История ДЗ</div>
          <div className="flex flex-col gap-2">
            {s.homework.map((h) => (
              <div key={h.id} className="rounded-lg border border-line bg-panel px-4 py-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-ink">{h.lesson}</span>
                  <span className="text-muted-2">
                    {VERDICT_LABEL[h.verdict ?? ''] ?? h.verdict}
                    {h.score != null && <span className="ml-2 text-gold-bright">{h.score}/100</span>}
                  </span>
                </div>
                <div className="text-xs text-muted-2">{h.course} · попытка {h.attemptNo}</div>
                {h.feedback && <p className="mt-1 text-xs text-muted">{h.feedback}</p>}
              </div>
            ))}
            {s.homework.length === 0 && <p className="text-sm text-muted-2">ДЗ пока нет</p>}
          </div>
        </section>
      </div>
    </div>
  );
}
