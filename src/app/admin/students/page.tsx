import Link from 'next/link';
import { listStudents, DeleteStudentButton } from '@/features/admin';

export const metadata = { title: 'Ученики — Админ — SVETOZAR SCHOOL' };

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const students = await listStudents(q);

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-semibold">Ученики</h1>

      <form className="mb-5" action="/admin/students">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Поиск по имени или email…"
          className="w-full max-w-md rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
      </form>

      <div className="overflow-hidden rounded-token border border-line">
        <div className="grid grid-cols-[1fr_auto_auto_auto_auto] gap-4 border-b border-line bg-panel-2 px-5 py-2 font-label text-[10px] uppercase tracking-[2px] text-muted-2">
          <span>Ученик</span>
          <span>Курсов</span>
          <span>XP</span>
          <span>Статус</span>
          <span></span>
        </div>
        {students.map((s) => (
          <div
            key={s.id}
            className="grid grid-cols-[1fr_auto_auto_auto_auto] items-center gap-4 border-b border-line px-5 py-3 text-sm transition-colors last:border-b-0 hover:bg-[rgba(200,160,79,0.05)]"
          >
            <Link href={`/admin/students/${s.id}`} className="min-w-0 truncate hover:text-gold">
              <span className="text-ink">{s.name}</span>
              <span className="ml-2 text-muted-2">{s.email}</span>
            </Link>
            <span className="text-center text-muted">{s.courses}</span>
            <span className="text-center text-gold-bright">{s.xp}</span>
            <span className="text-center">
              {s.isBlocked ? (
                <span className="text-[var(--err)]">заблокирован</span>
              ) : (
                <span className="text-ok">активен</span>
              )}
            </span>
            <DeleteStudentButton userId={s.id} />
          </div>
        ))}
        {students.length === 0 && <div className="px-5 py-6 text-sm text-muted">Никого не найдено</div>}
      </div>
    </div>
  );
}
