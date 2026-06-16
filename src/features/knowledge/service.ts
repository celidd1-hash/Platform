import * as q from './queries';

/** Сервис Центра знаний (ТЗ §3.8): статьи-инструкции по категориям, поиск. */

export interface KbArticleCard {
  id: string;
  title: string;
  icon: string | null;
  steps: number;
  description: string | null;
}

export interface KbCategory {
  category: string;
  articles: KbArticleCard[];
}

export async function getKnowledgeCenter(search?: string): Promise<KbCategory[]> {
  const articles = await q.listArticles(search?.trim() || undefined);
  const byCategory = new Map<string, KbArticleCard[]>();
  for (const a of articles) {
    const list = byCategory.get(a.category) ?? [];
    list.push({ id: a.id, title: a.title, icon: a.icon, steps: a.steps, description: a.description });
    byCategory.set(a.category, list);
  }
  return Array.from(byCategory.entries()).map(([category, list]) => ({ category, articles: list }));
}

export interface KbArticleFull {
  id: string;
  category: string;
  title: string;
  icon: string | null;
  steps: number;
  bodyMd: string;
}

export async function getArticle(id: string): Promise<KbArticleFull | null> {
  return q.getArticle(id);
}
