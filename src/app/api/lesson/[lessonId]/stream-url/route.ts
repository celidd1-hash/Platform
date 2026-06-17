import { NextResponse } from 'next/server';
import { auth } from '@/features/auth';
import { getLessonStreamUrl } from '@/features/lessons';

/**
 * Свежая подписанная ссылка на видео-поток урока (ТЗ §6А.7). Плеер запрашивает её
 * при истечении токена/сбое сегмента, чтобы продолжить просмотр без перезагрузки.
 * Тонкий роут: проверка доступа и подпись — в features/lessons (ARCHITECTURE.md §2).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { lessonId } = await params;
  const url = await getLessonStreamUrl(session.user.id, lessonId);
  if (!url) {
    return NextResponse.json({ error: 'Видео недоступно' }, { status: 404 });
  }

  return NextResponse.json({ url }, { headers: { 'Cache-Control': 'private, no-store' } });
}
