import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import { Check, Copy } from 'lucide-react';
import 'katex/dist/katex.min.css';

// Initialize mermaid
mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  flowchart: {
    useMaxWidth: true,
    htmlLabels: true,
    padding: 20
  },
  themeVariables: {
    fontFamily: '"Outfit", "Inter", ui-sans-serif, system-ui, -apple-system, sans-serif',
    primaryColor: '#171717',
    primaryBorderColor: '#333333',
    primaryTextColor: '#ffffff',
    lineColor: '#666666',
    secondaryColor: '#202020',
    tertiaryColor: '#2a2a2a'
  },
  securityLevel: 'loose',
});

function MermaidBlock({ code }) {
  const [svg, setSvg] = useState('');
  const [error, setError] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    let isMounted = true;
    const renderDiagram = async () => {
      try {
        let safeCode = code;

        // 0. Convert mindmap → flowchart (mindmap syntax is extremely fragile)
        if (/^\s*mindmap\b/i.test(safeCode)) {
          const lines = safeCode.split('\n').filter(l => l.trim());
          const nodes = [];
          const edges = [];
          let nodeId = 0;
          const depthMap = {};

          for (let i = 1; i < lines.length; i++) {
            const line = lines[i];
            const stripped = line.replace(/^\s+/, '');
            const indent = line.length - line.trimStart().length;
            // Rough depth: every 2-space indent is one level
            const depth = Math.floor(indent / 2);
            const label = stripped.replace(/^[-*]\s*/, '').trim();
            if (!label) continue;

            const id = `N${nodeId++}`;
            nodes.push({ id, label, depth });
            depthMap[depth] = id;

            // Connect to closest parent at a shallower depth
            for (let d = depth - 1; d >= 0; d--) {
              if (depthMap[d]) {
                edges.push(`${depthMap[d]} --> ${id}`);
                break;
              }
            }
          }

          if (nodes.length > 0) {
            const nodeDefs = nodes.map(n => `${n.id}["${n.label.replace(/"/g, "'")}"]`).join('\n');
            const edgeDefs = edges.join('\n');
            safeCode = `graph TD\n${nodeDefs}\n${edgeDefs}`;
          }
        }

        // 1. Strip HTML tags like <br/>, <b>, <i> etc. — Mermaid cannot parse them
        safeCode = safeCode.replace(/<br\s*\/?>/gi, ' ');
        safeCode = safeCode.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');

        // 2. Normalize excessive whitespace left behind by tag stripping
        safeCode = safeCode.replace(/[ \t]{2,}/g, ' ');

        // 3. Fix spaces inside shape delimiters: { "text" } → {"text"}, (( "text" )) → (("text"))
        safeCode = safeCode.replace(/\{\s+"([^"]*?)"\s+\}/g, '{"$1"}');
        safeCode = safeCode.replace(/\(\(\s+"([^"]*?)"\s+\)\)/g, '(("$1"))');
        safeCode = safeCode.replace(/\(\s+"([^"]*?)"\s+\)/g, '("$1")');
        safeCode = safeCode.replace(/\[\s+"([^"]*?)"\s+\]/g, '["$1"]');

        // 4. Force-quote unquoted bracket [...] labels with special chars.
        safeCode = safeCode.replace(/\[([^\]]+)\]/g, (match, inner) => {
          if (inner.startsWith('"') || inner.startsWith("'")) return match;
          if (/[(){}=<>,;|]/.test(inner)) return `["${inner.trim()}"]`;
          return match;
        });

        // 5. Force-quote unquoted diamond {...} labels with special chars (but skip subgraph/class braces)
        safeCode = safeCode.replace(/(\w)\{([^}]+)\}/g, (match, prefix, inner) => {
          if (inner.startsWith('"') || inner.startsWith("'")) return match;
          if (/[()=<>,;|[\]]/.test(inner)) return `${prefix}{"${inner.trim()}"}`;
          return match;
        });

        // 6. Fix sequenceDiagram participants with hyphens (e.g., create-next-app)
        if (/^\s*sequenceDiagram\b/i.test(safeCode)) {
          // Wrap declarations: participant create-next-app → participant "create-next-app"
          safeCode = safeCode.replace(/(participant|actor)\s+([a-zA-Z0-9_\-\.]+)/gi, (match, type, name) => {
            if (name.startsWith('"')) return match;
            return `${type} "${name}"`;
          });
          
          // Wrap arrows: A-B ->> C-D → "A-B" ->> "C-D"
          safeCode = safeCode.replace(/([a-zA-Z0-9_\-\.]+)\s*(->+|-->>?)\s*([a-zA-Z0-9_\-\.]+)/g, (match, p1, arrow, p2) => {
            const quote = (p) => {
              if (p.startsWith('"')) return p;
              if (p.includes('-') || p.includes('.')) return `"${p}"`;
              return p;
            };
            return `${quote(p1)} ${arrow} ${quote(p2)}`;
          });
        }

        const id = `mermaid-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: svgOutput } = await mermaid.render(id, safeCode);
        if (isMounted) {
          setSvg(svgOutput);
          setError(false);
        }
      } catch (err) {
        console.error('Mermaid rendering failed:', err);
        if (isMounted) setError(true);
      }
    };
    if (code) renderDiagram();
    return () => { isMounted = false; };
  }, [code]);

  if (error) {
    return (
      <div className="my-6 rounded-2xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
        <p className="font-bold">Failed to render diagram.</p>
        <pre className="mt-2 overflow-x-auto text-[11px] opacity-70">{code}</pre>
      </div>
    );
  }

  return (
    <div className="my-6 flex justify-center overflow-x-auto rounded-2xl border border-white/10 bg-[#0a0a0a] p-6 shadow-sm">
      {svg ? (
        <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} className="w-full max-w-3xl flex justify-center [&_svg]:!max-w-full" />
      ) : (
        <div className="h-32 flex w-full items-center justify-center text-sm text-zinc-500">Loading diagram...</div>
      )}
    </div>
  );
}

function CodeBlock({ className = '', children, ...props }) {
  const [copied, setCopied] = useState(false);
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'code';
  const code = String(children || '').replace(/\n$/, '');

  if (language === 'mermaid') {
    return <MermaidBlock code={code} />;
  }

  const copyCode = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1300);
    } catch (error) {
      setCopied(false);
    }
  };

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-white/10 bg-[#0d0e10] shadow-[0_10px_40px_rgba(0,0,0,0.5)]">
      <div className="flex items-center justify-between border-b border-white/5 bg-white/[0.02] px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">{language}</span>
        <button
          type="button"
          onClick={copyCode}
          className="inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1.5 text-xs font-semibold text-zinc-300 transition hover:bg-white/15 hover:text-white"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-[#A3FF4F]" /> : <Copy className="h-3.5 w-3.5" />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <pre className="custom-scroll max-w-full overflow-x-auto p-4 text-[13.5px] leading-7 text-zinc-300">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const components = React.useMemo(() => ({
          p: ({ node, ...props }) => <p className="mb-4 leading-[1.8] text-zinc-300 last:mb-0" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-black text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-zinc-400" {...props} />,
          pre: ({ children, ...props }) => {
            if (React.isValidElement(children) && children.props.node?.tagName === 'code') {
              return <CodeBlock className={children.props.className}>{children.props.children}</CodeBlock>;
            }
            return <pre {...props}>{children}</pre>;
          },
          code: ({ node, className, children, ...props }) => (
            <code className={`rounded-[0.4rem] border border-white/10 bg-white/[0.04] px-1.5 py-0.5 font-mono text-[0.86em] text-indigo-300 shadow-sm ${className || ''}`} {...props}>
              {children}
            </code>
          ),
          ul: ({ node, ...props }) => <ul className="mb-5 list-none space-y-2.5 pl-2 text-zinc-300 [&>li]:relative [&>li]:pl-6 [&>li::before]:absolute [&>li::before]:left-1.5 [&>li::before]:top-[0.6em] [&>li::before]:h-1.5 [&>li::before]:w-1.5 [&>li::before]:rounded-full [&>li::before]:bg-zinc-500" {...props} />,
          ol: ({ node, ...props }) => <ol className="mb-5 list-decimal space-y-2.5 pl-6 text-zinc-300" {...props} />,
          li: ({ node, ...props }) => <li className="leading-[1.7]" {...props} />,
          h1: ({ node, ...props }) => <h1 className="mb-5 mt-8 text-[1.75rem] font-black leading-tight tracking-tight text-white first:mt-0" {...props} />,
          h2: ({ node, ...props }) => <h2 className="mb-4 mt-8 text-2xl font-black leading-tight tracking-tight text-white first:mt-0" {...props} />,
          h3: ({ node, ...props }) => <h3 className="mb-3 mt-6 text-xl font-bold leading-tight tracking-tight text-white first:mt-0" {...props} />,
          h4: ({ node, ...props }) => <h4 className="mb-2 mt-5 text-lg font-bold leading-tight text-white first:mt-0" {...props} />,
          a: ({ node, ...props }) => <a className="font-bold text-[#A3FF4F] underline decoration-white/20 underline-offset-4 transition hover:text-white hover:decoration-[#A3FF4F]/50" {...props} />,
          blockquote: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).map(c => c.props?.children || c).join('');
            let borderClass = 'border-zinc-700/50';
            let bgClass = 'bg-white/[0.02]';
            let textClass = 'text-zinc-300';
            let icon = null;
            
            if (text.includes('💡')) {
              borderClass = 'border-indigo-500/40'; bgClass = 'bg-indigo-500/5'; textClass = 'text-indigo-200';
            } else if (text.includes('⚠️')) {
              borderClass = 'border-[#FF9F1C]/40'; bgClass = 'bg-[#FF9F1C]/5'; textClass = 'text-[#FFBE55]';
            } else if (text.includes('🔗')) {
              borderClass = 'border-teal-500/40'; bgClass = 'bg-teal-500/5'; textClass = 'text-teal-200';
            }
            
            return (
              <blockquote className={`my-6 rounded-r-2xl border-l-[3px] ${borderClass} ${bgClass} px-6 py-4 text-[15px] leading-[1.8] ${textClass} shadow-sm`} {...props}>
                {children}
              </blockquote>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto rounded-2xl border border-white/10 bg-[#0d0e10] shadow-[0_10px_30px_rgba(0,0,0,0.4)]">
              <table className="w-full text-left text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="border-b border-white/10 bg-white/[0.03] text-xs uppercase tracking-wider text-zinc-400" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-white/5" {...props} />,
          tr: ({ node, ...props }) => <tr className="transition hover:bg-white/[0.02]" {...props} />,
          th: ({ node, ...props }) => <th className="px-6 py-4 font-black text-white" {...props} />,
          td: ({ node, ...props }) => <td className="px-6 py-4 text-zinc-300" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-10 border-white/10" {...props} />,
  }), []);

  return (
    <div className={`markdown-renderer max-w-none break-words ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm, remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={components}

      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
