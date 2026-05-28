import { useMemo, useRef, useState } from 'react';
import Editor from '@monaco-editor/react';
import { Code2, Maximize2, Minimize2, RotateCcw, Wand2 } from 'lucide-react';

const languageAliases = {
  js: 'javascript',
  jsx: 'javascript',
  ts: 'typescript',
  tsx: 'typescript',
  py: 'python',
  cplusplus: 'cpp',
  'c++': 'cpp',
  'c#': 'csharp',
  shell: 'shell',
  bash: 'shell',
  sh: 'shell',
  html: 'html',
  css: 'css',
  json: 'json',
  sql: 'sql',
  java: 'java',
  cpp: 'cpp',
  c: 'c',
  python: 'python',
  go: 'go',
  rust: 'rust',
  php: 'php',
};

function normalizeLanguage(language) {
  const key = String(language || 'javascript').trim().toLowerCase();
  return languageAliases[key] || key || 'javascript';
}

export default function CodeWorkspace({
  value,
  onChange,
  starterCode = '',
  language = 'javascript',
  fileName,
  readOnly = false,
  height = 420,
  showToolbar = true,
}) {
  const editorRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const editorLanguage = useMemo(() => normalizeLanguage(language), [language]);
  const displayName = fileName || `solution.${editorLanguage === 'javascript' ? 'js' : editorLanguage}`;
  const editorHeight = expanded ? '70vh' : height;

  const handleMount = (editor, monaco) => {
    editorRef.current = editor;
    setReady(true);

    monaco.editor.defineTheme('studyhelper-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: '', foreground: 'f5f5f5', background: '1b1b1b' },
        { token: 'comment', foreground: '858585', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'efff55' },
        { token: 'number', foreground: 'c6f6d5' },
        { token: 'string', foreground: 'b8e986' },
        { token: 'type', foreground: '93c5fd' },
      ],
      colors: {
        'editor.background': '#1b1b1b',
        'editor.foreground': '#f5f5f5',
        'editorLineNumber.foreground': '#6b7280',
        'editorLineNumber.activeForeground': '#efff55',
        'editorCursor.foreground': '#efff55',
        'editor.selectionBackground': '#efff5530',
        'editor.inactiveSelectionBackground': '#efff5518',
        'editor.lineHighlightBackground': '#ffffff08',
        'editorIndentGuide.background1': '#ffffff12',
        'editorIndentGuide.activeBackground1': '#efff5540',
      },
    });
    monaco.editor.setTheme('studyhelper-dark');
  };

  const formatCode = async () => {
    const action = editorRef.current?.getAction('editor.action.formatDocument');
    if (action) await action.run();
  };

  const resetStarter = () => {
    onChange?.(starterCode || '');
    requestAnimationFrame(() => editorRef.current?.focus());
  };

  return (
    <div className={`overflow-hidden rounded-[1.25rem] border border-white/[0.10] bg-[#202020] transition ${expanded ? 'fixed inset-5 z-[1700] shadow-[0_30px_100px_rgba(0,0,0,0.55)]' : ''}`}>
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/[0.08] bg-[#242424] px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-white/[0.08] bg-[#1b1b1b] text-[#efff55]">
              <Code2 className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-xs font-black text-white">{displayName}</p>
              <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/38">{editorLanguage}</p>
            </div>
          </div>

          {!readOnly && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={formatCode}
                disabled={!ready}
                className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/62 transition hover:border-[#efff55]/35 hover:text-white disabled:opacity-35"
              >
                <Wand2 className="h-3.5 w-3.5" />
                Format
              </button>
              {starterCode && (
                <button
                  type="button"
                  onClick={resetStarter}
                  className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/62 transition hover:border-[#efff55]/35 hover:text-white"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Reset
                </button>
              )}
              <button
                type="button"
                onClick={() => setExpanded(prev => !prev)}
                className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-[10px] font-black uppercase tracking-[0.12em] text-white/62 transition hover:border-[#efff55]/35 hover:text-white"
              >
                {expanded ? <Minimize2 className="h-3.5 w-3.5" /> : <Maximize2 className="h-3.5 w-3.5" />}
                {expanded ? 'Collapse' : 'Expand'}
              </button>
            </div>
          )}
        </div>
      )}

      <Editor
        height={editorHeight}
        language={editorLanguage}
        value={value || ''}
        theme="studyhelper-dark"
        loading={
          <div className="flex h-full items-center justify-center bg-[#1b1b1b] text-xs font-black uppercase tracking-[0.18em] text-white/38">
            Loading editor
          </div>
        }
        onMount={handleMount}
        onChange={nextValue => onChange?.(nextValue || '')}
        options={{
          readOnly,
          fontSize: 14,
          fontFamily: "'Cascadia Code', 'Fira Code', Consolas, monospace",
          minimap: { enabled: false },
          lineNumbers: 'on',
          lineDecorationsWidth: 10,
          lineNumbersMinChars: 3,
          scrollBeyondLastLine: false,
          smoothScrolling: true,
          wordWrap: 'on',
          automaticLayout: true,
          tabSize: 2,
          insertSpaces: true,
          bracketPairColorization: { enabled: true },
          guides: { bracketPairs: true, indentation: true },
          formatOnPaste: true,
          formatOnType: true,
          padding: { top: 16, bottom: 16 },
          overviewRulerBorder: false,
          renderLineHighlight: 'all',
        }}
      />
    </div>
  );
}
