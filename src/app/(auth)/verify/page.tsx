import Link from 'next/link';
import { verifyEmail } from '@/features/auth';

export const metadata = { title: 'Подтверждение email — SVETOZAR SCHOOL' };

/** Подтверждение email по токену из письма (серверная проверка, ТЗ §6А.2). */
export default async function VerifyPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  const result = token ? await verifyEmail(token) : { ok: false };

  return (
    <div className="flex flex-col items-center gap-4 text-center">
      <h1 className="font-display text-3xl font-semibold">
        {result.ok ? 'Email подтверждён' : 'Ссылка недействительна'}
      </h1>
      <p className="text-sm text-muted">
        {result.ok
          ? 'Теперь вы можете войти в аккаунт.'
          : 'Ссылка истекла или уже использована. Войдите и запросите новое письмо при необходимости.'}
      </p>
      <Link
        href="/login"
        className="w-full rounded-xl bg-gradient-to-r from-gold-deep to-gold py-3 font-label text-sm tracking-[2px] text-[#1a1206] hover:to-gold-bright"
      >
        Перейти ко входу
      </Link>
    </div>
  );
}
