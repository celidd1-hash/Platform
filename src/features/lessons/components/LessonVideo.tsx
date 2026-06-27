'use client';

import { useCallback } from 'react';
import { LessonPlayer } from './LessonPlayer';
import { saveProgressAction, markWatchedAction } from '../actions';

/**
 * Связывает «глупый» LessonPlayer с server actions: сохранение позиции и отметку просмотра.
 * При достижении 80% фиксируем просмотр (открывает следующий урок/материалы) БЕЗ зачёта —
 * сам зачёт делает кнопка «Завершить урок» в LessonStage.
 */
export function LessonVideo({
  lessonId,
  src,
  initialPosition,
  lockSeek = false,
  onMeta,
  onProgress,
}: {
  lessonId: string;
  src: string | null;
  initialPosition: number;
  /** Запрет перемотки вперёд при первом просмотре (при повторе урока — false). */
  lockSeek?: boolean;
  /** Длительность видео (сек) известна — для плашки длительности. */
  onMeta?: (durationSec: number) => void;
  /** Доля просмотра 0..100 — для плашки «просмотрено видео». */
  onProgress?: (pct: number) => void;
}) {
  // Свежая подписанная ссылка по запросу плеера (истёк токен/сбой сегмента) — продолжаем без перезагрузки.
  const refreshSrc = useCallback(async (): Promise<string | null> => {
    try {
      const res = await fetch(`/api/lesson/${lessonId}/stream-url`, { cache: 'no-store' });
      if (!res.ok) return null;
      const data = (await res.json()) as { url?: string };
      return typeof data.url === 'string' ? data.url : null;
    } catch {
      return null;
    }
  }, [lessonId]);

  return (
    <LessonPlayer
      src={src}
      initialPosition={initialPosition}
      lockSeek={lockSeek}
      refreshSrc={refreshSrc}
      onMeta={onMeta}
      onProgress={onProgress}
      onSavePosition={(seconds) => {
        void saveProgressAction(lessonId, seconds);
      }}
      onWatched={() => {
        // Авто-фиксация просмотра (без зачёта): открывает следующий урок/материалы.
        void markWatchedAction(lessonId, false);
      }}
    />
  );
}
