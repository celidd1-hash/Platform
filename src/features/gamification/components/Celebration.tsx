'use client';

import { useEffect, useState } from 'react';
import type { LessonCompletionReward } from '../service';

/**
 * Плашка-поздравление при зачёте урока / открытии достижения (ТЗ §3.5) + салют конфетти.
 * Слушает кастомное событие, чтобы любой клиентский поток (видео/ДЗ) мог её показать,
 * пережив router.refresh(). Конфетти — лёгкий self-contained canvas без зависимостей.
 */

const EVENT = 'svetozar:celebrate';
const VISIBLE_MS = 6000;

export function celebrate(detail: LessonCompletionReward): void {
  if (typeof window === 'undefined') return;
  // Показываем только если есть что праздновать (XP за урок или новое достижение).
  if (detail.xpAwarded <= 0 && detail.achievements.length === 0) return;
  window.dispatchEvent(new CustomEvent<LessonCompletionReward>(EVENT, { detail }));
}

export function Celebration() {
  const [data, setData] = useState<LessonCompletionReward | null>(null);

  useEffect(() => {
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    function onCelebrate(e: Event) {
      const detail = (e as CustomEvent<LessonCompletionReward>).detail;
      setData(detail);
      fireConfetti();
      if (hideTimer) clearTimeout(hideTimer);
      hideTimer = setTimeout(() => setData(null), VISIBLE_MS);
    }
    window.addEventListener(EVENT, onCelebrate);
    return () => {
      window.removeEventListener(EVENT, onCelebrate);
      if (hideTimer) clearTimeout(hideTimer);
    };
  }, []);

  if (!data) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-6 z-[120] flex justify-center px-4">
      <div className="pointer-events-auto w-full max-w-sm rounded-token border border-gold/50 bg-panel/95 p-5 shadow-[0_8px_40px_rgba(0,0,0,0.5)] backdrop-blur">
        <div className="flex items-start justify-between gap-3">
          <div className="font-display text-lg font-semibold text-gold-bright">🎉 Поздравляем!</div>
          <button
            onClick={() => setData(null)}
            className="text-muted-2 transition-colors hover:text-ink"
            aria-label="Закрыть"
          >
            ✕
          </button>
        </div>

        {data.xpAwarded > 0 && (
          <div className="mt-2 text-sm text-ink">
            Урок пройден — <span className="font-semibold text-gold-bright">+{data.xpAwarded} XP</span>
          </div>
        )}

        {data.achievements.length > 0 && (
          <div className="mt-3 flex flex-col gap-2">
            {data.achievements.map((a, i) => (
              <div
                key={i}
                className="flex items-center gap-2 rounded-lg border border-gold/30 bg-bg-2 px-3 py-2 text-sm"
              >
                <span className="text-base">{a.icon ?? '🏆'}</span>
                <span className="text-ink">Достижение: {a.title}</span>
                {a.xp > 0 && <span className="ml-auto text-gold-bright">+{a.xp} XP</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

/** Лёгкий салют конфетти на canvas поверх страницы — без внешних зависимостей. */
function fireConfetti(): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:130';
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    canvas.remove();
    return;
  }

  const colors = ['#c8a04f', '#e6c875', '#7bbf8f', '#d9a066', '#f0d999'];
  const parts = Array.from({ length: 130 }, () => ({
    x: canvas.width / 2,
    y: canvas.height / 3,
    vx: (Math.random() - 0.5) * 14,
    vy: Math.random() * -13 - 3,
    size: Math.random() * 6 + 4,
    color: colors[Math.floor(Math.random() * colors.length)] ?? '#c8a04f',
    rot: Math.random() * Math.PI,
    vr: (Math.random() - 0.5) * 0.3,
  }));

  const gravity = 0.32;
  const start = Date.now();
  function frame() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (const p of parts) {
      p.vy += gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      ctx.save();
      ctx.translate(p.x, p.y);
      ctx.rotate(p.rot);
      ctx.fillStyle = p.color;
      ctx.fillRect(-p.size / 2, -p.size / 2, p.size, p.size);
      ctx.restore();
    }
    if (Date.now() - start < 2500) {
      requestAnimationFrame(frame);
    } else {
      canvas.remove();
    }
  }
  requestAnimationFrame(frame);
}
