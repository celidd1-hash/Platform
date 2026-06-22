import Link from 'next/link';
import { listStudents, DeleteStudentButton, RestoreStudentButton } from '@/features/admin';

export const metadata = { title: 'Ученики — Админ — SVETOZAR SCHOOL' };

export default async function AdminStudentsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; view?: string }>;
}) {
  const { q, view } = await searchParams;
  const archived = view === 'archived';
  const students = await listStudents(q, archived);

  const tabHref = (v: 'active' | 'archived') => {
    const sp = new URLSearchParams();
    if (q) sp.set('q', q);
    if (v === 'archived') sp.set('view', 'archived');
    const qs = sp.toString();
    return qs ? `/admin/students?${qs}` : '/admin/students';
  };

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-semibold">Ученики</h1>

      <div className="mb-5 flex gap-2">
        <Link
          href={tabHref('active')}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            !archived ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright' : 'border-line text-muted hover:text-gold'
          }`}
        >
          Активные
        </Link>
        <Link
          href={tabHref('archived')}
          className={`rounded-full border px-3 py-1 text-xs transition-colors ${
            archived ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright' : 'border-line text-muted hover:text-gold'
          }`}
        >
          Архив
        </Link>
      </div>

      <form className="mb-5" action="/admin/students">
        {archived && <input type="hidden" name="view" value="archived" />}
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
              {archived ? (
                <span className="text-[var(--warn)]">в архиве</span>
              ) : s.isBlocked ? (
                <span className="text-[var(--err)]">заблокирован</span>
              ) : (
                <span className="text-ok">активен</span>
              )}
            </span>
            {archived ? <RestoreStudentButton userId={s.id} /> : <DeleteStudentButton userId={s.id} />}
          </div>
        ))}
        {students.length === 0 && (
          <div className="px-5 py-6 text-sm text-muted">
            {archived ? 'Архив пуст' : 'Никого не найдено'}
          </div>
        )}
      </div>
    </div>
  );
}
