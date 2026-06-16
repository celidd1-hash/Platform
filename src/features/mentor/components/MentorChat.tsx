'use client';

import { useState, useRef, useEffect, useTransition } from 'react';
import { sendMentorMessageAction } from '../actions';
import type { ChatMessage } from '@/lib/providers/ai';

/** Чат с ИИ-наставником (ТЗ §3). История в состоянии клиента, ответы — через server action. */
export function MentorChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { role: 'assistant', content: 'Здравствуйте! Я ваш AI-Наставник. Спросите что угодно по материалам курса.' },
  ]);
  const [input, setInput] = useState('');
  const [pending, start] = useTransition();
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, pending]);

  function send() {
    const text = input.trim();
    if (!text || pending) return;
    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setInput('');
    start(async () => {
      const res = await sendMentorMessageAction(next);
      const reply = res.ok ? res.data : res.error;
      setMessages((m) => [...m, { role: 'assistant', content: reply }]);
    });
  }

  return (
    <div className="flex h-[70vh] flex-col rounded-token border border-line bg-panel">
      <div ref={bodyRef} className="flex-1 space-y-4 overflow-y-auto p-5">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] whitespace-pre-wrap rounded-2xl px-4 py-2.5 text-sm ${
                m.role === 'user'
                  ? 'bg-gradient-to-r from-gold-deep to-gold text-[#1a1206]'
                  : 'border border-line bg-bg-2 text-ink'
              }`}
            >
              {m.content}
            </div>
          </div>
        ))}
        {pending && (
          <div className="flex justify-start">
            <div className="rounded-2xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-muted-2">
              Наставник печатает…
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-2 border-t border-line p-3">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && send()}
          placeholder="Ваш вопрос…"
          className="flex-1 rounded-xl border border-line bg-bg-2 px-4 py-2.5 text-sm text-ink outline-none focus:border-gold"
        />
        <button
          onClick={send}
          disabled={pending || !input.trim()}
          className="rounded-xl bg-gradient-to-r from-gold-deep to-gold px-5 py-2.5 font-label text-sm tracking-[1px] text-[#1a1206] hover:to-gold-bright disabled:opacity-50"
        >
          Отправить
        </button>
      </div>
    </div>
  );
}
