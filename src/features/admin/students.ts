import { z } from 'zod';
import { computeProgressPct } from '@/lib/progress';
import { hashPassword } from '@/lib/password';
import { ok, fail, type ActionResult } from '@/lib/utils';
import { PASSWORD } from '@/config/constants';
import { writeAuditLog } from './queries';
import * as q from './queries/students';

/**
 * Сервис кабинетов учеников (ТЗ §3.7): список, карточка, выдача/отзыв доступа, блокировка.
 * Вызывается после проверки роли admin (в actions). Все действия — в аудит-журнал.
 */

export interface StudentRow {
  id: string;
  name: string;
  email: string;
  xp: number;
  streakDays: number;
  isBlocked: boolean;
  courses: number;
  createdAt: Date;
}

export async function listStudents(search?: string, archived = false): Promise<StudentRow[]> {
  const rows = await q.listStudents(search?.trim() || undefined, archived);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    xp: r.xp,
    streakDays: r.streakDays,
    isBlocked: r.isBlocked,
    courses: r._count.enrollments,
    createdAt: r.createdAt,
  }));
}

export interface StudentCabinet {
  id: string;
  name: string;
  email: string;
  xp: number;
  streakDays: number;
  isBlocked: boolean;
  createdAt: Date;
  courses: Array<{ id: string; title: string; status: string; progressPct: number; granted: boolean }>;
  allCourses: Array<{ id: string; title: string; isArchived: boolean; granted: boolean }>;
  homework: Array<{
    id: string;
    course: string;
    lesson: string;
    verdict: string | null;
    score: number | null;
    feedback: string | null;
    attemptNo: number;
    createdAt: Date;
  }>;
  achievements: Array<{ title: string; icon: string | null; earnedAt: Date }>;
}

export async function getStudentCabinet(userId: string): Promise<StudentCabinet | null> {
  const user = await q.getStudent(userId);
  if (!user) return null;

  const [enrollments, completedIds, homework, achievements, allCourses, enrolledIds] =
    await Promise.all([
      q.getStudentEnrollments(userId),
      q.getStudentCompletedLessonIds(userId),
      q.getStudentHomework(userId),
      q.getStudentAchievements(userId),
      q.listAllCoursesForGrant(),
      q.getEnrolledCourseIds(userId),
    ]);
  const completed = new Set(completedIds);
  const enrolled = new Set(enrolledIds);

  const courses = enrollments.map((e) => {
    const lessonIds = e.course.modules.flatMap((m) => m.lessons.map((l) => l.id));
    const done = lessonIds.filter((id) => completed.has(id)).length;
    return {
      id: e.course.id,
      title: e.course.title,
      status: e.status,
      progressPct: computeProgressPct(lessonIds.length, done),
      granted: e.status === 'active',
    };
  });

  return {
    id: user.id,
    name: user.name,
    email: user.email,
    xp: user.xp,
    streakDays: user.streakDays,
    isBlocked: user.isBlocked,
    createdAt: user.createdAt,
    courses,
    allCourses: allCourses.map((c) => ({
      id: c.id,
      title: c.title,
      isArchived: c.isArchived,
      granted: enrolled.has(c.id),
    })),
    homework: homework.map((h) => ({
      id: h.id,
      course: h.lesson.module.course.title,
      lesson: h.lesson.title,
      verdict: h.verdict,
      score: h.score,
      feedback: h.feedback,
      attemptNo: h.attemptNo,
      createdAt: h.createdAt,
    })),
    achievements: achievements.map((a) => ({
      title: a.achievement.title,
      icon: a.achievement.icon,
      earnedAt: a.earnedAt,
    })),
  };
}

/** Контракт создания ученика админом (валидация на границе action). */
export const createStudentSchema = z.object({
  name: z.string().trim().min(2, 'Укажите имя').max(80),
  email: z.string().trim().toLowerCase().email('Введите корректный email'),
  password: z
    .string()
    .min(PASSWORD.MIN_LENGTH, `Пароль не короче ${PASSWORD.MIN_LENGTH} символов`)
    .max(128, 'Пароль слишком длинный'),
});

export type CreateStudentInput = z.infer<typeof createStudentSchema>;

/**
 * Создание ученика админом вручную (ТЗ §3.7): аккаунт сразу с подтверждённым email,
 * чтобы ученик мог войти по выданному паролю без письма. Роль всегда student.
 * Пароль ученик может сменить сам в кабинете (profile.changePassword).
 */
export async function createStudent(
  adminId: string,
  input: CreateStudentInput,
): Promise<ActionResult<{ id: string; email: string }>> {
  const existing = await q.findUserByEmail(input.email);
  if (existing) return fail('Пользователь с таким email уже существует');
  const passwordHash = await hashPassword(input.password);
  const user = await q.createVerifiedStudent({
    email: input.email,
    name: input.name,
    passwordHash,
  });
  // В аудит — без email/пароля (ТЗ §6А.9): только факт и id созданного ученика.
  await writeAuditLog({ actorId: adminId, action: 'user_create', targetType: 'user', targetId: user.id });
  return ok({ id: user.id, email: input.email });
}

export async function grantAccess(
  adminId: string,
  userId: string,
  courseId: string,
): Promise<ActionResult<null>> {
  const student = await q.studentExists(userId);
  if (!student) return fail('Ученик не найден');
  await q.grantEnrollment(userId, courseId, adminId);
  await writeAuditLog({ actorId: adminId, action: 'enrollment_grant', targetType: 'user', targetId: userId, meta: { courseId } });
  return ok(null);
}

export async function revokeAccess(
  adminId: string,
  userId: string,
  courseId: string,
): Promise<ActionResult<null>> {
  await q.revokeEnrollment(userId, courseId);
  await writeAuditLog({ actorId: adminId, action: 'enrollment_revoke', targetType: 'user', targetId: userId, meta: { courseId } });
  return ok(null);
}

export async function setBlocked(
  adminId: string,
  userId: string,
  blocked: boolean,
): Promise<ActionResult<{ blocked: boolean }>> {
  const student = await q.studentExists(userId);
  if (!student) return fail('Ученик не найден');
  await q.setBlocked(userId, blocked);
  await writeAuditLog({ actorId: adminId, action: blocked ? 'user_block' : 'user_unblock', targetType: 'user', targetId: userId });
  return ok({ blocked });
}

/**
 * Мягкое удаление ученика (ТЗ §3.7): уходит в архив — вход закрыт, убран из рейтингов,
 * не виден в списке. Данные (прогресс/ДЗ/доступы) сохраняются, действие пишется в аудит.
 */
export async function deleteStudent(adminId: string, userId: string): Promise<ActionResult<null>> {
  const student = await q.studentExists(userId);
  if (!student) return fail('Ученик не найден');
  await q.softDeleteStudent(userId);
  await writeAuditLog({ actorId: adminId, action: 'user_delete', targetType: 'user', targetId: userId, meta: { name: student.name } });
  return ok(null);
}

/** Возврат ученика из архива (ТЗ §3.7): снова активен, в рейтинге, вход открыт. */
export async function restoreStudent(adminId: string, userId: string): Promise<ActionResult<null>> {
  const student = await q.archivedStudentExists(userId);
  if (!student) return fail('Архивный ученик не найден');
  await q.restoreStudent(userId);
  await writeAuditLog({ actorId: adminId, action: 'user_restore', targetType: 'user', targetId: userId, meta: { name: student.name } });
  return ok(null);
}
