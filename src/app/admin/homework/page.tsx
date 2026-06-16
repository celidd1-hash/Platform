import Link from 'next/link';
import { getHomeworkReview } from '@/features/admin';

export const metadata = { title: 'Проверка ДЗ — Админ — SVETOZAR SCHOOL' };

const VERDICTS = [
  { value: '', label: 'Все' },
  { value: 'passed', label: 'Зачтено' },
  { value: 'needs_work', label: 'На доработку' },
  { value: 'pending', label: 'На проверке' },
];
const VERDICT_LABEL: Record<string, string> = {
  passed: 'зачтено',
  needs_work: 'на доработку',
  pending: 'на проверке',
};

export default async function AdminHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string; verdict?: string }>;
}) {
  const { course, verdict } = await searchParams;
  const data = await getHomeworkReview({ courseId: course, verdict });

  function href(next: { course?: string; verdict?: string }) {
    const sp = new URLSearchParams();
    const c = next.course ?? data.filter.courseId;
    const v = next.verdict ?? data.filter.verdict;
    if (c) sp.set('course', c);
    if (v) sp.set('verdict', v);
    const qs = sp.toString();
    return qs ? `/admin/homework?${qs}` : '/admin/homework';
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-semibold">Проверка ДЗ</h1>

      <div className="mb-5 flex flex-wrap items-center gap-4">
        <div className="flex flex-wrap gap-2">
          {VERDICTS.map((v) => (
            <Link
              key={v.value}
              href={href({ verdict: v.value })}
              className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                data.filter.verdict === v.value ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright' : 'border-line text-muted hover:text-gold'
              }`}
            >
              {v.label}
            </Link>
          ))}
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={href({ course: '' })}
            className={`rounded-full border px-3 py-1 text-xs ${!data.filter.courseId ? 'border-gold text-gold-bright' : 'border-line text-muted hover:text-gold'}`}
          >
            Все курсы
          </Link>
          {data.courses.map((c) => (
            <Link
              key={c.id}
              href={href({ course: c.id })}
              className={`rounded-full border px-3 py-1 text-xs ${data.filter.courseId === c.id ? 'border-gold text-gold-bright' : 'border-line text-muted hover:text-gold'}`}
            >
              {c.title}
            </Link>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-3">
        {data.items.map((h) => (
          <div key={h.id} className="rounded-token border border-line bg-panel p-5">
            <div className="flex items-center justify-between">
              <div className="text-sm">
                <Link href={`/admin/students/${h.studentId}`} className="text-gold hover:underline">
                  {h.studentName}
                </Link>
                <span className="ml-2 text-muted-2">{h.course} · {h.lesson}</span>
              </div>
              <span className="text-sm text-muted-2">
                {VERDICT_LABEL[h.verdict ?? ''] ?? '—'}
                {h.score != null && <span className="ml-2 text-gold-bright">{h.score}/100</span>}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap text-sm text-ink/90">{h.text}</p>
            {h.feedback && (
              <p className="mt-2 border-l-2 border-line pl-3 text-xs text-muted">Наставник: {h.feedback}</p>
            )}
          </div>
        ))}
        {data.items.length === 0 && <p className="text-sm text-muted">ДЗ по фильтру не найдено</p>}
      </div>
    </div>
  );
}
