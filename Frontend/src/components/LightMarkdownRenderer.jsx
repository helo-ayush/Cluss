import React, { useState, useEffect, useRef } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import mermaid from 'mermaid';
import { Check, Copy } from 'lucide-react';
import 'katex/dist/katex.min.css';



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
            const depth = Math.floor(indent / 2);
            const label = stripped.replace(/^[-*]\s*/, '').trim();
            if (!label) continue;

            const id = `N${nodeId++}`;
            nodes.push({ id, label, depth });
            depthMap[depth] = id;

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

        safeCode = safeCode.replace(/<br\s*\/?>/gi, ' ');
        safeCode = safeCode.replace(/<\/?[a-z][a-z0-9]*\b[^>]*>/gi, '');
        safeCode = safeCode.replace(/[ \t]{2,}/g, ' ');
        safeCode = safeCode.replace(/\{\s+"([^"]*?)"\s+\}/g, '{"$1"}');
        safeCode = safeCode.replace(/\(\(\s+"([^"]*?)"\s+\)\)/g, '(("$1"))');
        safeCode = safeCode.replace(/\(\s+"([^"]*?)"\s+\)/g, '("$1")');
        safeCode = safeCode.replace(/\[\s+"([^"]*?)"\s+\]/g, '["$1"]');
        safeCode = safeCode.replace(/\[([^\]]+)\]/g, (match, inner) => {
          if (inner.startsWith('"') || inner.startsWith("'")) return match;
          if (/[(){}=<>,;|]/.test(inner)) return `["${inner.trim()}"]`;
          return match;
        });
        safeCode = safeCode.replace(/(\w)\{([^}]+)\}/g, (match, prefix, inner) => {
          if (inner.startsWith('"') || inner.startsWith("'")) return match;
          if (/[()=<>,;|[\]]/.test(inner)) return `${prefix}{"${inner.trim()}"}`;
          return match;
        });

        if (/^\s*sequenceDiagram\b/i.test(safeCode)) {
          safeCode = safeCode.replace(/(participant|actor)\s+([a-zA-Z0-9_\-\.]+)/gi, (match, type, name) => {
            if (name.startsWith('"')) return match;
            return `${type} "${name}"`;
          });
          safeCode = safeCode.replace(/([a-zA-Z0-9_\-\.]+)\s*(->+|-->>?)\s*([a-zA-Z0-9_\-\.]+)/g, (match, p1, arrow, p2) => {
            const quote = (p) => {
              if (p.startsWith('"')) return p;
              if (p.includes('-') || p.includes('.')) return `"${p}"`;
              return p;
            };
            return `${quote(p1)} ${arrow} ${quote(p2)}`;
          });
        }

        // 7. Strip custom styles and frontmatter config to enforce clean PDF aesthetic
        safeCode = safeCode.split('\n').filter(line => {
          const trimmed = line.trim();
          if (trimmed.startsWith('style ') || 
              trimmed.startsWith('classDef ') || 
              trimmed.startsWith('class ') || 
              trimmed.startsWith('linkStyle ') ||
              trimmed.startsWith('%%')) {
            return false;
          }
          return true;
        }).join('\n');

        const id = `mermaid-light-${Math.random().toString(36).substr(2, 9)}`;
        const { svg: svgOutput } = await mermaid.render(id, safeCode);
        if (isMounted) {
          setSvg(svgOutput);
          setError(false);
        }
      } catch (err) {
        if (isMounted) setError(true);
      }
    };
    if (code) renderDiagram();
    return () => { isMounted = false; };
  }, [code]);

  if (error) {
    return (
      <div className="my-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-600">
        <p className="font-bold">Failed to render diagram.</p>
        <pre className="mt-2 overflow-x-auto text-[11px] opacity-70">{code}</pre>
      </div>
    );
  }

  return (
    <div className="my-6 flex justify-center overflow-x-auto rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
      {svg ? (
        <div ref={containerRef} dangerouslySetInnerHTML={{ __html: svg }} className="w-full max-w-3xl flex justify-center" />
      ) : (
        <div className="h-32 flex w-full items-center justify-center text-sm text-slate-400">Loading diagram...</div>
      )}
    </div>
  );
}

