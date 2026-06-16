import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Безопасный рендер markdown (ТЗ §6А.6): react-markdown по умолчанию НЕ вставляет
 * сырой HTML (rehype-raw не подключён) — пользовательский ввод экранируется, XSS закрыт.
 * «Глупый» UI-компонент в фирменной типографике.
 */
export function Markdown({ children }: { children: string }) {
  return (
    <div className="prose-tokens flex flex-col gap-3 text-sm leading-relaxed text-ink">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: (props) => <h1 className="font-display text-2xl font-semibold text-ink" {...props} />,
          h2: (props) => <h2 className="mt-2 font-display text-xl font-semibold text-ink" {...props} />,
          h3: (props) => <h3 className="mt-2 font-label text-base tracking-[1px] text-gold" {...props} />,
          p: (props) => <p className="text-ink/90" {...props} />,
          ul: (props) => <ul className="list-disc pl-5 text-ink/90" {...props} />,
          ol: (props) => <ol className="list-decimal pl-5 text-ink/90" {...props} />,
          a: (props) => <a className="text-gold underline hover:text-gold-bright" {...props} />,
          strong: (props) => <strong className="text-gold-bright" {...props} />,
          code: (props) => <code className="rounded bg-bg-2 px-1.5 py-0.5 text-xs text-gold-bright" {...props} />,
        }}
      >
        {children}
      </ReactMarkdown>
    </div>
  );
}
