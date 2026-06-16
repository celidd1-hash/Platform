import { getVideoProvider } from '@/lib/providers/video';
import { getFileProvider } from '@/lib/providers/file';
import { ok, fail, type ActionResult } from '@/lib/utils';
import * as q from './queries';

/**
 * Бизнес-логика управления структурой курсов (Дополнение №1, ТЗ §3.7).
 * Два режима удаления: мягкое (архив, обратимо, данные целы) и полное (каскад + очистка хранилища).
 * Любое действие пишется в аудит-журнал. Вызывается только после проверки роли admin.
 */

export type TargetType = 'course' | 'module' | 'lesson';

export interface AdminCourseNode {
  id: string;
  title: string;
  slug: string;
  isPublished: boolean;
  isArchived: boolean;
  students: number;
  modules: Array<{
    id: string;
    title: string;
    isArchived: boolean;
    lessons: Array<{ id: string; title: string; isArchived: boolean }>;
  }>;
}

export async function getCoursesTree(): Promise<AdminCourseNode[]> {
  const courses = await q.listCoursesAdmin();
  return courses.map((c) => ({
    id: c.id,
    title: c.title,
    slug: c.slug,
    isPublished: c.isPublished,
    isArchived: c.isArchived,
    students: c._count.enrollments,
    modules: c.modules.map((m) => ({
      id: m.id,
      title: m.title,
      isArchived: m.isArchived,
      lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, isArchived: l.isArchived })),
    })),
  }));
}

/** Мягкое удаление / восстановление (Дополнение №1 §2). Данные сохраняются. */
export async function setArchived(
  adminId: string,
  target: TargetType,
  id: string,
  archived: boolean,
): Promise<ActionResult<null>> {
  const exists = await targetExists(target, id);
  if (!exists) return fail('Объект не найден');

  if (target === 'course') await q.setCourseArchived(id, archived);
  else if (target === 'module') await q.setModuleArchived(id, archived);
  else await q.setLessonArchived(id, archived);

  await q.writeAuditLog({
    actorId: adminId,
    action: archived ? `${target}_archive` : `${target}_restore`,
    targetType: target,
    targetId: id,
    meta: { title: exists.title },
  });
  return ok(null);
}

export interface ImpactSummary {
  title: string;
  students?: number;
  homework: number;
  files: number;
  lessons?: number;
}

/** Охват затрагиваемых данных перед полным удалением (Дополнение №1 §2-3). */
export async function getImpact(
  target: TargetType,
  id: string,
): Promise<ActionResult<ImpactSummary>> {
  const exists = await targetExists(target, id);
  if (!exists) return fail('Объект не найден');

  if (target === 'course') {
    const i = await q.getCourseImpact(id);
    return ok({ title: exists.title, students: i.students, homework: i.homework, files: i.files, lessons: i.lessons });
  }
  if (target === 'lesson') {
    const i = await q.getLessonImpact(id);
    return ok({ title: exists.title, homework: i.homework, files: i.files });
  }
  // module: суммируем по урокам через ассеты/каунты курса недоступно напрямую — считаем по урокам модуля.
  const assets = await q.getModuleAssets(id);
  return ok({ title: exists.title, homework: 0, files: assets.fileUrls.length });
}

/**
 * Полное (необратимое) удаление (Дополнение №1 §2). Каскад в БД + очистка Bunny (best-effort).
 * Файлы/видео удаляются из хранилища; даже при сбое очистки БД-удаление выполняется.
 */
export async function hardDelete(
  adminId: string,
  target: TargetType,
  id: string,
): Promise<ActionResult<{ cleanedVideos: number; cleanedFiles: number }>> {
  const exists = await targetExists(target, id);
  if (!exists) return fail('Объект не найден');

  // 1) Сначала собираем ассеты (после удаления из БД их не достать).
  const assets =
    target === 'course'
      ? await q.getCourseAssets(id)
      : target === 'module'
        ? await q.getModuleAssets(id)
        : await q.getLessonAssets(id);

  // 2) Удаляем из БД (каскадом удалятся модули/уроки/вложения/прогресс/ДЗ).
  if (target === 'course') await q.deleteCourse(id);
  else if (target === 'module') await q.deleteModule(id);
  else await q.deleteLesson(id);

  // 3) Best-effort очистка хранилища (не блокирует удаление при сбое сети).
  const video = await getVideoProvider();
  const file = await getFileProvider();
  let cleanedVideos = 0;
  let cleanedFiles = 0;
  for (const v of assets.videoIds) {
    const r = await video.deleteVideo(v).catch(() => ({ ok: false }));
    if (r.ok) cleanedVideos++;
  }
  for (const f of assets.fileUrls) {
    const r = await file.deleteFile(f).catch(() => ({ ok: false }));
    if (r.ok) cleanedFiles++;
  }

  await q.writeAuditLog({
    actorId: adminId,
    action: `${target}_delete`,
    targetType: target,
    targetId: id,
    meta: {
      title: exists.title,
      videos: assets.videoIds.length,
      files: assets.fileUrls.length,
      cleanedVideos,
      cleanedFiles,
    },
  });

  return ok({ cleanedVideos, cleanedFiles });
}

async function targetExists(target: TargetType, id: string) {
  if (target === 'course') return q.courseExists(id);
  if (target === 'module') return q.moduleExists(id);
  return q.lessonExists(id);
}
