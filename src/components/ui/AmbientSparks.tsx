import type { CSSProperties } from 'react';

/**
 * Фоновые золотистые искры по бокам экрана: плавный дрейф + мерцание (готический тон).
 * Чисто CSS-анимация, без клиентского JS. Позиции детерминированы (seeded), чтобы
 * разметка совпадала на сервере и клиенте (без hydration mismatch).
 */

// Детерминированный псевдослучайный генератор (LCG), seed по индексу искры.
function rand(seed: number): () => number {
  let s = (seed * 9301 + 49297) % 233280;
  return () => {
    s = (s * 9301 + 49297) % 233280;
    return s / 233280;
  };
}

interface Spark {
  style: CSSProperties;
}

function buildSparks(count: number, side: 'left' | 'right'): Spark[] {
  return Array.from({ length: count }, (_, i) => {
    const r = rand(i + (side === 'left' ? 1 : 500));
    // Левая полоса 1–20% ширины, правая 80–99% — центр (контент) остаётся чистым.
    const base = side === 'left' ? 1 : 80;
    const left = base + r() * 19;
    const top = 2 + r() * 96;
    const size = 1.4 + r() * 2.4;
    const dur = 10 + r() * 10; // 10–20с дрейф
    const tw = 2.5 + r() * 2.8; // 2.5–5.3с мерцание
    const delay = r() * 9;
    const dx = (r() * 2 - 1) * 22; // ±22px по горизонтали
    const dy = -(14 + r() * 36); // вверх 14–50px
    const peak = 0.55 + r() * 0.4;

    return {
      style: {
        left: `${left}%`,
        top: `${top}%`,
        width: `${size}px`,
        height: `${size}px`,
        '--dur': `${dur}s`,
        '--tw': `${tw}s`,
        '--delay': `${delay}s`,
        '--dx': `${dx}px`,
        '--dy': `${dy}px`,
        '--peak': peak,
      } as CSSProperties,
    };
  });
}

const SPARKS = [...buildSparks(26, 'left'), ...buildSparks(26, 'right')];

export function AmbientSparks() {
  return (
    <div className="sparks" aria-hidden>
      {SPARKS.map((s, i) => (
        <span key={i} className="spark" style={s.style} />
      ))}
    </div>
  );
}
