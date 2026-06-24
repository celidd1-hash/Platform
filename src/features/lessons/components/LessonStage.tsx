'use client';

import { useState, type ReactNode } from 'react';
import { LESSON } from '@/config/constants';
import { LessonVideo } from './LessonVideo';
import { LessonFiles } from './LessonFiles';

type LessonFile = { id: string; title: string; fileType: string; sizeBytes: number };

const THRESHOLD_PCT = Math.round(LESSON.WATCHED_THRESHOLD * 100);

/**
 * Сцена урока (ТЗ §3.3): слева плеер + ДЗ/навигация (children), справа сайдбар —
 * длительность и % просмотра (живьём из видео), материалы (если есть) и ИИ-наставник.
 * Длительность/прогресс приходят из плеера, поэтому колонка-сайдбар держит общее состояние.
 */
export function LessonStage({
  lessonId,
  src,
  initialPosition,
  completed,
  files,
  materialsUrl,
  filesUnlocked,
  lockHint,
  children,
}: {
  lessonId: string;
  src: string | null;
  initialPosition: number;
  completed: boolean;
  files: LessonFile[];
  materialsUrl: string | null;
  filesUnlocked: boolean;
  lockHint: string;
  children?: ReactNode;
}) {
  const [durationSec, setDurationSec] = useState<number | null>(null);
  const [watchedPct, setWatchedPct] = useState(completed ? 100 : 0);

  const durationLabel = durationSec ? `${Math.max(1, Math.round(durationSec / 60))} мин` : '—';
  const hasMaterials = files.length > 0 || Boolean(materialsUrl);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="flex min-w-0 flex-col gap-6">
        <LessonVideo
          lessonId={lessonId}
          src={src}
          initialPosition={initialPosition}
          onMeta={(d) => setDurationSec(d)}
          onProgress={(p) => setWatchedPct((prev) => Math.max(prev, p))}
        />
        {children}
      </div>

      <aside className="flex flex-col gap-4 self-start lg:sticky lg:top-6">
        {/* Длительность + просмотрено видео */}
        <div className="rounded-token border border-line bg-panel p-4">
          <div className="flex items-center gap-3">
            <span className="grid size-9 flex-none place-items-center rounded-full bg-[rgba(200,160,79,0.12)] text-gold-bright">
              ▶
            </span>
            <div>
              <div className="font-label text-[11px] uppercase tracking-[1px] text-muted-2">
                Длительность
              </div>
              <div className="text-lg font-semibold text-ink">{durationLabel}</div>
            </div>
          </div>

          <div className="mt-4 border-t border-line pt-3">
            <div className="flex items-center justify-between text-xs">
              <span className="text-muted">Просмотрено видео</span>
              <span className="text-gold-bright">{watchedPct}%</span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-bg-2">
              <div
                className="h-full bg-gradient-to-r from-gold-deep to-gold-bright transition-[width] duration-300"
                style={{ width: `${watchedPct}%` }}
              />
            </div>
            <div className="mt-2 text-[11px] text-muted-2">
              {watchedPct >= THRESHOLD_PCT
                ? '✓ Урок засчитан по просмотру'
                : `Просмотрите ${THRESHOLD_PCT}% видео, чтобы открыть следующий урок`}
            </div>
          </div>
        </div>

        {/* Материалы урока — показываем ученику только если они есть */}
        {hasMaterials && (
          <div className="rounded-token border border-line p-4">
            <LessonFiles
              lessonId={lessonId}
              files={files}
              materialsUrl={materialsUrl}
              unlocked={filesUnlocked}
              lockHint={lockHint}
            />
          </div>
        )}
      </aside>
    </div>
  );
}
