'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';
import { LESSON } from '@/config/constants';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Собственный плеер платформы (ТЗ §3.3, §5.3): native <video> + hls.js (ABR),
 * без чужого брендинга. Запоминание позиции, скорости 0.5–2×, запрет скачивания.
 * Поток приходит подписанной HLS-ссылкой с коротким TTL (signed URL генерит сервер).
 */
/** Допуск (сек) при запрете перемотки — чтобы не реагировать на дребезг позиции. */
const SEEK_TOLERANCE_SEC = 1.5;

export function LessonPlayer({
  src,
  initialPosition = 0,
  lockSeek = false,
  onSavePosition,
  onWatched,
  onMeta,
  onProgress,
  refreshSrc,
}: {
  src: string | null;
  initialPosition?: number;
  /** Запрет перемотки вперёд дальше просмотренного (первый просмотр; при повторе — false). */
  lockSeek?: boolean;
  /** Сохранить позицию (сек). Дросселируется — вызывается не чаще раза в 10 с. */
  onSavePosition?: (seconds: number) => void;
  /** Видео просмотрено полностью (LESSON.WATCHED_THRESHOLD = 100%). */
  onWatched?: () => void;
  /** Длительность видео (сек) известна — для плашки длительности. */
  onMeta?: (durationSec: number) => void;
  /** Доля просмотра 0..100 (по текущей позиции) — для плашки «просмотрено видео». */
  onProgress?: (pct: number) => void;
  /** Получить свежую подписанную ссылку (истёк токен/сбой сегмента) — для продолжения без перезагрузки. */
  refreshSrc?: () => Promise<string | null>;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);
  const watchedSentRef = useRef(false);
  const refreshSrcRef = useRef(refreshSrc);
  refreshSrcRef.current = refreshSrc;
  const onMetaRef = useRef(onMeta);
  onMetaRef.current = onMeta;
  const onWatchedRef = useRef(onWatched);
  onWatchedRef.current = onWatched;
  const onProgressRef = useRef(onProgress);
  onProgressRef.current = onProgress;
  const lastPctRef = useRef(-1);
  const lastRefreshRef = useRef(0);
  // Максимально просмотренная точка (сек) — потолок перемотки при lockSeek.
  const maxTimeRef = useRef(initialPosition);
  const lockSeekRef = useRef(lockSeek);
  lockSeekRef.current = lockSeek;
  const [speed, setSpeed] = useState(1);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || !src) return;

    let hls: Hls | null = null;
    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      // Safari — нативный HLS.
      video.src = src;
    } else if (Hls.isSupported()) {
      hls = new Hls({ enableWorker: true });
      hls.loadSource(src);
      hls.attachMedia(video);
      // Авто-восстановление: при фатальном сбое сети/сегмента (моргнул интернет, отдача CDN
      // или истёк токен подписи) hls.js иначе встаёт намертво до перезагрузки. Сетевые сбои
      // часто = протухший токен → тянем свежую подписанную ссылку и продолжаем с того же места.
      hls.on(Hls.Events.ERROR, (_event, data) => {
        if (!data.fatal || !hls) return;
        if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
          const now = Date.now();
          // Троттлинг: не чаще раза в 5 с — защита от петли при недоступном видео.
          if (refreshSrcRef.current && now - lastRefreshRef.current > 5000) {
            lastRefreshRef.current = now;
            void refreshSrcRef.current().then((fresh) => {
              if (!hls) return;
              if (fresh) hls.loadSource(fresh); // новая ссылка → currentTime сохраняется
              hls.startLoad();
            });
          } else {
            hls.startLoad();
          }
        } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
          hls.recoverMediaError();
        } else {
          hls.destroy();
        }
      });
    } else {
      video.src = src;
    }

    const onLoaded = () => {
      if (video.duration > 0) onMetaRef.current?.(video.duration);
      if (initialPosition > 0 && initialPosition < video.duration) {
        video.currentTime = initialPosition;
        maxTimeRef.current = Math.max(maxTimeRef.current, initialPosition);
      }
    };
    video.addEventListener('loadedmetadata', onLoaded);

    // Запрет перемотки вперёд (первый просмотр): возвращаем на максимально просмотренную точку.
    const clampSeek = () => {
      if (!lockSeekRef.current) return;
      const max = maxTimeRef.current;
      if (video.currentTime > max + SEEK_TOLERANCE_SEC) {
        video.currentTime = max;
      }
    };
    video.addEventListener('seeking', clampSeek);
    video.addEventListener('seeked', clampSeek);

    // Полный просмотр: конец видео гарантирует 100% и отметку просмотра (без зачёта).
    const onEnded = () => {
      onProgressRef.current?.(100);
      if (!watchedSentRef.current) {
        watchedSentRef.current = true;
        onWatchedRef.current?.();
      }
    };
    video.addEventListener('ended', onEnded);

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      video.removeEventListener('seeking', clampSeek);
      video.removeEventListener('seeked', clampSeek);
      video.removeEventListener('ended', onEnded);
      hls?.destroy();
    };
  }, [src, initialPosition]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    // Потолок перемотки растёт ТОЛЬКО при плавном воспроизведении (маленький шаг и не во время
    // seek). Иначе timeupdate с перемотанной вперёд позицией поднял бы потолок и снял запрет.
    if (!video.seeking && video.currentTime <= maxTimeRef.current + SEEK_TOLERANCE_SEC) {
      maxTimeRef.current = Math.max(maxTimeRef.current, video.currentTime);
    }

    const now = Math.floor(video.currentTime);
    if (onSavePosition && now - lastSavedRef.current >= 10) {
      lastSavedRef.current = now;
      onSavePosition(now);
    }

    if (onProgress && video.duration > 0) {
      const pct = Math.min(100, Math.round((video.currentTime / video.duration) * 100));
      if (pct !== lastPctRef.current) {
        lastPctRef.current = pct;
        onProgress(pct);
      }
    }

    if (
      !watchedSentRef.current &&
      onWatched &&
      video.duration > 0 &&
      video.currentTime / video.duration >= LESSON.WATCHED_THRESHOLD
    ) {
      watchedSentRef.current = true;
      onWatched();
    }
  }

  function changeSpeed(value: number) {
    setSpeed(value);
    if (videoRef.current) videoRef.current.playbackRate = value;
  }

  if (!src) {
    return (
      <div className="grid aspect-video w-full place-items-center rounded-token border border-line bg-gradient-to-b from-[#1a1622] to-[#0a0810] text-center">
        <div className="px-6">
          <div className="font-display text-2xl text-muted">Видео скоро появится</div>
          <div className="mt-2 text-sm text-muted-2">
            Материал урока готовится. Загляните позже.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-hidden rounded-token border border-line bg-black">
      <video
        ref={videoRef}
        controls
        playsInline
        controlsList="nodownload noplaybackrate"
        disablePictureInPicture
        onContextMenu={(e) => e.preventDefault()}
        onTimeUpdate={handleTimeUpdate}
        className="aspect-video w-full bg-black"
      />
      <div className="flex items-center gap-2 border-t border-line bg-panel px-4 py-2">
        <span className="font-label text-[11px] uppercase tracking-[2px] text-muted-2">
          Скорость
        </span>
        {SPEEDS.map((s) => (
          <button
            key={s}
            onClick={() => changeSpeed(s)}
            className={`rounded-md px-2 py-1 text-xs transition-colors ${
              speed === s ? 'bg-gold text-[#1a1206]' : 'text-muted hover:text-gold'
            }`}
          >
            {s}×
          </button>
        ))}
      </div>
    </div>
  );
}
