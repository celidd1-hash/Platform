import Link from 'next/link';
import { getHomeworkReview, HomeworkReviewCard } from '@/features/admin';

export const metadata = { title: 'Проверка ДЗ — Админ — SVETOZAR SCHOOL' };

const VERDICTS = [
  { value: '', label: 'Все' },
  { value: 'pending', label: 'Проверка' },
  { value: 'passed', label: 'Зачтено' },
  { value: 'needs_work', label: 'На доработку' },
  { value: 'trashed', label: 'Корзина' },
];

export default async function AdminHomeworkPage({
  searchParams,
}: {
  searchParams: Promise<{ verdict?: string }>;
}) {
  const { verdict } = await searchParams;
  const data = await getHomeworkReview({ verdict });

  function href(v: string) {
    const sp = new URLSearchParams();
    if (v) sp.set('verdict', v);
    const qs = sp.toString();
    return qs ? `/admin/homework?${qs}` : '/admin/homework';
  }

  return (
    <div>
      <h1 className="mb-4 font-display text-3xl font-semibold">Проверка ДЗ</h1>

      <div className="mb-5 flex flex-wrap gap-2">
        {VERDICTS.map((v) => (
          <Link
            key={v.value}
            href={href(v.value)}
            className={`rounded-full border px-3 py-1 text-xs transition-colors ${
              data.filter.verdict === v.value ? 'border-gold bg-[rgba(200,160,79,0.12)] text-gold-bright' : 'border-line text-muted hover:text-gold'
            }`}
          >
            {v.label}
          </Link>
        ))}
      </div>

      <div className="flex flex-col gap-3">
        {data.items.map((h) => (
          <HomeworkReviewCard key={h.id} item={h} />
        ))}
        {data.items.length === 0 && <p className="text-sm text-muted">ДЗ по фильтру не найдено</p>}
      </div>
    </div>
  );
}
