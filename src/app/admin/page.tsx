import { getDashboard } from '@/features/admin';

export const metadata = { title: 'Дашборд — Админ — SVETOZAR SCHOOL' };

function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-token border border-line bg-gradient-to-b from-panel-2 to-panel p-5">
      <div className="font-display text-4xl text-gold-bright">{value}</div>
      <div className="mt-1 font-label text-[10px] uppercase tracking-[2px] text-muted-2">{label}</div>
    </div>
  );
}

export default async function AdminDashboardPage() {
  const d = await getDashboard();

  return (
    <div>
      <h1 className="mb-6 font-display text-3xl font-semibold">Дашборд</h1>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-3 xl:grid-cols-6">
        <StatCard label="всего учеников" value={d.totalStudents} />
        <StatCard label="активны за неделю" value={d.activeWeek} />
        <StatCard label="курсов опубликовано" value={d.publishedCourses} />
        <StatCard label="средний балл ДЗ" value={d.avgHomeworkScore ?? '—'} />
        <StatCard label="ИИ-проверок" value={d.aiChecks} />
        <StatCard label="ДЗ на проверке" value={d.pendingHomework} />
      </div>

      <section className="mt-8">
        <div className="sectlabel mb-4">Курсы</div>
        <div className="overflow-hidden rounded-token border border-line">
          <div className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line bg-panel-2 px-5 py-2 font-label text-[10px] uppercase tracking-[2px] text-muted-2">
            <span>Курс</span>
            <span>Учеников</span>
            <span>Уроков</span>
          </div>
          {d.courses.map((c) => (
            <div
              key={c.id}
              className="grid grid-cols-[1fr_auto_auto] gap-4 border-b border-line px-5 py-3 text-sm last:border-b-0"
            >
              <span className="text-ink">{c.title}</span>
              <span className="text-center text-muted">{c.students}</span>
              <span className="text-center text-muted">{c.lessons}</span>
            </div>
          ))}
          {d.courses.length === 0 && <div className="px-5 py-6 text-sm text-muted">Курсов нет</div>}
        </div>
      </section>
    </div>
  );
}
