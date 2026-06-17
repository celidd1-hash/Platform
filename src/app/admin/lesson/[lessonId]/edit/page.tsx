import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getLessonEditor, LessonForm, LessonFilesEditor } from '@/features/admin';

export const metadata = { title: 'Редактор урока — Админ — SVETOZAR SCHOOL' };

export default async function LessonEditorPage({
  params,
}: {
  params: Promise<{ lessonId: string }>;
}) {
  const { lessonId } = await params;
  const lesson = await getLessonEditor(lessonId);
  if (!lesson) notFound();

  return (
    <div className="max-w-3xl">
      <Link href={`/admin/courses/${lesson.module.course.id}`} className="text-xs text-muted-2 hover:text-gold">
        ← {lesson.module.course.title}
      </Link>
      <div className="mt-2 font-label text-[11px] uppercase tracking-[2px] text-muted-2">{lesson.module.title}</div>
      <h1 className="mb-6 mt-1 font-display text-3xl font-semibold">Урок: {lesson.title}</h1>

      <LessonForm
        lesson={{
          id: lesson.id,
          moduleId: lesson.module.id,
          title: lesson.title,
          position: lesson.position,
          lessonSummaryMd: lesson.lessonSummaryMd,
          contentMd: lesson.contentMd,
          videoUrl: lesson.videoUrl,
          materialsUrl: lesson.materialsUrl,
          requiresNote: lesson.requiresNote,
          minNoteLength: lesson.minNoteLength,
          xpReward: lesson.xpReward,
        }}
      />

      <div className="mt-6">
        <LessonFilesEditor lessonId={lesson.id} files={lesson.files} />
      </div>
    </div>
  );
}
