import { describe, it, expect, vi, beforeEach } from 'vitest';

// Мокаем БД-доступ и провайдеры — тестируем логику архива/удаления (Дополнение №1).
vi.mock('@/features/admin/queries', () => ({
  listCoursesAdmin: vi.fn(),
  setCourseArchived: vi.fn(),
  setModuleArchived: vi.fn(),
  setLessonArchived: vi.fn(),
  getCourseImpact: vi.fn(),
  getLessonImpact: vi.fn(),
  getCourseAssets: vi.fn(),
  getModuleAssets: vi.fn(),
  getLessonAssets: vi.fn(),
  deleteCourse: vi.fn(),
  deleteModule: vi.fn(),
  deleteLesson: vi.fn(),
  courseExists: vi.fn(),
  moduleExists: vi.fn(),
  lessonExists: vi.fn(),
  writeAuditLog: vi.fn(),
}));
const deleteVideo = vi.fn().mockResolvedValue({ ok: true });
const deleteFile = vi.fn().mockResolvedValue({ ok: true });
vi.mock('@/lib/providers/video', () => ({ getVideoProvider: () => ({ deleteVideo }) }));
vi.mock('@/lib/providers/file', () => ({ getFileProvider: () => ({ deleteFile }) }));

import * as q from '@/features/admin/queries';
import { setArchived, hardDelete, getImpact } from '@/features/admin/service';

beforeEach(() => {
  vi.clearAllMocks();
  vi.mocked(q.courseExists).mockResolvedValue({ id: 'c1', title: 'Курс' } as never);
  vi.mocked(q.lessonExists).mockResolvedValue({ id: 'l1', title: 'Урок' } as never);
});

describe('setArchived — мягкое удаление (Дополнение №1 §2)', () => {
  it('архивирует курс и пишет аудит', async () => {
    const r = await setArchived('admin1', 'course', 'c1', true);
    expect(r.ok).toBe(true);
    expect(q.setCourseArchived).toHaveBeenCalledWith('c1', true);
    expect(q.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ actorId: 'admin1', action: 'course_archive', targetId: 'c1' }),
    );
  });

  it('восстанавливает курс (action course_restore)', async () => {
    await setArchived('admin1', 'course', 'c1', false);
    expect(q.setCourseArchived).toHaveBeenCalledWith('c1', false);
    expect(q.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'course_restore' }),
    );
  });

  it('возвращает ошибку для несуществующего объекта', async () => {
    vi.mocked(q.courseExists).mockResolvedValue(null);
    const r = await setArchived('admin1', 'course', 'nope', true);
    expect(r.ok).toBe(false);
  });
});

describe('getImpact — охват перед удалением (Дополнение №1 §3)', () => {
  it('возвращает счётчики затрагиваемых данных курса', async () => {
    vi.mocked(q.getCourseImpact).mockResolvedValue({ students: 5, homework: 12, files: 3, lessons: 7 });
    const r = await getImpact('course', 'c1');
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.students).toBe(5);
      expect(r.data.homework).toBe(12);
    }
  });
});

describe('hardDelete — полное удаление + очистка Bunny (Дополнение №1 §2)', () => {
  it('удаляет из БД, чистит видео/файлы и пишет аудит', async () => {
    vi.mocked(q.getCourseAssets).mockResolvedValue({
      videoIds: ['v1', 'v2'],
      fileUrls: ['https://f/1', 'https://f/2', 'https://f/3'],
    });
    const r = await hardDelete('admin1', 'course', 'c1');
    expect(r.ok).toBe(true);
    expect(q.deleteCourse).toHaveBeenCalledWith('c1');
    expect(deleteVideo).toHaveBeenCalledTimes(2);
    expect(deleteFile).toHaveBeenCalledTimes(3);
    if (r.ok) {
      expect(r.data.cleanedVideos).toBe(2);
      expect(r.data.cleanedFiles).toBe(3);
    }
    expect(q.writeAuditLog).toHaveBeenCalledWith(
      expect.objectContaining({ action: 'course_delete', targetId: 'c1' }),
    );
  });

  it('собирает ассеты ДО удаления из БД (иначе их не достать)', async () => {
    const order: string[] = [];
    vi.mocked(q.getCourseAssets).mockImplementation((async () => {
      order.push('assets');
      return { videoIds: [], fileUrls: [] };
    }) as never);
    vi.mocked(q.deleteCourse).mockImplementation((() => {
      order.push('delete');
      return Promise.resolve({});
    }) as never);
    await hardDelete('admin1', 'course', 'c1');
    expect(order).toEqual(['assets', 'delete']);
  });
});
