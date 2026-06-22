import { db } from '@/lib/db';
import { EnrollmentStatus } from '@prisma/client';

/**
 * Доступ к БД для кабинетов учеников (ТЗ §3.7). Prisma-доступ в queries/ — разрешено линтером.
 */

export function listStudents(search: string | undefined, archived = false) {
  return db.user.findMany({
    where: {
      role: 'student',
      deletedAt: archived ? { not: null } : null,
      ...(search
        ? { OR: [{ name: { contains: search, mode: 'insensitive' } }, { email: { contains: search, mode: 'insensitive' } }] }
        : {}),
    },
    orderBy: { createdAt: 'desc' },
    take: 200,
    select: {
      id: true,
      name: true,
      email: true,
      xp: true,
      streakDays: true,
      isBlocked: true,
      createdAt: true,
      _count: { select: { enrollments: { where: { status: 'active' } } } },
    },
  });
}

export function getStudent(userId: string) {
  return db.user.findFirst({
    where: { id: userId, role: 'student' },
    select: {
      id: true,
      name: true,
      email: true,
      xp: true,
      streakDays: true,
      isBlocked: true,
      createdAt: true,
    },
  });
}

/** Доступы ученика к курсам + структура для подсчёта прогресса. */
export function getStudentEnrollments(userId: string) {
  return db.enrollment.findMany({
    where: { userId },
    select: {
      status: true,
      course: {
        select: {
          id: true,
          title: true,
          modules: {
            where: { isArchived: false, deletedAt: null },
            select: { lessons: { where: { isArchived: false, deletedAt: null }, select: { id: true } } },
          },
        },
      },
    },
  });
}

export function getStudentCompletedLessonIds(userId: string) {
  return db.lessonProgress
    .findMany({ where: { userId, status: 'completed' }, select: { lessonId: true } })
    .then((rows) => rows.map((r) => r.lessonId));
}

export function getStudentHomework(userId: string) {
  return db.homework.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    take: 100,
    select: {
      id: true,
      verdict: true,
      score: true,
      feedback: true,
      attemptNo: true,
      createdAt: true,
      lesson: { select: { title: true, module: { select: { course: { select: { title: true } } } } } },
    },
  });
}

export function getStudentAchievements(userId: string) {
  return db.userAchievement.findMany({
    where: { userId },
    orderBy: { earnedAt: 'desc' },
    select: { earnedAt: true, achievement: { select: { title: true, icon: true } } },
  });
}

/** Все курсы (включая черновики/архив) для выдачи доступа админом. */
export function listAllCoursesForGrant() {
  return db.course.findMany({
    where: { deletedAt: null },
    orderBy: { title: 'asc' },
    select: { id: true, title: true, isArchived: true },
  });
}

export function getEnrolledCourseIds(userId: string) {
  return db.enrollment
    .findMany({ where: { userId, status: 'active' }, select: { courseId: true } })
    .then((rows) => rows.map((r) => r.courseId));
}

// ── Мутации ──

export function grantEnrollment(userId: string, courseId: string, grantedById: string) {
  return db.enrollment.upsert({
    where: { userId_courseId: { userId, courseId } },
    update: { status: EnrollmentStatus.active, grantedById },
    create: { userId, courseId, grantedById, status: EnrollmentStatus.active },
  });
}

export function revokeEnrollment(userId: string, courseId: string) {
  return db.enrollment.updateMany({
    where: { userId, courseId },
    data: { status: EnrollmentStatus.revoked },
  });
}

export function setBlocked(userId: string, blocked: boolean) {
  return db.user.update({ where: { id: userId }, data: { isBlocked: blocked } });
}

/** Мягкое удаление ученика: архив (deletedAt) + блокировка входа + снятие с рейтинга. */
export function softDeleteStudent(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { deletedAt: new Date(), isBlocked: true, isPublicInRating: false },
  });
}

/** Возврат ученика из архива: снимаем deletedAt, разблокируем, возвращаем в рейтинг. */
export function restoreStudent(userId: string) {
  return db.user.update({
    where: { id: userId },
    data: { deletedAt: null, isBlocked: false, isPublicInRating: true },
  });
}

/** Существует ли архивированный ученик (для восстановления). */
export function archivedStudentExists(userId: string) {
  return db.user.findFirst({
    where: { id: userId, role: 'student', deletedAt: { not: null } },
    select: { id: true, name: true },
  });
}

export function studentExists(userId: string) {
  return db.user.findFirst({
    where: { id: userId, role: 'student', deletedAt: null },
    select: { id: true, name: true },
  });
}
