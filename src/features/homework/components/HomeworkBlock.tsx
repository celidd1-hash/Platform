'use client';

import { useActionState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormStatus } from 'react-dom';
import { submitHomeworkAction, type HomeworkState } from '../actions';

const initial: HomeworkState = { status: 'idle' };

function SubmitButton({ alreadyPassed }: { alreadyPassed: boolean }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-xl bg-gradient-to-r from-gold-deep to-gold px-6 py-3 font-label text-sm tracking-[2px] text-[#1a1206] transition-colors hover:to-gold-bright disabled:opacity-60"
    >
      {pending ? 'Проверяю…' : alreadyPassed ? 'Отправить снова' : 'Отправить на проверку'}
    </button>
  );
}

function Verdict({ result }: { result: NonNullable<HomeworkState['result']> }) {
  const map = {
    passed: { label: '✓ Зачтено', cls: 'border-[rgba(123,191,143,0.4)] text-ok' },
    needs_work: { label: '↻ На доработку', cls: 'border-[rgba(217,160,102,0.5)] text-[var(--warn)]' },
    pending: { label: '⏳ На проверке', cls: 'border-line text-muted' },
  }[result.verdict];

  return (
    <div className={`rounded-xl border bg-panel px-4 py-3 text-sm ${map.cls}`}>
      <div className="flex items-center justify-between font-label tracking-[1px]">
        <span>{map.label}</span>
        {result.score != null && <span className="text-gold-bright">{result.score}/100</span>}
      </div>
      {result.feedback && <p className="mt-2 text-ink/90">{result.feedback}</p>}
      {result.verdict === 'pending' && (
        <p className="mt-2 text-muted-2">
          ИИ-наставник временно недоступен — урок засчитан, проверка придёт позже.
        </p>
      )}
    </div>
  );
}

/**
 * Блок ДЗ урока (ТЗ §3.4): конспект → проверка ИИ → вердикт/балл/обратная связь.
 * При зачёте/временном зачёте обновляет страницу (откроется следующий урок).
 */
export function HomeworkBlock({
  lessonId,
  minLength,
  alreadyPassed,
}: {
  lessonId: string;
  minLength: number;
  alreadyPassed: boolean;
}) {
  const [state, action] = useActionState(submitHomeworkAction, initial);
  const router = useRouter();

  useEffect(() => {
    if (state.status === 'submitted' && state.result?.lessonCompleted) {
      router.refresh();
    }
  }, [state, router]);

  const passedNow = state.result?.verdict === 'passed';

  return (
    <section className="rounded-token border border-line bg-panel p-5">
      <div className="sectlabel mb-3">Домашнее задание</div>
      <p className="mb-3 text-sm text-muted">
        Напишите краткое содержание усвоенного — наставник проверит понимание материала.
        Минимум {minLength} символов.
      </p>

      {state.status === 'submitted' && state.result && <Verdict result={state.result} />}
      {state.status === 'error' && (
        <div className="mb-3 rounded-xl border border-[rgba(196,90,90,0.4)] bg-[rgba(196,90,90,0.06)] px-4 py-3 text-sm text-[var(--err)]">
          {state.error}
        </div>
      )}

      {!(alreadyPassed || passedNow) && (
        <form action={action} className="mt-3 flex flex-col gap-3">
          <input type="hidden" name="lessonId" value={lessonId} />
          <textarea
            name="text"
            rows={6}
            placeholder="Ваш конспект…"
            className="w-full resize-y rounded-xl border border-line bg-bg-2 px-4 py-3 text-sm text-ink outline-none transition-colors placeholder:text-muted-2 focus:border-gold"
          />
          <div className="flex justify-end">
            <SubmitButton alreadyPassed={false} />
          </div>
        </form>
      )}
    </section>
  );
}
