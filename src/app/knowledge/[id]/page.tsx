import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Markdown } from '@/components/ui/Markdown';
import { auth } from '@/features/auth';
import { getArticle } from '@/features/knowledge';

export default async function KnowledgeArticlePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await auth();
  if (!session?.user?.id) redirect('/login');
  const { id } = await params;
  const article = await getArticle(id);
  if (!article) notFound();

  return (
    <AppShell>
      <div className="mx-auto max-w-2xl">
        <Link href="/knowledge" className="text-xs text-muted-2 hover:text-gold">← Центр знаний</Link>
        <header className="mb-6 mt-2">
          <div className="font-label text-[11px] uppercase tracking-[2px] text-muted-2">{article.category}</div>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {article.icon ?? '📖'} {article.title}
          </h1>
        </header>
        <Markdown>{article.bodyMd}</Markdown>
      </div>
    </AppShell>
  );
}
