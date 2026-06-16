'use client';

import { useEffect, useRef, useState } from 'react';
import Hls from 'hls.js';

const SPEEDS = [0.5, 0.75, 1, 1.25, 1.5, 2] as const;

/**
 * Собственный плеер платформы (ТЗ §3.3, §5.3): native <video> + hls.js (ABR),
 * без чужого брендинга. Запоминание позиции, скорости 0.5–2×, запрет скачивания.
 * Поток приходит подписанной HLS-ссылкой с коротким TTL (signed URL генерит сервер).
 */
export function LessonPlayer({
  src,
  initialPosition = 0,
  onSavePosition,
  onWatched,
}: {
  src: string | null;
  initialPosition?: number;
  /** Сохранить позицию (сек). Дросселируется — вызывается не чаще раза в 10 с. */
  onSavePosition?: (seconds: number) => void;
  /** Видео просмотрено (≥90%). */
  onWatched?: () => void;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const lastSavedRef = useRef(0);
  const watchedSentRef = useRef(false);
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
    } else {
      video.src = src;
    }

    const onLoaded = () => {
      if (initialPosition > 0 && initialPosition < video.duration) {
        video.currentTime = initialPosition;
      }
    };
    video.addEventListener('loadedmetadata', onLoaded);

    return () => {
      video.removeEventListener('loadedmetadata', onLoaded);
      hls?.destroy();
    };
  }, [src, initialPosition]);

  function handleTimeUpdate() {
    const video = videoRef.current;
    if (!video) return;

    const now = Math.floor(video.currentTime);
    if (onSavePosition && now - lastSavedRef.current >= 10) {
      lastSavedRef.current = now;
      onSavePosition(now);
    }

    if (
      !watchedSentRef.current &&
      onWatched &&
      video.duration > 0 &&
      video.currentTime / video.duration >= 0.9
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
