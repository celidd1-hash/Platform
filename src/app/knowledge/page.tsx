import Link from 'next/link';
import { redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { auth } from '@/features/auth';
import { getKnowledgeCenter } from '@/features/knowledge';

export const metadata = { title: 'Центр знаний — SVETOZAR SCHOOL' };

export default async function KnowledgePage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { q } = await searchParams;
  const categories = await getKnowledgeCenter(q);

  return (
    <AppShell>
      <header className="mb-6">
        <div className="font-display text-base italic text-muted">Простыми словами</div>
        <h1 className="mt-1 font-display text-4xl font-semibold">Центр знаний</h1>
      </header>

      <form className="mb-7" action="/knowledge">
        <input
          name="q"
          defaultValue={q ?? ''}
          placeholder="Поиск по статьям…"
          className="w-full max-w-md rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
      </form>

      {categories.length === 0 ? (
        <p className="text-sm text-muted">Ничего не найдено.</p>
      ) : (
        <div className="flex flex-col gap-8">
          {categories.map((cat) => (
            <section key={cat.category}>
              <div className="sectlabel mb-4">{cat.category}</div>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {cat.articles.map((a) => (
                  <Link
                    key={a.id}
                    href={`/knowledge/${a.id}`}
                    className="rounded-token border border-line bg-panel p-5 transition-colors hover:border-gold"
                  >
                    <div className="text-2xl">{a.icon ?? '📖'}</div>
                    <h3 className="mt-2 font-display text-xl font-semibold">{a.title}</h3>
                    {a.description && <p className="mt-1 text-sm text-muted">{a.description}</p>}
                    {a.steps > 0 && (
                      <div className="mt-3 font-label text-[11px] uppercase tracking-[1px] text-muted-2">
                        {a.steps} шагов
                      </div>
                    )}
                  </Link>
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <div className="mt-10 rounded-token border border-gold/30 bg-gradient-to-b from-panel-2 to-panel p-6 text-center">
        <div className="font-display text-xl text-ink">Не нашёл ответ?</div>
        <p className="mt-1 text-sm text-muted">Спроси у AI-Наставника — он подскажет по материалам курса.</p>
        <Link
          href="/mentor"
          className="mt-4 inline-block rounded-xl bg-gradient-to-r from-gold-deep to-gold px-6 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright"
        >
          Спросить AI-Наставника
        </Link>
      </div>
    </AppShell>
  );
}
