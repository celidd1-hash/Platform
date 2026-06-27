import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Markdown } from '@/components/ui/Markdown';
import { auth } from '@/features/auth';
import { getLessonForUser, LessonStage, LessonNav } from '@/features/lessons';
import { HomeworkBlock } from '@/features/homework';

export default async function LessonPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) notFound();

  const result = await getLessonForUser(id, userId);

  if (result.kind === 'not_found') notFound();
  if (result.kind === 'access_denied') redirect(`/course/${result.courseSlug}`);
  if (result.kind === 'locked') redirect(`/course/${result.courseSlug}`);

  const lesson = result.lesson;

  const lockHint = lesson.requiresNote
    ? 'Откроется после просмотра видео и отправки домашнего задания.'
    : 'Откроется после просмотра видео урока.';

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <header className="mb-4">
          <Link href={`/course/${lesson.course.slug}`} className="text-xs text-muted-2 hover:text-gold">
            ← {lesson.course.title}
          </Link>
          <div className="mt-2 font-label text-[11px] uppercase tracking-[2px] text-gold">
            Модуль {lesson.moduleNumber} • Урок {lesson.lessonNumber}
          </div>
          <div className="mt-1 font-label text-[11px] uppercase tracking-[2px] text-muted-2">
            {lesson.moduleTitle}
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {lesson.title}
            {lesson.completed && <span className="ml-3 align-middle text-base text-ok">✓ пройдено</span>}
          </h1>

          {/* «Введение» — текст под названием урока, без подписи (подпись только в админке). */}
          {lesson.contentMd && (
            <div className="mt-3 text-[15px] leading-relaxed text-muted">
              <Markdown>{lesson.contentMd}</Markdown>
            </div>
          )}
        </header>

        <LessonStage
          lessonId={lesson.id}
          src={lesson.videoSignedUrl}
          initialPosition={lesson.videoPosition}
          completed={lesson.completed}
          requiresNote={lesson.requiresNote}
          homeworkPassed={lesson.homeworkPassed}
          files={lesson.files}
          materialsUrl={lesson.materialsUrl}
          filesUnlocked={lesson.filesUnlocked}
          lockHint={lockHint}
        >
          {/* Блок ДЗ с проверкой ИИ-наставником (ТЗ §3.4) — под плеером. */}
          {lesson.requiresNote && (
            <HomeworkBlock
              lessonId={lesson.id}
              minLength={lesson.minNoteLength}
              alreadyPassed={lesson.homeworkPassed}
            />
          )}

          <LessonNav prev={lesson.prev} next={lesson.next} courseSlug={lesson.course.slug} />
        </LessonStage>
      </div>
    </AppShell>
  );
}
