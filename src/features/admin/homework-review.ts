import * as q from './queries/homework';

/** Сервис проверки ДЗ админом (ТЗ §3.7): просмотр с фильтром по курсу/вердикту. */

export interface HomeworkReviewItem {
  id: string;
  studentId: string;
  studentName: string;
  course: string;
  lesson: string;
  text: string;
  verdict: string | null;
  score: number | null;
  feedback: string | null;
  attemptNo: number;
  createdAt: Date;
}

export interface HomeworkReviewData {
  courses: Array<{ id: string; title: string }>;
  items: HomeworkReviewItem[];
  filter: { courseId: string; verdict: string };
}

export async function getHomeworkReview(filter: {
  courseId?: string;
  verdict?: string;
}): Promise<HomeworkReviewData> {
  const [courses, rows] = await Promise.all([q.listCourses(), q.listHomework(filter)]);
  return {
    courses,
    filter: { courseId: filter.courseId ?? '', verdict: filter.verdict ?? '' },
    items: rows.map((h) => ({
      id: h.id,
      studentId: h.user.id,
      studentName: h.user.name,
      course: h.lesson.module.course.title,
      lesson: h.lesson.title,
      text: h.text,
      verdict: h.verdict,
      score: h.score,
      feedback: h.feedback,
      attemptNo: h.attemptNo,
      createdAt: h.createdAt,
    })),
  };
}
