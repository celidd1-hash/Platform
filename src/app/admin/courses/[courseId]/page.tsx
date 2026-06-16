import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getCourseEditor, CourseForm, StructureEditor } from '@/features/admin';

export const metadata = { title: 'Редактор курса — Админ — SVETOZAR SCHOOL' };

export default async function CourseEditorPage({
  params,
}: {
  params: Promise<{ courseId: string }>;
}) {
  const { courseId } = await params;
  const course = await getCourseEditor(courseId);
  if (!course) notFound();

  return (
    <div className="max-w-3xl">
      <Link href="/admin/courses" className="text-xs text-muted-2 hover:text-gold">← Курсы</Link>
      <h1 className="mb-6 mt-2 font-display text-3xl font-semibold">{course.title}</h1>

      <section className="mb-8">
        <div className="sectlabel mb-4">Параметры курса</div>
        <CourseForm
          course={{
            id: course.id,
            title: course.title,
            description: course.description,
            durationWeeks: course.durationWeeks,
            isStrictOrder: course.isStrictOrder,
            isPublished: course.isPublished,
          }}
        />
      </section>

      <section>
        <div className="sectlabel mb-4">Структура</div>
        <StructureEditor courseId={course.id} modules={course.modules} />
      </section>
    </div>
  );
}
