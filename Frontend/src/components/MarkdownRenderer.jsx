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
          p: ({ node, ...props }) => <p className="mb-2 last:mb-0 leading-relaxed translate-y-px" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-indigo-300/90" {...props} />,
          em: ({ node, ...props }) => <em className="italic opacity-90" {...props} />,
          code: ({ node, inline, ...props }) =>
            inline ? (
              <code className="px-1.5 py-0.5 rounded text-[0.85em] font-mono bg-indigo-500/10 text-indigo-300 border border-indigo-500/15" {...props} />
            ) : (
              <pre className="p-5 my-4 rounded-2xl text-[0.85em] font-mono overflow-x-auto text-indigo-100 border border-white/5 custom-scroll shadow-2xl leading-relaxed"
                style={{ 
                  background: 'linear-gradient(165deg, rgba(15,18,30,0.85) 0%, rgba(5,6,10,0.95) 100%)',
                  backdropFilter: 'blur(10px)',
                  borderLeft: '4px solid rgba(99,102,241,0.5)'
                }}>
                <code {...props} />
              </pre>
            ),
          ul: ({ node, ...props }) => <ul className="list-disc pl-5 mb-3 last:mb-0 space-y-1.5" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-5 mb-3 last:mb-0 space-y-1.5" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1 text-[0.95em]" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold mb-3 mt-4 first:mt-0 text-white" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold mb-2 mt-4 first:mt-0 text-white/90" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-base font-bold mb-2 mt-3 first:mt-0 text-white/80" {...props} />,
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-indigo-500/50 pl-4 py-1 my-3 bg-white/5 rounded-r-lg italic text-[0.95em]" {...props} />
          ),
          table: ({ node, ...props }) => (
            <div className="overflow-x-auto my-4 rounded-xl border border-white/10">
              <table className="w-full text-sm text-left border-collapse" {...props} />
            </div>
          ),
          th: ({ node, ...props }) => <th className="px-4 py-2 bg-white/5 font-bold border-b border-white/10" {...props} />,
          td: ({ node, ...props }) => <td className="px-4 py-2 border-b border-white/5" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-6 border-white/10" {...props} />,
          a: ({ node, ...props }) => (
            <a className="text-indigo-400 hover:text-indigo-300 underline underline-offset-4 decoration-indigo-500/30 transition-colors" 
               target="_blank" rel="noopener noreferrer" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
