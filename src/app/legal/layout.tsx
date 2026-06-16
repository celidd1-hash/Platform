import Link from 'next/link';
import { BrandMark } from '@/components/ui/BrandMark';

/** Каркас правовых страниц: публичный, читаемая колонка (ТЗ §6А.11). */
export default function LegalLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-bg">
      <div className="glow glow-a" aria-hidden />
      <div className="mx-auto max-w-2xl px-6 py-12">
        <Link href="/" className="mb-8 flex items-center gap-3">
          <BrandMark size={40} />
          <span className="font-label tracking-[3px] text-gold-bright">SVETOZAR SCHOOL</span>
        </Link>
        <article className="prose-tokens flex flex-col gap-4 text-sm leading-relaxed text-ink/90">
          {children}
        </article>
        <Link href="/" className="mt-10 inline-block text-xs text-muted-2 hover:text-gold">
          ← На главную
        </Link>
      </div>
    </div>
  );
}
