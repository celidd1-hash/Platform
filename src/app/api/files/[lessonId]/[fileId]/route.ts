import { NextResponse } from 'next/server';
import { auth } from '@/features/auth';
import { getFileDownload } from '@/features/lessons';

/**
 * Скачивание вложения урока по подписанной ссылке с проверкой доступа (ТЗ §6А.7).
 * Прямой публичный URL файла недоступен — только авторизованному ученику с enrollment.
 * Тонкий роут: вся логика и проверка владения — в features/lessons (ARCHITECTURE.md §2).
 */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ lessonId: string; fileId: string }> },
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
  }

  const { lessonId, fileId } = await params;
  const download = await getFileDownload(session.user.id, lessonId, fileId);
  if (!download) {
    return NextResponse.json({ error: 'Файл недоступен' }, { status: 404 });
  }

  // Стримим файл из хранилища через сервер (публичного URL у файла нет, ТЗ §6А.6/§6А.7).
  return new NextResponse(download.body, {
    headers: {
      'Content-Type': download.contentType,
      'Content-Disposition': `attachment; filename*=UTF-8''${encodeURIComponent(download.filename)}`,
      'X-Content-Type-Options': 'nosniff',
      'Cache-Control': 'private, no-store',
    },
  });
}
