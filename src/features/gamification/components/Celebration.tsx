'use client';

import { useEffect, useState } from 'react';
import type { LessonCompletionReward } from '../service';

/**
 * Плашка-поздравление при зачёте урока / открытии достижения (ТЗ §3.5) + салют конфетти.
 * Слушает кастомное событие, чтобы любой клиентский поток (видео/ДЗ) мог её показать,
 * пережив router.refresh(). Конфетти — лёгкий self-contained canvas без зависимостей.
 */

const EVENT = 'svetozar:celebrate';
const VISIBLE_MS = 7000;

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
    <div
      onClick={() => setData(null)}
      className="cl-backdrop fixed inset-0 z-[200] flex items-center justify-center bg-black/60 px-4 backdrop-blur-md"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="cl-card relative w-full max-w-lg overflow-hidden rounded-[28px] border border-gold/60 bg-gradient-to-b from-panel to-bg-2 px-8 py-10 text-center shadow-[0_0_80px_rgba(200,160,79,0.35)]"
      >
        {/* Золотое свечение за плашкой */}
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 -translate-y-1/3 rounded-full bg-[radial-gradient(circle,rgba(200,160,79,0.35),transparent_70%)]"
          aria-hidden
        />

        <button
          onClick={() => setData(null)}
          className="absolute right-4 top-4 text-xl text-muted-2 transition-colors hover:text-ink"
          aria-label="Закрыть"
        >
          ✕
        </button>

        <div className="cl-pop relative">
          <div className="cl-bounce mx-auto mb-3 text-6xl">🎉</div>
          <h2 className="font-display text-4xl font-semibold text-gold-bright">Поздравляем!</h2>

          {data.xpAwarded > 0 && (
            <>
              <p className="mt-2 text-base text-muted">Урок пройден</p>
              <div className="mt-3 font-display text-6xl font-bold text-gold-bright drop-shadow-[0_2px_20px_rgba(200,160,79,0.5)]">
                +{data.xpAwarded} XP
              </div>
            </>
          )}

          {data.achievements.length > 0 && (
            <div className="mt-6 flex flex-col gap-2">
              {data.achievements.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 rounded-xl border border-gold/40 bg-bg-2/80 px-4 py-3 text-left"
                >
                  <span className="text-2xl">{a.icon ?? '🏆'}</span>
                  <span className="text-sm text-ink">
                    Новое достижение
                    <span className="block font-semibold text-gold-bright">{a.title}</span>
                  </span>
                  {a.xp > 0 && (
                    <span className="ml-auto flex-none font-semibold text-gold-bright">+{a.xp} XP</span>
                  )}
                </div>
              ))}
            </div>
          )}

          <p className="mt-6 text-sm text-muted-2">Так держать — продолжай Путь Мастера ✨</p>
        </div>
      </div>

      <style>{`
        @keyframes clFade { from { opacity:0 } to { opacity:1 } }
        .cl-backdrop { animation: clFade 0.25s ease-out; }
        @keyframes clPop { 0% { transform:scale(0.8); opacity:0 } 60% { transform:scale(1.04) } 100% { transform:scale(1); opacity:1 } }
        .cl-card { animation: clPop 0.45s cubic-bezier(0.18,0.89,0.32,1.28); }
        @keyframes clBounce { 0%,100% { transform:translateY(0) } 50% { transform:translateY(-10px) } }
        .cl-bounce { animation: clBounce 1.6s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

/** Лёгкий салют конфетти на canvas поверх страницы — без внешних зависимостей. */
function fireConfetti(): void {
  if (typeof document === 'undefined') return;
  const canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;pointer-events:none;z-index:210';
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
