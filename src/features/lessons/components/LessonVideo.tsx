'use client';

import { useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { celebrate } from '@/features/gamification/components/Celebration';
import { LessonPlayer } from './LessonPlayer';
import { saveProgressAction, markWatchedAction } from '../actions';

/**
 * Связывает «глупый» LessonPlayer с server actions: сохранение позиции и отметку
 * просмотра. После зачёта обновляет страницу (откроется следующий урок).
 */
export function LessonVideo({
  lessonId,
  src,
  initialPosition,
  onMeta,
  onProgress,
}: {
  lessonId: string;
  src: string | null;
  initialPosition: number;
  /** Длительность видео (сек) известна — для плашки длительности. */
  onMeta?: (durationSec: number) => void;
  /** Доля просмотра 0..100 — для плашки «просмотрено видео». */
  onProgress?: (pct: number) => void;
}) {
  const router = useRouter();

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
      refreshSrc={refreshSrc}
      onMeta={onMeta}
      onProgress={onProgress}
      onSavePosition={(seconds) => {
        void saveProgressAction(lessonId, seconds);
      }}
      onWatched={() => {
        void markWatchedAction(lessonId).then((res) => {
          if (res.ok && res.data.completed) {
            if (res.data.reward) celebrate(res.data.reward);
            router.refresh();
          }
        });
      }}
    />
  );
}
