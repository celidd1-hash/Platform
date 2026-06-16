import Link from 'next/link';
import { getCoursesTree, CourseManager } from '@/features/admin';

export const metadata = { title: 'Курсы — Админ — SVETOZAR SCHOOL' };

export default async function AdminCoursesPage() {
  const courses = await getCoursesTree();

  return (
    <div>
      <header className="mb-6 flex items-end justify-between">
        <div>
          <h1 className="font-display text-3xl font-semibold">Курсы и уроки</h1>
          <p className="mt-1 max-w-2xl text-sm text-muted">
            Структура, архивирование (обратимо) и полное удаление (необратимо, с очисткой хранилища).
          </p>
        </div>
        <Link
          href="/admin/courses/new"
          className="rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright"
        >
          + Новый курс
        </Link>
      </header>
      <CourseManager courses={courses} />
    </div>
  );
}
