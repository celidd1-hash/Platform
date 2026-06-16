import Link from 'next/link';
import { CourseForm } from '@/features/admin';

export const metadata = { title: 'Новый курс — Админ — SVETOZAR SCHOOL' };

export default function NewCoursePage() {
  return (
    <div className="max-w-2xl">
      <Link href="/admin/courses" className="text-xs text-muted-2 hover:text-gold">← Курсы</Link>
      <h1 className="mb-6 mt-2 font-display text-3xl font-semibold">Новый курс</h1>
      <CourseForm />
    </div>
  );
}
