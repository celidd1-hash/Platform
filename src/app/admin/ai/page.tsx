import { getAiTraining, AiTrainingPanel } from '@/features/admin';

export const metadata = { title: 'Обучение ИИ-агента — Админ — SVETOZAR SCHOOL' };

export default async function AdminAiPage({
  searchParams,
}: {
  searchParams: Promise<{ course?: string }>;
}) {
  const { course } = await searchParams;
  const data = await getAiTraining(course);

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Обучение ИИ-агента</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          База знаний и параметры, по которым наставник проверяет ДЗ и выставляет баллы (ТЗ §3.4).
        </p>
      </header>
      <AiTrainingPanel data={data} />
    </div>
  );
}