function CodeBlock({ className = '', children, ...props }) {
  const match = /language-(\w+)/.exec(className || '');
  const language = match?.[1] || 'code';
  const code = String(children || '').replace(/\n$/, '');

  if (language === 'mermaid') {
    return <MermaidBlock code={code} />;
  }

  return (
    <div className="my-4 overflow-hidden rounded-2xl border border-slate-200 bg-slate-50 shadow-sm">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-100 px-4 py-2">
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">{language}</span>
      </div>
      <pre className="custom-scroll max-w-full overflow-x-auto p-4 text-[13px] leading-7 text-slate-800">
        <code className={className} {...props}>
          {children}
        </code>
      </pre>
    </div>
  );
}

export default function LightMarkdownRenderer({ content, className = '' }) {
  if (!content) return null;

  const components = React.useMemo(() => ({
          p: ({ node, ...props }) => <p className="mb-3 last:mb-0 leading-7 text-slate-600" {...props} />,
          strong: ({ node, ...props }) => <strong className="font-bold text-slate-950" {...props} />,
          em: ({ node, ...props }) => <em className="italic text-slate-700" {...props} />,
          pre: ({ children, ...props }) => {
            if (React.isValidElement(children) && children.props.node?.tagName === 'code') {
              return <CodeBlock className={children.props.className}>{children.props.children}</CodeBlock>;
            }
            return <pre {...props}>{children}</pre>;
          },
          code: ({ node, className, children, ...props }) => (
            <code className={`rounded-md border border-slate-200 bg-slate-100 px-1.5 py-0.5 font-mono text-[0.86em] text-slate-900 ${className || ''}`} {...props}>
              {children}
            </code>
          ),
          ul: ({ node, ...props }) => <ul className="mb-4 list-disc space-y-2 pl-5 text-slate-600" {...props} />,
          ol: ({ node, ...props }) => <ol className="mb-4 list-decimal space-y-2 pl-5 text-slate-600" {...props} />,
          li: ({ node, ...props }) => <li className="pl-1 leading-7" {...props} />,
          h1: ({ node, ...props }) => <h1 className="mb-4 mt-6 text-2xl font-bold leading-tight text-slate-950 first:mt-0" {...props} />,
          h2: ({ node, ...props }) => <h2 className="mb-3 mt-6 text-xl font-bold leading-tight text-slate-950 first:mt-0" {...props} />,
          h3: ({ node, ...props }) => <h3 className="mb-2 mt-5 text-lg font-bold leading-tight text-slate-950 first:mt-0" {...props} />,
          h4: ({ node, ...props }) => <h4 className="mb-2 mt-4 text-base font-bold leading-tight text-slate-950 first:mt-0" {...props} />,
          a: ({ node, ...props }) => <a className="font-medium text-[#4338ca] underline underline-offset-4 hover:text-[#3730a3]" {...props} />,
          blockquote: ({ node, children, ...props }) => {
            const text = React.Children.toArray(children).map(c => c.props?.children || c).join('');
            let borderClass = 'border-slate-900';
            let bgClass = 'bg-slate-100';
            let textClass = 'text-slate-800';
            
            if (text.includes('💡')) {
              borderClass = 'border-indigo-500'; bgClass = 'bg-indigo-50'; textClass = 'text-indigo-900';
            } else if (text.includes('⚠️')) {
              borderClass = 'border-amber-500'; bgClass = 'bg-amber-50'; textClass = 'text-amber-900';
            } else if (text.includes('🔗')) {
              borderClass = 'border-teal-500'; bgClass = 'bg-teal-50'; textClass = 'text-teal-900';
            }
            
            return (
              <blockquote className={`my-6 rounded-r-2xl border-l-4 ${borderClass} ${bgClass} px-5 py-4 text-[15px] leading-7 ${textClass}`} {...props}>
                {children}
              </blockquote>
            );
          },
          table: ({ node, ...props }) => (
            <div className="my-6 w-full overflow-x-auto rounded-2xl border border-slate-200">
              <table className="w-full text-left text-sm" {...props} />
            </div>
          ),
          thead: ({ node, ...props }) => <thead className="bg-slate-50 text-xs uppercase text-slate-500" {...props} />,
          tbody: ({ node, ...props }) => <tbody className="divide-y divide-slate-200" {...props} />,
          tr: ({ node, ...props }) => <tr className="hover:bg-slate-50/50" {...props} />,
          th: ({ node, ...props }) => <th className="px-6 py-4 font-semibold text-slate-900" {...props} />,
          td: ({ node, ...props }) => <td className="px-6 py-4 text-slate-600" {...props} />,
          hr: ({ node, ...props }) => <hr className="my-8 border-slate-200" {...props} />,
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
