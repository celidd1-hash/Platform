import { getIntegrations, IntegrationsPanel } from '@/features/admin';

export const metadata = { title: 'Интеграции — Админ — SVETOZAR SCHOOL' };

export default async function AdminSettingsPage() {
  const items = await getIntegrations();

  return (
    <div>
      <header className="mb-6">
        <h1 className="font-display text-3xl font-semibold">Интеграции</h1>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Ключи сервисов задаются здесь и хранятся в зашифрованном виде. Приоритет: значение из
          платформы → переменные Vercel (fallback). Изменения применяются в течение ~30 секунд.
        </p>
      </header>
      <IntegrationsPanel items={items} />
    </div>
  );
}
