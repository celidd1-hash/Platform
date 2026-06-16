import { NextResponse } from 'next/server';
import { auth } from '@/features/auth';
import { exportData } from '@/features/profile';

/** Экспорт своих данных в JSON (право на доступ, ТЗ §6А.11). Только свой аккаунт. */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }
  const res = await exportData(session.user.id);
  if (!res.ok) return NextResponse.json({ error: res.error }, { status: 404 });

  return new NextResponse(JSON.stringify(res.data, null, 2), {
    headers: {
      'Content-Type': 'application/json',
      'Content-Disposition': 'attachment; filename="svetozar-my-data.json"',
      'Cache-Control': 'private, no-store',
    },
  });
}
