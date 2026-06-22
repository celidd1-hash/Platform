'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import type { HomeworkReviewItem } from '../homework-review';
import { gradeHomeworkAction, trashHomeworkAction } from '../homework-actions';

const VERDICT_LABEL: Record<string, string> = {
  passed: 'зачтено',
  needs_work: 'на доработку',
  pending: 'на проверке',
};

/**
 * Карточка ДЗ для проверки куратором (ТЗ §3.7): ответ ученика + ручная оценка с комментарием.
 * «Зачтено» / «На доработку» ставят вердикт и шлют ученику оповещение; «В корзину» — мягкое удаление.
 */
export function HomeworkReviewCard({ item }: { item: HomeworkReviewItem }) {
  const [comment, setComment] = useState(item.feedback ?? '');
  const [pending, start] = useTransition();

  return (
    <div className="rounded-token border border-line bg-panel p-5">
      <div className="flex items-center justify-between gap-3">
        <div className="text-sm">
          <Link href={`/admin/students/${item.studentId}`} className="text-gold hover:underline">
            {item.studentName}
          </Link>
          <span className="ml-2 text-muted-2">{item.course} · {item.lesson}</span>
        </div>
        <span className="flex-none text-sm text-muted-2">
          {VERDICT_LABEL[item.verdict ?? ''] ?? '—'}
          {item.score != null && <span className="ml-2 text-gold-bright">{item.score}/100</span>}
        </span>
      </div>

      <p className="mt-2 whitespace-pre-wrap [overflow-wrap:anywhere] text-sm text-ink/90">{item.text}</p>

      {item.trashed ? (
        <p className="mt-3 text-xs text-muted-2">🗑 В корзине</p>
      ) : (
        <div className="mt-4 border-t border-line pt-4">
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={2}
            placeholder="Комментарий ментора (необязательно) — придёт ученику вместе с вердиктом"
            className="w-full rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
          />
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              onClick={() => start(() => void gradeHomeworkAction(item.id, 'passed', comment))}
              disabled={pending}
              className="rounded-lg border border-ok/40 px-4 py-1.5 font-label text-xs tracking-[1px] text-ok transition-colors hover:bg-[rgba(123,191,143,0.08)] disabled:opacity-50"
            >
              Зачтено
            </button>
            <button
              onClick={() => start(() => void gradeHomeworkAction(item.id, 'needs_work', comment))}
              disabled={pending}
              className="rounded-lg border border-[rgba(217,160,102,0.5)] px-4 py-1.5 font-label text-xs tracking-[1px] text-[var(--warn)] transition-colors hover:bg-[rgba(217,160,102,0.08)] disabled:opacity-50"
            >
              На доработку
            </button>
            <button
              onClick={() => start(() => void trashHomeworkAction(item.id))}
              disabled={pending}
              className="rounded-lg border border-[rgba(196,90,90,0.4)] px-4 py-1.5 font-label text-xs tracking-[1px] text-[var(--err)] transition-colors hover:bg-[rgba(196,90,90,0.08)] disabled:opacity-50"
            >
              В корзину
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
