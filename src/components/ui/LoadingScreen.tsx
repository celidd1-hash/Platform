import { BrandMark } from './BrandMark';

/**
 * Брендированный экран загрузки (ТЗ §8): показывается через app/loading.tsx, пока
 * грузится страница при переходе между вкладками. Анимация — чистый CSS, без зависимостей.
 */
export function LoadingScreen({ label = 'Загрузка…' }: { label?: string }) {
  return (
    <div className="fixed inset-0 z-[200] flex flex-col items-center justify-center bg-bg">
      <div className="relative mb-8 grid place-items-center">
        <div className="ld-pulse absolute h-44 w-44 rounded-full bg-[radial-gradient(circle,rgba(200,160,79,0.18),transparent_70%)]" />
        <div className="ld-float">
          <BrandMark size={76} />
        </div>
      </div>

      {/* Звуковые «волны» */}
      <div className="mb-6 flex h-8 items-end gap-1.5">
        {Array.from({ length: 7 }).map((_, i) => (
          <span
            key={i}
            className="ld-bar w-1.5 rounded-full bg-gold-bright"
            style={{ animationDelay: `${i * 0.12}s` }}
          />
        ))}
      </div>

      {/* Бегущая полоса (неопределённый прогресс) */}
      <div className="h-1.5 w-64 overflow-hidden rounded-full bg-bg-2">
        <div className="ld-progress h-full w-1/3 rounded-full bg-gradient-to-r from-gold-deep to-gold-bright" />
      </div>

      <div className="mt-4 font-label text-[11px] uppercase tracking-[3px] text-muted-2">{label}</div>
      <div className="mt-1 font-display text-sm italic text-muted">Путь Мастера</div>

      <style>{`
        @keyframes ldBar { 0%,100%{ transform:scaleY(0.35) } 50%{ transform:scaleY(1) } }
        .ld-bar { height:100%; transform-origin:bottom; animation:ldBar 1s ease-in-out infinite; }
        @keyframes ldProgress { 0%{ transform:translateX(-120%) } 100%{ transform:translateX(330%) } }
        .ld-progress { animation:ldProgress 1.1s ease-in-out infinite; }
        @keyframes ldPulse { 0%,100%{ opacity:0.45; transform:scale(0.92) } 50%{ opacity:1; transform:scale(1.08) } }
        .ld-pulse { animation:ldPulse 2.4s ease-in-out infinite; }
        @keyframes ldFloat { 0%,100%{ transform:translateY(0) } 50%{ transform:translateY(-6px) } }
        .ld-float { animation:ldFloat 3s ease-in-out infinite; }
      `}</style>
    </div>
  );
}
