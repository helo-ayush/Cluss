import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

/**
 * Shared Markdown Renderer for FocusForge.
 * Ensures consistent styling for AI-generated content across questions, feedback, and tutor chat.
 */
export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  return (
    <div className={`markdown-renderer ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed translate-y-px" style={{ color: 'var(--theme-text-body-strong)' }} {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-indigo-600 dark:text-indigo-300" {...props} />,
          em: ({ node, ...props }) => <em className="italic opacity-90" {...props} />,
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded text-[0.85em] font-mono bg-indigo-500/10 text-indigo-600 dark:text-indigo-300 border border-indigo-500/15" {...props} />
            ) : (
              <pre className="p-3.5 my-2.5 rounded-xl text-[0.825em] font-mono overflow-x-auto border border-black/5 dark:border-white/5 custom-scroll leading-relaxed"
                style={{ 
                  background: 'var(--theme-surface-container-high)',
                  backdropFilter: 'blur(8px)',
                  color: 'var(--theme-text-body-strong)'
                }}>
                <code {...props} />
              </pre>
            ),
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1.5" style={{ color: 'var(--theme-text-body)' }} {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1.5" style={{ color: 'var(--theme-text-body)' }} {...props} />,
          li: ({ node, ...props }) => <li className="pl-1 text-[0.95em]" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0" style={{ color: 'var(--theme-text-heading)' }} {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0 opacity-90" style={{ color: 'var(--theme-text-heading)' }} {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0 opacity-80" style={{ color: 'var(--theme-text-heading)' }} {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-1 my-3 bg-black/5 dark:bg-white/5 rounded-r-lg italic text-[0.95em]" style={{ color: 'var(--theme-text-body)' }} {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-black/5 dark:border-white/10">
              <table className="w-full text-sm text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="px-4 py-2 bg-black/5 dark:bg-white/5 font-bold border-b border-black/5 dark:border-white/10" style={{ color: 'var(--theme-text-heading)' }} {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-2 border-b border-black/5 dark:border-white/5" style={{ color: 'var(--theme-text-body)' }} {...props} />,
          hr: ({ node, ...props }) => <hr className="my-6 border-black/5 dark:border-white/10" {...props} />,
          a: ({ node, ...props }) => (
            <a className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors underline underline-offset-4 decoration-indigo-500/30" 
               target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
