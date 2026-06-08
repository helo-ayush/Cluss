import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Terminal, Lightbulb, CheckCircle2, XCircle, ChevronRight, Check, HelpCircle, 
  RotateCcw, Loader2, Maximize2, ChevronDown, ChevronUp, X, Play, Menu
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';
import Editor from '@monaco-editor/react';
import { useAuth } from '@clerk/clerk-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ── PREMIUM CODE WORKSPACE ──
export const PremiumCodeWorkspace = ({
  blockId,
  title,
  originalCode,
  language: initialLanguage,
  expectedAnswer,
  explanation,
  hint,
  onWorkspaceUpdate,
  readOnly = false,
  question
}) => {
  const { getToken } = useAuth();
  const [code, setCode] = useState(originalCode || '');
  const [language, setLanguage] = useState(initialLanguage || 'python');
  const [cursorPos, setCursorPos] = useState({ ln: 1, col: 1 });
  const [running, setRunning] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState(null);
  const [hasRun, setHasRun] = useState(false);
  const [status, setStatus] = useState('idle'); // 'idle', 'running', 'success', 'error'
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [consoleOpen, setConsoleOpen] = useState(true);
  const [fontSize, setFontSize] = useState(13);
  const [mobileControlsOpen, setMobileControlsOpen] = useState(false);

  // Synchronize initial code
  useEffect(() => {
    setCode(originalCode || '');
    setLanguage(initialLanguage || 'python');
    setTerminalOutput(null);
    setStatus('idle');
    setHasRun(false);
  }, [originalCode, initialLanguage]);

  useEffect(() => {
    if (!isFullscreen) setMobileControlsOpen(false);
  }, [isFullscreen]);

  // Handle countdown interval
  useEffect(() => {
    if (cooldown <= 0) return;
    const interval = setInterval(() => {
      setCooldown(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [cooldown]);

  // Report changes to parent for chatbot context
  useEffect(() => {
    if (!readOnly) {
      onWorkspaceUpdate?.({
        userCode: code,
        runOutput: terminalOutput
      });
    }
  }, [code, terminalOutput, readOnly]);

  const handleEditorMount = (editor, monaco) => {
    monaco.editor.defineTheme('cluss-dark', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '7f848e', fontStyle: 'italic' },
        { token: 'keyword', foreground: 'c678dd' },
        { token: 'string', foreground: '98c379' },
        { token: 'number', foreground: 'd19a66' },
        { token: 'regexp', foreground: 'e06c75' },
        { token: 'type', foreground: 'e5c07b' },
        { token: 'class', foreground: 'e5c07b' },
        { token: 'function', foreground: '61afef' },
        { token: 'variable', foreground: 'abb2bf' },
      ],
      colors: {
        'editor.background': '#202020',
        'editor.foreground': '#f4f4f5',
        'editor.lineHighlightBackground': '#2a2a2a',
        'editorGutter.background': '#202020',
        'editorLineNumber.foreground': '#666666',
        'editorLineNumber.activeForeground': '#efff55',
        'editorCursor.foreground': '#efff55',
        'editor.selectionBackground': '#efff5530',
        'editorIndentGuide.background1': '#ffffff12',
        'editorIndentGuide.activeBackground1': '#efff5540',
      }
    });
    monaco.editor.setTheme('cluss-dark');

    editor.onDidChangeCursorPosition((e) => {
      setCursorPos({ ln: e.position.lineNumber, col: e.position.column });
    });
  };

  const handleRunCode = async () => {
    if (readOnly || cooldown > 0 || running) return;
    setRunning(true);
    setStatus('running');
    setHasRun(true);

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/compiler/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          code,
          language
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Error executing code');
      }

      const runResult = data.result || {};
      setTerminalOutput(runResult);

      if (runResult.exit_code === 0) {
        if (expectedAnswer) {
          const cleanOut = (runResult.stdout || '').trim();
          const cleanExpected = (expectedAnswer || '').trim();
          if (cleanOut === cleanExpected) {
            setStatus('success');
          } else {
            setStatus('error');
          }
        } else {
          setStatus('success'); // Normal code execution succeeded
        }
      } else {
        setStatus('error');
      }
    } catch (err) {
      setTerminalOutput({
        stdout: '',
        stderr: err.message || 'Failed to run code. Please check your connection.',
        exit_code: -1,
        execution_time: 0
      });
      setStatus('error');
    } finally {
      setRunning(false);
      setCooldown(10);
    }
  };

  const handleReset = () => {
    setCode(originalCode || '');
    setStatus('idle');
    setTerminalOutput(null);
    setHasRun(false);
  };

  const handleFormatCode = () => {
    const formatted = code
      .split('\n')
      .map(line => line.trimEnd())
      .join('\n')
      .trim();
    setCode(formatted);
  };

  const languages = [
    { value: 'python', label: 'Python' },
    { value: 'javascript', label: 'JavaScript' },
    { value: 'typescript', label: 'TypeScript' },
    { value: 'cpp', label: 'C++' },
    { value: 'c', label: 'C' },
    { value: 'java', label: 'Java' },
    { value: 'go', label: 'Go' },
    { value: 'rust', label: 'Rust' },
    { value: 'ruby', label: 'Ruby' },
    { value: 'php', label: 'PHP' },
    { value: 'bash', label: 'Bash' },
    { value: 'perl', label: 'Perl' },
    { value: 'lua', label: 'Lua' },
    { value: 'r', label: 'R' },
    { value: 'haskell', label: 'Haskell' },
    { value: 'csharp', label: 'C#' },
    { value: 'lisp', label: 'Lisp' },
    { value: 'pascal', label: 'Pascal' },
    { value: 'sql', label: 'SQL' }
  ];

  const displayHeaderTitle = readOnly ? 'Code Example' : 'Coding Challenge';

  const workspaceContent = (
    <div className={`overflow-hidden [font-family:'Nunito',sans-serif] transition-all duration-300 ${
      isFullscreen 
        ? 'fixed inset-0 z-[9999] flex h-screen w-screen flex-col rounded-none border-none bg-[#151515] text-white' 
        : 'my-4 rounded-2xl border border-white/[0.09] bg-[#242424] shadow-lg pdf-no-break'
    }`}>
      {!isFullscreen && (
      <div className={`shrink-0 ${
        isFullscreen 
          ? 'px-4 py-3 max-md:hidden' 
          : 'flex h-12 items-center justify-between border-b border-zinc-800/50 bg-zinc-900/20 px-4 py-2'
      }`}>
        <div className={`w-full ${isFullscreen ? 'grid rounded-[1.45rem] border border-white/[0.09] bg-[#202020]/88 px-3 py-3 shadow-[0_18px_60px_rgba(0,0,0,0.3)] backdrop-blur-xl gap-3 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] lg:items-center' : 'flex items-center justify-between'}`}>
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0">
              <span className={`block truncate text-[12px] font-black uppercase tracking-wider ${isFullscreen ? 'text-zinc-100' : 'text-zinc-300'}`}>
                {displayHeaderTitle}
              </span>
              {isFullscreen && (
                <p className="mt-0.5 truncate text-[11px] font-semibold text-zinc-500">
                  {title || 'Solve the prompt, run it, and inspect the compiler output.'}
                </p>
              )}
            </div>
            {isFullscreen && (
              <div className="hidden items-center gap-1 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500 md:flex">
                <span className={`h-2 w-2 rounded-full ${
                  status === 'success' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]' :
                  status === 'error' ? 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.7)]' :
                  status === 'running' ? 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)]' :
                  'bg-zinc-600'
                }`} />
                {status === 'success' ? 'Passed' :
                 status === 'error' ? 'Needs work' :
                 status === 'running' ? 'Compiling' : 'Ready'}
              </div>
            )}
          </div>

          {isFullscreen && !readOnly && (
            <div className="flex items-center justify-center gap-2">
              <button
                onClick={handleRunCode}
                disabled={running || cooldown > 0}
                className="inline-flex h-11 min-w-28 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black shadow-[0_16px_35px_rgba(255,255,255,0.08)] transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {running ? 'Running' : cooldown > 0 ? `${cooldown}s` : 'Run Code'}
              </button>
            </div>
          )}

          {/* Right Actions */}
          <div className={`flex items-center gap-2 ${isFullscreen ? 'justify-end' : ''}`}>
            {isFullscreen && (
              <span className="inline-flex h-10 items-center rounded-full border border-white/[0.10] bg-white/[0.04] px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-300">
                {languages.find(l => l.value === language.toLowerCase())?.label || language.toUpperCase()}
              </span>
            )}

            <button
              type="button"
              onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
              title="Decrease Font Size"
              className={`${isFullscreen ? 'h-10 w-10 rounded-full' : 'h-8 w-8 rounded-lg'} flex items-center justify-center border border-white/[0.08] bg-white/[0.035] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white`}
            >
              <span className="text-xs font-black">A-</span>
            </button>
            <button
              type="button"
              onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
              title="Increase Font Size"
              className={`${isFullscreen ? 'h-10 w-10 rounded-full' : 'h-8 w-8 rounded-lg'} flex items-center justify-center border border-white/[0.08] bg-white/[0.035] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white`}
            >
              <span className="text-xs font-black">A+</span>
            </button>

            {isFullscreen ? (
              <button
                type="button"
                onClick={() => setIsFullscreen(false)}
                title="Exit Fullscreen"
                className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-zinc-300 transition hover:bg-white hover:text-black"
              >
                <span className="text-sm font-black">×</span>
              </button>
            ) : (
              <>
                <button
                  type="button"
                  onClick={() => setIsFullscreen(true)}
                  title="Fullscreen"
                  className="flex h-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-zinc-400 hover:border-white/20 hover:text-white transition duration-200"
                >
                  <Maximize2 className="h-3.5 w-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setIsCollapsed(!isCollapsed)}
                  title={isCollapsed ? "Expand" : "Collapse"}
                  className="flex h-7 items-center justify-center rounded-lg border border-white/[0.06] bg-white/[0.02] px-2.5 text-zinc-400 hover:border-white/20 hover:text-white transition duration-200"
                >
                  {isCollapsed ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronUp className="h-3.5 w-3.5" />}
                </button>
              </>
            )}
          </div>
        </div>
      </div>
      )}

      {isFullscreen ? (
        /* Fullscreen Layout: Split Screen Dual-Pane IDE */
        <div className={`grid min-h-0 flex-1 gap-3 bg-[#151515] p-3 max-md:p-0 ${question ? 'lg:grid-cols-[minmax(20rem,0.82fr)_minmax(0,1.45fr)]' : 'lg:grid-cols-1'}`}>
          {/* Left Panel: Description */}
          {question && (
            <motion.div 
              initial={{ opacity: 0, x: -15 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="hidden min-h-0 flex-col overflow-hidden rounded-[1.6rem] border border-white/[0.09] bg-[#1f1f1f] shadow-[0_24px_80px_rgba(0,0,0,0.34)] transition-all duration-300 md:flex"
            >
              <div className="flex min-h-14 items-center justify-between border-b border-white/[0.08] bg-[#242424] px-4">
                <div className="flex min-w-0 items-center gap-3 text-zinc-200">
                  <span className="truncate text-[11px] font-black uppercase tracking-[0.18em]">Problem</span>
                  <span className="inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.14em] text-zinc-500">
                    <span className={`h-2 w-2 rounded-full ${
                      status === 'success' ? 'bg-emerald-400 shadow-[0_0_12px_rgba(52,211,153,0.75)]' :
                      status === 'error' ? 'bg-rose-400 shadow-[0_0_12px_rgba(251,113,133,0.7)]' :
                      status === 'running' ? 'bg-amber-300 shadow-[0_0_12px_rgba(252,211,77,0.7)]' :
                      'bg-zinc-600'
                    }`} />
                    {status === 'success' ? 'Passed' :
                     status === 'error' ? 'Needs work' :
                     status === 'running' ? 'Compiling' : 'Ready'}
                  </span>
                </div>
                {hint && !readOnly && (
                  <button
                    onClick={() => setShowHint(!showHint)}
                    className={`flex h-9 items-center gap-1.5 rounded-full border px-3 text-[10px] font-black uppercase tracking-[0.12em] transition ${
                      showHint ? 'border-amber-300/35 bg-amber-300/10 text-amber-200' : 'border-white/[0.10] bg-white/[0.035] text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                  >
                    <span>Hint</span>
                  </button>
                )}
              </div>
              <div className="custom-scroll min-h-0 flex-1 space-y-5 overflow-y-auto bg-[#1f1f1f] p-6 text-zinc-300">
                <div className="select-text text-[15px] font-medium leading-8 text-zinc-200">
                  <MarkdownRenderer content={question} />
                </div>
                <AnimatePresence>
                  {showHint && hint && (
                    <motion.div
                      initial={{ opacity: 0, height: 0, marginTop: 0 }}
                      animate={{ opacity: 1, height: "auto", marginTop: 16 }}
                      exit={{ opacity: 0, height: 0, marginTop: 0 }}
                      transition={{ duration: 0.2 }}
                      className="rounded-[1.2rem] border border-amber-300/25 bg-amber-300/10 p-4 text-xs leading-relaxed text-amber-200 shadow-sm"
                    >
                      <div className="flex items-start gap-2.5">
                        <div>
                          <span className="font-black uppercase tracking-wider text-amber-400 block mb-1 text-[9px]">AI Hint</span>
                          <p className="font-semibold">{hint}</p>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          )}

          {/* Right Panel: Monaco Editor & Terminal */}
          <motion.div 
            initial={{ opacity: 0, x: 15 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, ease: "easeOut", delay: 0.05 }}
            className="flex min-h-0 flex-col gap-3 bg-transparent max-md:gap-0"
          >
            {/* Editor Container Card */}
            <div className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[1.6rem] border border-white/[0.09] bg-[#181818] shadow-[0_24px_80px_rgba(0,0,0,0.34)] transition-all duration-300 max-md:rounded-none max-md:border-0">
              {/* Tab Bar / Header inside Monaco */}
              <div className="flex min-h-14 items-center justify-between border-b border-white/[0.08] bg-[#202020] px-4 max-md:hidden">
                <div className="flex min-w-0 items-center gap-2">
                  <span className="truncate rounded-full border border-white/[0.08] bg-[#181818] px-3 py-1.5 font-mono text-[11px] font-black text-zinc-300">
                    solution.{language === 'python' ? 'py' : language === 'cpp' ? 'cpp' : language === 'java' ? 'java' : language === 'go' ? 'go' : 'js'}
                  </span>
                  <span className="inline-flex h-9 items-center rounded-full border border-white/[0.10] bg-white/[0.04] px-4 text-xs font-black uppercase tracking-[0.14em] text-zinc-300">
                    {languages.find(l => l.value === language.toLowerCase())?.label || language.toUpperCase()}
                  </span>
                </div>
                {!readOnly && (
                  <button
                    onClick={handleRunCode}
                    disabled={running || cooldown > 0}
                    className="inline-flex h-10 min-w-28 items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black shadow-[0_16px_35px_rgba(255,255,255,0.08)] transition hover:bg-zinc-200 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {running ? <Loader2 className="h-4 w-4 animate-spin" /> : <Play className="h-4 w-4 fill-current" />}
                    {running ? 'Running' : cooldown > 0 ? `${cooldown}s` : 'Run Code'}
                  </button>
                )}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                    title="Decrease Font Size"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                  >
                    <span className="text-xs font-black">A-</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
                    title="Increase Font Size"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] text-zinc-400 transition hover:border-white/20 hover:bg-white/[0.07] hover:text-white"
                  >
                    <span className="text-xs font-black">A+</span>
                  </button>
                  <button
                    onClick={handleReset}
                    title="Reset Code"
                    className="flex h-9 items-center justify-center rounded-full border border-white/[0.08] bg-white/[0.035] px-3 text-zinc-400 transition hover:border-white/20 hover:text-white active:scale-95"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIsFullscreen(false)}
                    title="Exit Fullscreen"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-zinc-300 transition hover:bg-white hover:text-black"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>

              {/* Monaco Editor Container */}
              <div className="relative min-h-0 flex-1 overflow-hidden bg-[#181818]">
                <Editor
                  height="100%"
                  language={language}
                  theme="cluss-dark"
                  value={code}
                  onChange={(val) => {
                    if (!readOnly) {
                      setCode(val || '');
                      if (status !== 'idle') setStatus('idle');
                    }
                  }}
                  onMount={handleEditorMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    readOnly: readOnly,
                    domReadOnly: readOnly,
                    scrollbar: {
                      vertical: 'auto',
                      horizontal: 'auto',
                      alwaysConsumeMouseWheel: true
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                    lineNumbersMinChars: 3,
                    folding: true,
                    glyphMargin: false,
                    lineDecorationsWidth: 10
                  }}
                />
              </div>
            </div>

            {!readOnly && (
              <div className={`hidden flex-col overflow-hidden rounded-[1.6rem] border border-white/[0.09] bg-[#1f1f1f] shadow-[0_24px_80px_rgba(0,0,0,0.28)] transition-all duration-300 md:flex ${consoleOpen ? 'h-[15.5rem]' : 'h-[3.25rem]'}`}>
                <div className="flex min-h-[3.25rem] items-center justify-between border-b border-white/[0.08] bg-[#242424] px-4">
                  <div className="flex items-center gap-2 text-zinc-200">
                    <span className="text-[11px] font-black uppercase tracking-[0.18em]">Console</span>
                  </div>
                  <div className="flex items-center gap-3 mr-1">
                    <button
                      type="button"
                      onClick={() => setConsoleOpen(prev => !prev)}
                      className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 transition hover:bg-white hover:text-black"
                    >
                      {consoleOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronUp className="h-3 w-3" />}
                      {consoleOpen ? 'Shrink' : 'Open'}
                    </button>
                    {hasRun && terminalOutput && !running && (
                      <button 
                        onClick={() => setTerminalOutput(null)}
                        className="rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-1.5 text-[9px] font-black uppercase tracking-wider text-zinc-400 transition hover:bg-white hover:text-black"
                      >
                        Clear
                      </button>
                    )}
                    {hasRun && terminalOutput && !running && terminalOutput.execution_time !== undefined && (
                      <span className="rounded-full border border-white/[0.08] bg-white/[0.035] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-zinc-500">
                        Time: {terminalOutput.execution_time}s
                      </span>
                    )}
                  </div>
                </div>
                {consoleOpen && <div className="custom-scroll min-h-0 flex-1 overflow-y-auto whitespace-pre-wrap bg-[#181818] p-5 font-mono text-xs text-zinc-300">
                  {running ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-3 py-8">
                      <Loader2 className="h-5 w-5 animate-spin text-emerald-400" />
                      <span className="text-[10px] font-bold text-zinc-400 tracking-wider animate-pulse uppercase">Compiling and executing...</span>
                    </div>
                  ) : hasRun && terminalOutput ? (
                    <motion.div
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-1.5"
                    >
                      {terminalOutput.stdout && (
                        <div className="font-medium leading-relaxed text-emerald-300">{terminalOutput.stdout}</div>
                      )}
                      {terminalOutput.stderr && (
                        <div className="text-rose-400 font-bold leading-relaxed">{terminalOutput.stderr}</div>
                      )}
                      {!terminalOutput.stdout && !terminalOutput.stderr && (
                        <div className="text-zinc-500 italic">[Program exited with code {terminalOutput.exit_code}]</div>
                      )}
                    </motion.div>
                  ) : (
                    <div className="flex h-full items-center text-zinc-500 italic">Run your code to see stdout, stderr, exit code, and timing here.</div>
                  )}
                </div>}
                {/* Status Bar */}
                {consoleOpen && <div className="flex shrink-0 items-center justify-between border-t border-white/[0.08] bg-[#202020] px-4 py-2 text-[10px] font-bold text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500">Status:</span>
                    <span className={`px-2 py-0.5 rounded text-[9px] font-black tracking-wider ${
                      status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      status === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      status === 'running' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                      'bg-zinc-800/40 text-zinc-500 border border-zinc-800'
                    }`}>
                      {status === 'success' ? (expectedAnswer ? 'PASSED' : 'SUCCESS') :
                       status === 'error' ? 'FAILED' :
                       status === 'running' ? 'RUNNING...' : 'SAVED'}
                    </span>
                  </div>
                  <div className="text-zinc-500 font-mono">
                    Ln {cursorPos.ln}, Col {cursorPos.col}
                  </div>
                </div>}
              </div>
            )}
          </motion.div>
        </div>
      ) : (
        <AnimatePresence initial={false}>
          {(!isCollapsed || isFullscreen) && (
            <motion.div
              initial={isFullscreen ? false : { height: 0, opacity: 0 }}
              animate={isFullscreen ? false : { height: 'auto', opacity: 1 }}
              exit={isFullscreen ? false : { height: 0, opacity: 0 }}
              className={`flex flex-col ${isFullscreen ? 'flex-1 min-h-0' : ''}`}
            >
              {/* Sub-header Bar - ONLY show for coding tasks and when NOT in Fullscreen */}
              {!readOnly && !isFullscreen && (
                <div className="flex flex-wrap items-center justify-between border-b border-white/[0.06] bg-white/[0.005] px-4 py-2 gap-2">
                  <div className="flex items-center gap-3">
                    <span className="rounded-lg border border-white/[0.08] bg-[#141416] px-2.5 py-1 text-xs font-black uppercase tracking-wider text-zinc-300">
                      {languages.find(l => l.value === language.toLowerCase())?.label || language.toUpperCase()}
                    </span>
                    <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-500">
                      <span className={`h-2 w-2 rounded-full ${
                        status === 'success' ? 'bg-emerald-500 shadow-[0_0_8px_#10b981]' :
                        status === 'error' ? 'bg-rose-500 shadow-[0_0_8px_#f43f5e]' :
                        status === 'running' ? 'bg-amber-500 shadow-[0_0_8px_#f59e0b]' :
                        'bg-zinc-600'
                      }`} />
                      <span>
                        {status === 'success' ? 'Ready & Passed' :
                         status === 'error' ? 'Failed Test Cases' :
                         status === 'running' ? 'Compiling...' : 'Auto-Run: Idle'}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {hint && (
                      <button
                        onClick={() => setShowHint(!showHint)}
                        title="Show Hint"
                        className={`flex h-8 px-3 items-center gap-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] text-[11px] font-bold transition duration-200 ${
                          showHint ? 'border-[#FF9F1C]/30 text-[#FF9F1C] bg-[#FF9F1C]/5' : 'text-zinc-400 hover:border-white/20 hover:text-white'
                        }`}
                      >
                        <span>Hint</span>
                      </button>
                    )}
                    <button
                      onClick={handleReset}
                      title="Reset Code"
                      className="flex h-8 items-center justify-center rounded-lg border border-white/[0.06] bg-[#1e1e1e] px-3 text-zinc-400 hover:border-white/20 hover:text-white transition duration-200"
                    >
                      <span className="text-[9px] font-black uppercase">Reset</span>
                    </button>
                    <button
                      onClick={handleRunCode}
                      disabled={running || cooldown > 0}
                      className={`flex h-8 items-center gap-1.5 rounded-lg px-3.5 text-xs font-bold transition duration-200 ${
                        status === 'success'
                          ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.25)]'
                          : 'bg-[#efff55] text-black hover:bg-[#efff55]/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100'
                      }`}
                    >
                      {running ? (
                        <span className="h-2 w-2 animate-pulse rounded-full bg-black" />
                      ) : (
                        null
                      )}
                      <span>
                        {running ? 'Running' : cooldown > 0 ? `Cooldown (${cooldown}s)` : 'Run'}
                      </span>
                    </button>
                  </div>
                </div>
              )}

              {/* Hint Box */}
              <AnimatePresence>
                {showHint && hint && !readOnly && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="overflow-hidden border-b border-[#FF9F1C]/10 bg-[#FF9F1C]/[0.02] px-5 py-3 text-xs leading-relaxed text-[#ffd08a]"
                  >
                    <div className="flex items-start gap-2.5">
                      <p className="font-semibold">{hint}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Monaco Editor Container */}
              <div className={`p-0 bg-[#202020] ${isFullscreen ? 'flex-1 min-h-0' : ''}`}>
                <Editor
                  height={isFullscreen ? "100%" : `${Math.min(Math.max((code || '').split('\n').length * 20 + 24, 100), 500)}px`}
                  language={language}
                  theme="cluss-dark"
                  value={code}
                  onChange={(val) => {
                    if (!readOnly) {
                      setCode(val || '');
                      if (status !== 'idle') setStatus('idle');
                    }
                  }}
                  onMount={handleEditorMount}
                  options={{
                    minimap: { enabled: false },
                    fontSize: fontSize,
                    fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                    lineNumbers: 'on',
                    scrollBeyondLastLine: false,
                    automaticLayout: true,
                    readOnly: readOnly,
                    domReadOnly: readOnly,
                    scrollbar: {
                      vertical: 'hidden',
                      horizontal: 'hidden',
                      alwaysConsumeMouseWheel: false
                    },
                    overviewRulerLanes: 0,
                    hideCursorInOverviewRuler: true,
                    overviewRulerBorder: false,
                    lineNumbersMinChars: 3,
                    folding: false,
                    glyphMargin: false,
                    lineDecorationsWidth: 10
                  }}
                />
              </div>

              {/* Terminal Output */}
              {!readOnly && !isFullscreen && (
                <AnimatePresence>
                  {hasRun && terminalOutput && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="border-t border-white/[0.07] bg-[#202020] font-mono text-xs text-zinc-300"
                    >
                      <div className="flex items-center justify-between border-b border-white/[0.07] bg-[#242424] px-5 py-2 text-zinc-400">
                        <div className="flex items-center gap-1.5 font-bold">
                          <span>Console Output</span>
                        </div>
                        {terminalOutput.execution_time !== undefined && (
                          <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500">
                            Time: {terminalOutput.execution_time}s
                          </span>
                        )}
                      </div>
                      <div className="max-h-40 space-y-2 overflow-y-auto whitespace-pre-wrap bg-[#202020] p-4">
                        {terminalOutput.stdout && (
                          <div className="font-semibold text-emerald-300">{terminalOutput.stdout}</div>
                        )}
                        {terminalOutput.stderr && (
                          <div className="font-semibold text-rose-300">{terminalOutput.stderr}</div>
                        )}
                        {!terminalOutput.stdout && !terminalOutput.stderr && (
                          <div className="text-zinc-500 italic">[Program exited with code {terminalOutput.exit_code} with no output]</div>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}

              {/* Status Footer Bar */}
              {!readOnly && !isFullscreen && (
                <div className="flex items-center justify-between border-t border-white/[0.07] bg-[#242424] px-5 py-2.5 text-[11px] font-bold text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <span className={
                      status === 'success' ? 'text-emerald-400' :
                      status === 'error' ? 'text-rose-400' :
                      status === 'running' ? 'text-amber-400' : 'text-zinc-500'
                    }>
                      {status === 'success' ? (expectedAnswer ? 'Passed' : 'Success') :
                       status === 'error' ? 'Failed' :
                       status === 'running' ? 'Running...' : 'Saved'}
                    </span>
                  </div>
                  <div>
                    Ln {cursorPos.ln}, Col {cursorPos.col}
                  </div>
                </div>
              )}
              
              {/* Explanation box */}
              {!readOnly && !isFullscreen && (
                <AnimatePresence>
                  {status === 'success' && explanation && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: 'auto' }}
                      className="border-t border-white/[0.06] bg-white/[0.005] p-5"
                    >
                      <h4 className="text-xs font-black uppercase tracking-wider text-emerald-400 mb-2">
                        Explanation
                      </h4>
                      <div className="text-sm leading-relaxed text-zinc-400">
                        <MarkdownRenderer content={explanation} />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      )}

      {isFullscreen && (
        <div className="md:hidden">
          <AnimatePresence>
            {mobileControlsOpen && (
              <motion.button
                type="button"
                aria-label="Collapse code controls"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setMobileControlsOpen(false)}
                className="fixed inset-0 z-[30] bg-transparent"
              />
            )}
          </AnimatePresence>

          <div className="fixed bottom-5 right-5 z-[40] flex flex-col-reverse items-center gap-3">
            <button
              type="button"
              aria-label={mobileControlsOpen ? 'Hide code controls' : 'Show code controls'}
              onClick={() => setMobileControlsOpen((open) => !open)}
              className={`flex h-14 w-14 items-center justify-center rounded-full border text-sm font-black shadow-[0_18px_50px_rgba(0,0,0,0.45)] backdrop-blur-xl transition duration-300 active:scale-95 ${
                mobileControlsOpen
                  ? 'border-[#efff55]/55 bg-[#d8ef42] text-black'
                  : 'border-[#efff55]/35 bg-[#efff55] text-black hover:border-[#efff55]/55 hover:bg-[#e7fb4f]'
              }`}
            >
              <Menu className="h-6 w-6" />
            </button>

            <AnimatePresence>
              {mobileControlsOpen && (
                <>
                  <motion.button
                    type="button"
                    aria-label="Exit fullscreen"
                    initial={{ opacity: 0, y: 18, scale: 0.82 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.82 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28 }}
                    onClick={() => {
                      setIsFullscreen(false);
                      setMobileControlsOpen(false);
                    }}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.14] bg-[#2b2b2b]/94 text-zinc-100 shadow-[0_14px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:bg-[#343434] active:scale-95"
                  >
                    <X className="h-5 w-5" />
                  </motion.button>

                  <motion.button
                    type="button"
                    aria-label="Increase font size"
                    initial={{ opacity: 0, y: 18, scale: 0.82 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.82 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28, delay: 0.035 }}
                    onClick={() => setFontSize(prev => Math.min(24, prev + 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.14] bg-[#2b2b2b]/94 text-sm font-black text-zinc-100 shadow-[0_14px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:bg-[#343434] active:scale-95"
                  >
                    A+
                  </motion.button>

                  <motion.button
                    type="button"
                    aria-label="Decrease font size"
                    initial={{ opacity: 0, y: 18, scale: 0.82 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 18, scale: 0.82 }}
                    transition={{ type: 'spring', stiffness: 420, damping: 28, delay: 0.07 }}
                    onClick={() => setFontSize(prev => Math.max(10, prev - 1))}
                    className="flex h-12 w-12 items-center justify-center rounded-full border border-white/[0.14] bg-[#2b2b2b]/94 text-sm font-black text-zinc-100 shadow-[0_14px_36px_rgba(0,0,0,0.35)] backdrop-blur-xl transition hover:bg-[#343434] active:scale-95"
                  >
                    A-
                  </motion.button>
                </>
              )}
            </AnimatePresence>
          </div>
        </div>
      )}
    </div>
  );

  if (isFullscreen) {
    return createPortal(workspaceContent, document.body);
  }

  return workspaceContent;
};


// ── CODE CHALLENGE BLOCK (FALLBACK FOR MCQ / GUESS OUTPUT) ──
const CodeChallengeBlock = ({ challenge, language, onWorkspaceUpdate }) => {
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [showHint, setShowHint] = useState(false);
  
  // MCQ specific state
  const [selectedOption, setSelectedOption] = useState(null);

  if (!challenge) return null;

  // Direct to PremiumCodeWorkspace for interactive-code challenges
  if (challenge.type === 'interactive-code') {
    return (
      <PremiumCodeWorkspace
        blockId={challenge.blockId}
        title={challenge.title || 'Coding Challenge'}
        originalCode={challenge.codeTemplate}
        language={challenge.language || language || 'python'}
        expectedAnswer={challenge.expectedAnswer}
        explanation={challenge.explanation}
        hint={challenge.hint}
        onWorkspaceUpdate={onWorkspaceUpdate}
        readOnly={false}
        question={challenge.question}
      />
    );
  }

  const isMcq = challenge.type === 'mcq';

  if (isMcq) {
    const options = challenge.options || [];
    const expected = (challenge.expectedAnswer || '').trim();
    const isAnswered = selectedOption !== null;

    const handleOptionSelect = (option) => {
      if (isAnswered) return;
      setSelectedOption(option);
      if (option.trim() === expected) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    };

    const handleReset = () => {
      setSelectedOption(null);
      setStatus('idle');
      setShowHint(false);
    };

    return (
      <div className="my-6 overflow-hidden rounded-3xl border border-white/[0.09] bg-[#242424] shadow-[0_22px_55px_rgba(0,0,0,0.22)] pdf-no-break">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.075] bg-white/[0.035] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#efff55]/10 text-[#efff55]">
              <HelpCircle className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Concept Checkpoint
            </span>
          </div>
          {challenge.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.08] bg-[#2c2c2c] px-3 py-1.5 text-[11px] font-bold text-zinc-300 transition duration-200 hover:border-white/20 hover:bg-[#333333] hover:text-white"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {showHint ? 'Hide Hint' : 'Hint'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 md:p-6">
          {/* Question */}
          <h3 className="text-lg font-black text-white leading-snug">
            <MarkdownRenderer content={challenge.question || ''} />
          </h3>

          {/* Hint */}
          <AnimatePresence>
            {showHint && challenge.hint && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden rounded-2xl border border-[#FF9F1C]/20 bg-[#FF9F1C]/5 px-4 py-3 text-xs leading-relaxed text-[#ffd08a]"
              >
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#FF9F1C]" />
                  <p className="font-semibold">{challenge.hint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Options Grid */}
          <div className="mt-6 grid gap-3">
            {options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectOption = option.trim() === expected;
              
              let optionStyle = 'border-white/[0.09] bg-[#2a2a2a] text-zinc-200 hover:bg-[#303030] hover:border-white/[0.18] hover:text-white hover:shadow-[0_14px_32px_rgba(0,0,0,0.16)]';
              let icon = null;

              if (isAnswered) {
                if (isSelected) {
                  if (isCorrectOption) {
                    optionStyle = 'border-emerald-400/35 bg-emerald-500/[0.08] text-emerald-200 shadow-[0_0_20px_rgba(16,185,129,0.05)]';
                    icon = <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />;
                  } else {
                    optionStyle = 'border-rose-400/35 bg-rose-500/[0.08] text-rose-200';
                    icon = <XCircle className="h-5 w-5 shrink-0 text-rose-400" />;
                  }
                } else if (isCorrectOption) {
                  optionStyle = 'border-emerald-400/25 bg-emerald-500/[0.055] text-emerald-300';
                  icon = <Check className="h-4 w-4 shrink-0 text-emerald-500" />;
                } else {
                  optionStyle = 'border-white/[0.055] bg-[#202020] text-zinc-500 cursor-not-allowed';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isAnswered}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left text-sm font-black transition duration-200 ${optionStyle}`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black border ${
                      isAnswered
                        ? isCorrectOption
                          ? 'border-emerald-500 bg-emerald-500 text-black'
                          : isSelected
                            ? 'border-rose-500 bg-rose-500 text-black'
                            : 'border-white/10 text-zinc-600'
                        : 'border-white/20 text-zinc-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Answer Feedback & Explanation */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="mt-6 border-t border-white/[0.06] pt-6"
              >
                <div className={`rounded-2xl border p-5 ${
                  status === 'success'
                    ? 'border-emerald-500/10 bg-emerald-500/[0.02] text-zinc-300'
                    : 'border-zinc-800 bg-white/[0.01] text-zinc-300'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      status === 'success' ? 'text-emerald-400' : 'text-zinc-400'
                    }`}>
                      {status === 'success' ? '🎉 Correct Answer!' : '💡 Concept Review'}
                    </span>
                  </div>

                  {challenge.explanation && (
                    <div className="text-sm leading-relaxed text-zinc-400">
                      <MarkdownRenderer content={challenge.explanation} />
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-white hover:text-black hover:border-transparent transition duration-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset & Try Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Original Coding Challenge logic
  if (!challenge.codeTemplate) return null;

  const isFillInBlank = challenge.type === 'fill-in-the-blank';
  const expected = (challenge.expectedAnswer || '').trim();

  const handleCheck = () => {
    if (!userInput.trim()) return;
    
    if (userInput.trim() === expected) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-sm pdf-no-break">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isFillInBlank ? 'Fill in the Blank' : 'Guess the Output'}
          </span>
        </div>
        {challenge.hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {showHint ? 'Hide Hint' : 'Hint'}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        {/* Question */}
        <p className="mb-4 text-sm text-slate-300">
          <MarkdownRenderer content={challenge.question || ''} />
        </p>

        {/* Code Snippet */}
        <div className="relative mb-5 rounded-xl bg-[#0f111a] p-4 font-mono text-sm text-slate-300">
          <pre className="whitespace-pre-wrap leading-relaxed">
            {challenge.codeTemplate.split('___').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="mx-1 inline-block min-w-[3ch] border-b-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-1 text-emerald-300">
                    {status === 'success' ? expected : (isFillInBlank ? '___' : '')}
                  </span>
                )}
              </React.Fragment>
            ))}
          </pre>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {showHint && challenge.hint && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-5 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p>{challenge.hint}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input & Action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <ChevronRight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                setStatus('idle');
              }}
              onKeyDown={handleKeyDown}
              disabled={status === 'success'}
              placeholder={isFillInBlank ? "Type the missing code..." : "Type the expected output..."}
              className={`w-full rounded-xl border bg-slate-950 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:ring-2 ${
                status === 'error'
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                  : status === 'success'
                  ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-300'
                  : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>
          
          <button
            onClick={handleCheck}
            disabled={!userInput.trim() || status === 'success'}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              status === 'success'
                ? 'bg-emerald-500 text-slate-900'
                : 'bg-white text-slate-900 hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100'
            }`}
          >
            {status === 'success' ? (
              <>
                <Check className="h-4 w-4" /> Correct
              </>
            ) : (
              'Check Answer'
            )}
          </button>
        </div>

        {/* Error Feedback */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-red-400"
            >
              <XCircle className="h-4 w-4" />
              Not quite right. Try again or check the hint.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CodeChallengeBlock;
