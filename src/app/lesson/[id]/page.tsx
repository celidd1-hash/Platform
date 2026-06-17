import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { AppShell } from '@/components/AppShell';
import { Markdown } from '@/components/ui/Markdown';
import { auth } from '@/features/auth';
import { getLessonForUser, LessonVideo, LessonFiles, LessonNav } from '@/features/lessons';
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

  return (
    <AppShell>
      <div className="mx-auto max-w-3xl">
        <header className="mb-5">
          <Link href={`/course/${lesson.course.slug}`} className="text-xs text-muted-2 hover:text-gold">
            ← {lesson.course.title}
          </Link>
          <div className="mt-2 font-label text-[11px] uppercase tracking-[2px] text-muted-2">
            {lesson.moduleTitle}
          </div>
          <h1 className="mt-1 font-display text-3xl font-semibold">
            {lesson.title}
            {lesson.completed && <span className="ml-3 align-middle text-base text-ok">✓ пройдено</span>}
          </h1>
        </header>

        <LessonVideo lessonId={lesson.id} src={lesson.videoSignedUrl} initialPosition={lesson.videoPosition} />

        {lesson.summaryMd && (
          <div className="mt-6 rounded-token border border-line bg-panel p-5">
            <div className="sectlabel mb-3">Кратко об уроке</div>
            <Markdown>{lesson.summaryMd}</Markdown>
          </div>
        )}

        {lesson.contentMd && (
          <div className="mt-6">
            <Markdown>{lesson.contentMd}</Markdown>
          </div>
        )}

        <div className="mt-6">
          <LessonFiles
            lessonId={lesson.id}
            files={lesson.files}
            unlocked={lesson.filesUnlocked}
            lockHint={
              lesson.requiresNote
                ? 'Откроется после просмотра видео и отправки домашнего задания.'
                : 'Откроется после просмотра видео урока.'
            }
          />
        </div>

        {/* Блок ДЗ с проверкой ИИ-наставником (ТЗ §3.4). */}
        {lesson.requiresNote && (
          <div className="mt-6">
            <HomeworkBlock
              lessonId={lesson.id}
              minLength={lesson.minNoteLength}
              alreadyPassed={lesson.completed}
            />
          </div>
        )}

        <div className="mt-8">
          <LessonNav prev={lesson.prev} next={lesson.next} courseSlug={lesson.course.slug} />
        </div>
      </div>
    </AppShell>
  );
}
