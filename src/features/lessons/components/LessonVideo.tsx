'use client';

import { useRouter } from 'next/navigation';
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
}: {
  lessonId: string;
  src: string | null;
  initialPosition: number;
}) {
  const router = useRouter();

  return (
    <LessonPlayer
      src={src}
      initialPosition={initialPosition}
      onSavePosition={(seconds) => {
        void saveProgressAction(lessonId, seconds);
      }}
      onWatched={() => {
        void markWatchedAction(lessonId).then((res) => {
          if (res.ok && res.data.completed) router.refresh();
        });
      }}
    />
  );
}
