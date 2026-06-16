'use client';

import { useFormStatus } from 'react-dom';
import { cn } from '@/lib/utils';

/** Текстовое поле формы с подписью и ошибкой. «Глупый» UI auth-фичи. */
export function Field({
  label,
  name,
  type = 'text',
  autoComplete,
  error,
  defaultValue,
}: {
  label: string;
  name: string;
  type?: string;
  autoComplete?: string;
  error?: string;
  defaultValue?: string;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block font-label text-[11px] uppercase tracking-[2px] text-muted">
        {label}
      </span>
      <input
        name={name}
        type={type}
        autoComplete={autoComplete}
        defaultValue={defaultValue}
        className={cn(
          'w-full rounded-xl border bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none transition-colors',
          'placeholder:text-muted-2 focus:border-gold',
          error ? 'border-[var(--err)]' : 'border-line',
        )}
      />
      {error && <span className="mt-1 block text-xs text-[var(--err)]">{error}</span>}
    </label>
  );
}

/** Кнопка отправки с индикатором ожидания (useFormStatus). */
export function SubmitButton({ children }: { children: React.ReactNode }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className={cn(
        'w-full rounded-xl bg-gradient-to-r from-gold-deep to-gold py-3 font-label text-sm tracking-[2px] text-[#1a1206]',
        'transition-colors hover:to-gold-bright disabled:cursor-not-allowed disabled:opacity-60',
      )}
    >
      {pending ? 'Подождите…' : children}
    </button>
  );
}

/** Сообщение об успехе/ошибке формы. */
export function FormMessage({ status, message }: { status: string; message?: string }) {
  if (!message) return null;
  return (
    <div
      className={cn(
        'rounded-xl border px-4 py-3 text-sm',
        status === 'success'
          ? 'border-[rgba(123,191,143,0.4)] bg-[rgba(123,191,143,0.06)] text-ok'
          : 'border-[rgba(196,90,90,0.4)] bg-[rgba(196,90,90,0.06)] text-[var(--err)]',
      )}
    >
      {message}
    </div>
  );
}
