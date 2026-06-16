import { BrandMark } from '@/components/ui/BrandMark';

/** Оболочка auth-зоны: фоновые свечения + центрированная карточка (ТЗ §8). */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg p-6">
      <div className="glow glow-a" aria-hidden />
      <div className="glow glow-b" aria-hidden />
      <div className="relative z-10 w-full max-w-md">
        <div className="mb-7 flex flex-col items-center gap-3 text-center">
          <BrandMark size={64} />
          <div className="font-label">
            <div className="text-xl tracking-[4px] text-gold-bright">SVETOZAR SCHOOL</div>
            <div className="mt-1 text-[10px] tracking-[4px] text-muted-2">ПУТЬ МАСТЕРА</div>
          </div>
        </div>
        <div className="rounded-token border border-line bg-gradient-to-b from-panel-2 to-panel p-7 shadow-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
