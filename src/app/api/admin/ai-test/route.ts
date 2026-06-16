import { NextResponse } from 'next/server';
import { requireAdmin } from '@/features/admin';
import { testAiConnection } from '@/lib/providers/ai';

/** Админский тест подключения к Claude (диагностика). Только для роли admin. */
export async function GET() {
  const admin = await requireAdmin();
  if (!admin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  const result = await testAiConnection();
  return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } });
}
