import * as q from './queries/stats';

/** Сервис дашборда админки (ТЗ §3.7). */

export interface DashboardData {
  totalStudents: number;
  activeWeek: number;
  publishedCourses: number;
  avgHomeworkScore: number | null;
  aiChecks: number;
  pendingHomework: number;
  courses: Array<{ id: string; title: string; students: number; lessons: number }>;
}

export async function getDashboard(): Promise<DashboardData> {
  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const [stats, courses] = await Promise.all([
    q.getDashboardStats(weekAgo),
    q.getCourseCompletion(),
  ]);
  return { ...stats, courses };
}
