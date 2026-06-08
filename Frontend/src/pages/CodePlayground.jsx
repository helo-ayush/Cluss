import React, { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useUser, useAuth } from '@clerk/clerk-react';
import Editor, { DiffEditor } from '@monaco-editor/react';
import { 
  Play, RotateCcw, ChevronLeft, ChevronRight, ChevronDown, ChevronUp, Maximize2, Minimize2, Send, Loader2, X, Check, AlertCircle, Terminal
} from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import MarkdownRenderer from '../components/MarkdownRenderer';
import { useUsage } from '../contexts/UsageContext';
import { motion, AnimatePresence } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const DEFAULT_TEMPLATES = {
  python: `def main():\n    print("Hello from Python!")\n\nif __name__ == "__main__":\n    main()`,
  javascript: `console.log("Hello from JavaScript!");`,
  typescript: `const greeting: string = "Hello from TypeScript!";\nconsole.log(greeting);`,
  cpp: `#include <iostream>\n\nint main() {\n    std::cout << "Hello from C++!" << std::endl;\n    return 0;\n}`,
  c: `#include <stdio.h>\n\nint main() {\n    printf("Hello from C!\\n");\n    return 0;\n}`,
  java: `public class Main {\n    public static void main(String[] args) {\n        System.out.println("Hello from Java!");\n    }\n}`,
  go: `package main\n\nimport "fmt"\n\nfunc main() {\n    fmt.Println("Hello from Go!")\n}`,
  rust: `fn main() {\n    println!("Hello from Rust!");\n}`,
  ruby: `puts "Hello from Ruby!"`,
  php: `<?php\necho "Hello from PHP!\\n";`,
  bash: `echo "Hello from Bash!"`,
  perl: `print "Hello from Perl!\\n";`,
  lua: `print("Hello from Lua!")`,
  r: `cat("Hello from R!\\n")`,
  haskell: `main = putStrLn "Hello from Haskell!"`,
  csharp: `using System;\n\nclass Program {\n    static void Main() {\n        Console.WriteLine("Hello from C#!");\n    }\n}`,
  lisp: `(format t "Hello from Lisp!~%")`,
  pascal: `program Hello;\nbegin\n    writeln('Hello from Pascal!');\nend.`,
  sql: `CREATE TABLE users (id INTEGER PRIMARY KEY, name TEXT);\nINSERT INTO users (name) VALUES ('Alice'), ('Bob');\nSELECT * FROM users;`
};

const LANGUAGES = [
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

export default function CodePlayground() {
  const { user } = useUser();
  const { getToken } = useAuth();
  const { usageData, fetchUsage } = useUsage();

  const [language, setLanguage] = useState('javascript');
  const [code, setCode] = useState(DEFAULT_TEMPLATES.javascript);
  const [running, setRunning] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [terminalOutput, setTerminalOutput] = useState(null);
  const [status, setStatus] = useState('idle'); // 'idle' | 'running' | 'success' | 'error'
  const [hasRun, setHasRun] = useState(false);
  const [fontSize, setFontSize] = useState(13);
  const [consoleTab, setConsoleTab] = useState('output'); // 'output' | 'input'
  const [customInput, setCustomInput] = useState('');

  // Layout Controls
  const [isPlaygroundFullscreen, setIsPlaygroundFullscreen] = useState(false);
  const [consoleMinimized, setConsoleMinimized] = useState(false);

  // Chat Panel State
  const [chatCollapsed, setChatCollapsed] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: "Welcome to the Cluss Code Playground! 🚀\nSelect a language, write your code, and run it directly. Toggle **Agent Mode** on the right if you'd like me to edit or write code directly in the editor."
    }
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatMode, setChatMode] = useState('chat'); // 'chat' | 'agent'
  const [sending, setSending] = useState(false);
  const chatContainerRef = useRef(null);

  // Language Dropdown Custom State
  const [isLangDropdownOpen, setIsLangDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);
  const abortControllerRef = useRef(null);

  // Custom Modal State
  const [modalConfig, setModalConfig] = useState(null); // { title, message, onConfirm }

  // Diff Editor State
  const [editorMode, setEditorMode] = useState('edit'); // 'edit' | 'diff'
  const [proposedCode, setProposedCode] = useState('');

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsLangDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleStopExecution = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setRunning(false);
      setStatus('idle');
      setTerminalOutput({ stderr: "Execution cancelled by user.", exit_code: -1 });
    }
  };

  // Rate limit cooldown timer
  useEffect(() => {
    if (cooldown > 0) {
      const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [cooldown]);

  // Load language template on change
  const handleLanguageChange = (newLang) => {
    setLanguage(newLang);
    setCode(DEFAULT_TEMPLATES[newLang] || '');
    setTerminalOutput(null);
    setStatus('idle');
    setHasRun(false);
    setEditorMode('edit');
    setProposedCode('');
  };

  // Run Code logic
  const handleRunCode = async () => {
    if (cooldown > 0 || running) return;
    
    const controller = new AbortController();
    abortControllerRef.current = controller;

    setRunning(true);
    setStatus('running');
    setHasRun(true);
    setConsoleMinimized(false);
    setConsoleTab('output');

    try {
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/compiler/run`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ code, language, stdin: customInput }),
        signal: controller.signal
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Error executing code');

      const runResult = data.result || {};
      setTerminalOutput(runResult);
      setStatus(runResult.exit_code === 0 ? 'success' : 'error');
      setCooldown(10); // 10s rate limit cooldown
    } catch (err) {
      if (err.name === 'AbortError') return;
      setTerminalOutput({ stderr: `System Error: ${err.message}`, exit_code: -1 });
      setStatus('error');
    } finally {
      setRunning(false);
      abortControllerRef.current = null;
    }
  };

  const handleResetCode = () => {
    setModalConfig({
      title: 'Reset Editor',
      message: 'Are you sure you want to reset the editor to the default template? This will discard your current edits.',
      onConfirm: () => {
        setCode(DEFAULT_TEMPLATES[language] || '');
        setTerminalOutput(null);
        setStatus('idle');
        setHasRun(false);
        setEditorMode('edit');
        setProposedCode('');
      }
    });
  };

  // helper to extract code block from markdown
  const extractCodeFromMarkdown = (text, lang) => {
    const cleanLang = (lang || '').toLowerCase();
    // try matching exact language name first (e.g. ```javascript ... ```)
    let regex = new RegExp(`\`\`\`(?:${cleanLang})?\\n([\\s\\S]*?)\\n\`\`\`,?`, 'i');
    let match = text.match(regex);
    if (!match) {
      // fallback to any standard code block
      regex = /```(?:[a-zA-Z0-9+#-]+)?\n([\s\S]*?)\n```/;
      match = text.match(regex);
    }
    return match ? match[1].trim() : null;
  };

  // Send message to AI Assistant
  const handleSendMessage = async () => {
    const message = chatInput.trim();
    if (!message || sending || !user?.id) return;

    setSending(true);
    setChatInput('');

    const userMessage = { role: 'user', text: message };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);

    try {
      const res = await fetch(`${API_BASE}/api/playground/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          message,
          history: messages,
          code,
          language,
          mode: chatMode
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'AI failed to reply');

      // Parse code block if in agent mode
      let extracted = null;
      if (chatMode === 'agent') {
        extracted = extractCodeFromMarkdown(data.reply, language);
      }

      setMessages((prev) => [
        ...prev,
        {
          role: 'assistant',
          text: data.reply,
          proposedCode: extracted
        }
      ]);

      // Update credit balance live
      fetchUsage();

      if (chatMode === 'agent' && extracted) {
        setProposedCode(extracted);
        setEditorMode('diff');
      }
    } catch (err) {
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', text: `I ran into an issue connecting to the AI: ${err.message}` }
      ]);
    } finally {
      setSending(false);
    }
  };

  // Scroll to bottom of chat
  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
  }, [messages, sending]);

  const playgroundContent = (
    <motion.div 
      key={isPlaygroundFullscreen ? 'fullscreen' : 'normal'}
      initial={{ opacity: 0, scale: 0.99 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className={`font-nunito text-white ${
        isPlaygroundFullscreen
          ? 'fixed inset-0 z-[200] flex h-screen w-screen gap-4 p-4 bg-[#080808]'
          : 'flex h-full gap-4 overflow-hidden relative'
      }`}
    >
      
      {/* Left Column: Editor & Console */}
      <div className="flex-1 flex flex-col min-w-0 rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] overflow-hidden shadow-lg">
          
          {/* Editor Sub-Header */}
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6">
            <div className="flex items-center gap-4">
              <span className="text-sm font-bold text-zinc-400">Language:</span>
              
              {/* Premium Custom Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  type="button"
                  onClick={() => setIsLangDropdownOpen(!isLangDropdownOpen)}
                  className="flex items-center gap-2.5 rounded-xl border border-white/[0.08] bg-[#151515] px-4 py-2 text-xs font-black uppercase tracking-wider text-zinc-300 transition hover:border-[#efff55]/30"
                >
                  <span>{LANGUAGES.find(l => l.value === language)?.label || language}</span>
                  <ChevronDown className={`h-3.5 w-3.5 text-zinc-500 transition-transform duration-200 ${isLangDropdownOpen ? 'rotate-180' : ''}`} />
                </button>
                
                <AnimatePresence>
                  {isLangDropdownOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 8 }}
                      transition={{ duration: 0.15 }}
                      className="absolute left-0 mt-2 z-50 w-52 max-h-60 overflow-y-auto rounded-2xl border border-white/[0.08] bg-[#151515]/95 backdrop-blur-md p-1.5 shadow-2xl custom-scroll"
                    >
                      {LANGUAGES.map((lang) => (
                        <button
                          key={lang.value}
                          type="button"
                          onClick={() => {
                            setIsLangDropdownOpen(false);
                            const hasModified = code !== DEFAULT_TEMPLATES[language];
                            if (hasModified) {
                              setModalConfig({
                                title: 'Switch Language',
                                message: `Changing the language to ${lang.label} will reset all your current code in the editor. Are you sure you want to proceed?`,
                                onConfirm: () => handleLanguageChange(lang.value)
                              });
                            } else {
                              handleLanguageChange(lang.value);
                            }
                          }}
                          className={`flex w-full items-center rounded-xl px-3 py-2 text-xs font-bold transition ${
                            language === lang.value
                              ? 'bg-[#efff55] text-black shadow-md'
                              : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
                          }`}
                        >
                          {lang.label}
                        </button>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              
              {editorMode === 'diff' && (
                <span className="rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20 px-2.5 py-1 text-[10px] font-black uppercase tracking-wider">
                  Reviewing AI Changes
                </span>
              )}
            </div>

            <div className="flex items-center gap-3">
              {editorMode === 'diff' ? (
                <>
                  <button
                    onClick={() => {
                      setEditorMode('edit');
                      setProposedCode('');
                    }}
                    className="flex h-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] px-4 text-xs font-bold text-zinc-400 hover:text-white transition"
                  >
                    Reject Changes
                  </button>
                  <button
                    onClick={() => {
                      setCode(proposedCode);
                      setProposedCode('');
                      setEditorMode('edit');
                      setStatus('idle');
                    }}
                    className="flex h-9 items-center justify-center rounded-full bg-[#efff55] px-4 text-xs font-bold text-black hover:bg-[#efff55]/90 transition"
                  >
                    Accept Changes
                  </button>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={() => setFontSize(Math.max(fontSize - 1, 10))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-[#1e1e1e] text-xs font-black text-zinc-400 hover:border-white/20 hover:text-white transition"
                    title="Decrease Font Size"
                  >
                    A-
                  </button>
                  <button
                    type="button"
                    onClick={() => setFontSize(Math.min(fontSize + 1, 20))}
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-[#1e1e1e] text-xs font-black text-zinc-400 hover:border-white/20 hover:text-white transition"
                    title="Increase Font Size"
                  >
                    A+
                  </button>
                  <button
                    onClick={handleResetCode}
                    title="Reset Editor"
                    className="flex h-9 items-center justify-center rounded-full border border-white/[0.06] bg-[#1e1e1e] px-4 text-xs font-bold text-zinc-400 hover:border-white/20 hover:text-white transition"
                  >
                    Reset
                  </button>
                  {running ? (
                    <button
                      onClick={handleStopExecution}
                      className="flex h-9 items-center gap-1.5 rounded-full bg-rose-600 hover:bg-rose-500 text-white hover:scale-[1.02] active:scale-[0.98] px-5 text-xs font-bold transition animate-pulse"
                    >
                      <X className="h-3.5 w-3.5" />
                      <span>Stop</span>
                    </button>
                  ) : (
                    <button
                      onClick={handleRunCode}
                      disabled={cooldown > 0}
                      className="flex h-9 items-center gap-1.5 rounded-full bg-[#efff55] text-black hover:bg-[#efff55]/90 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 px-5 text-xs font-bold transition"
                    >
                      <Play className="h-3.5 w-3.5" />
                      <span>
                        {cooldown > 0 ? `Cooldown (${cooldown}s)` : 'Run Code'}
                      </span>
                    </button>
                  )}
                </>
              )}

              {/* Fullscreen Toggle Button */}
              <button
                type="button"
                onClick={() => setIsPlaygroundFullscreen(!isPlaygroundFullscreen)}
                className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/5 text-zinc-400 hover:text-white transition"
                title={isPlaygroundFullscreen ? "Exit Fullscreen" : "Fullscreen Workspace"}
              >
                {isPlaygroundFullscreen ? (
                  <Minimize2 className="h-4.5 w-4.5" />
                ) : (
                  <Maximize2 className="h-4.5 w-4.5" />
                )}
              </button>
            </div>
          </div>

          {/* Monaco Editor Container */}
          <div className="flex-1 min-h-0 bg-[#121212] relative">
            {editorMode === 'diff' ? (
              <DiffEditor
                height="100%"
                language={language}
                theme="vs-dark"
                original={code}
                modified={proposedCode}
                options={{
                  readOnly: true,
                  renderSideBySide: false,
                  minimap: { enabled: false },
                  fontSize: fontSize,
                  fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                  scrollBeyondLastLine: false,
                  automaticLayout: true
                }}
              />
            ) : (
              <Editor
                height="100%"
                language={language}
                theme="vs-dark"
                value={code}
                onChange={(val) => {
                  setCode(val || '');
                  if (status !== 'idle') setStatus('idle');
                }}
                options={{
                  minimap: { enabled: false },
                  fontSize: fontSize,
                  fontFamily: "'Fira Code', 'Courier New', Courier, monospace",
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  scrollbar: {
                    vertical: 'auto',
                    horizontal: 'auto'
                  }
                }}
              />
            )}
          </div>

          {/* Console / Output Panel */}
          <div className={`shrink-0 flex flex-col border-t border-white/[0.06] bg-[#141414] transition-all duration-300 ${
            consoleMinimized ? 'h-10' : 'h-56'
          }`}>
            <div 
              onClick={() => {
                if (consoleMinimized) setConsoleMinimized(false);
              }}
              className={`flex h-10 items-center justify-between border-b border-white/[0.06] bg-[#181818] px-5 text-zinc-400 ${
                consoleMinimized ? 'cursor-pointer hover:bg-white/[0.02] transition-colors' : ''
              }`}
            >
              <div className="flex items-center gap-4 h-full">
                <Terminal className="h-4 w-4 text-zinc-500" />
                {!consoleMinimized ? (
                  <div className="flex h-full items-center">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConsoleTab('output');
                      }}
                      className={`h-full px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        consoleTab === 'output'
                          ? 'border-[#efff55] text-white'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Output
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setConsoleTab('input');
                      }}
                      className={`h-full px-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                        consoleTab === 'input'
                          ? 'border-[#efff55] text-white'
                          : 'border-transparent text-zinc-500 hover:text-zinc-300'
                      }`}
                    >
                      Custom Input (stdin)
                    </button>
                  </div>
                ) : (
                  <span className="text-xs font-bold uppercase tracking-wider">Console</span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {!consoleMinimized && hasRun && terminalOutput && !running && terminalOutput.execution_time !== undefined && (
                  <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-wider">
                    Time: {terminalOutput.execution_time}s
                  </span>
                )}
                {!consoleMinimized && terminalOutput && (
                  <button 
                    onClick={() => {
                      setTerminalOutput(null);
                      setHasRun(false);
                      setStatus('idle');
                    }}
                    className="text-[10px] font-bold uppercase tracking-wider text-zinc-500 hover:text-white transition"
                  >
                    Clear Output
                  </button>
                )}
                
                {/* Console Toggle Minimize Button */}
                <button
                  type="button"
                  onClick={() => setConsoleMinimized(!consoleMinimized)}
                  className="p-1 rounded hover:bg-white/5 text-zinc-500 hover:text-white transition"
                  title={consoleMinimized ? "Expand Console" : "Collapse Console"}
                >
                  {consoleMinimized ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
            </div>

            {!consoleMinimized && (
              <>
                <div className="flex-1 overflow-y-auto p-4 font-mono text-xs text-zinc-300 custom-scroll">
                  {consoleTab === 'input' ? (
                    <textarea
                      value={customInput}
                      onChange={(e) => setCustomInput(e.target.value)}
                      placeholder="Enter program input here (will be passed to stdin when running)..."
                      className="w-full h-full min-h-[80px] resize-none bg-[#121212] border border-white/[0.06] rounded-xl p-3 text-xs font-mono text-zinc-300 placeholder:text-zinc-600 focus:outline-none focus:border-[#efff55]/30 focus:ring-1 focus:ring-[#efff55]/30 custom-scroll"
                    />
                  ) : running ? (
                    <div className="flex h-full flex-col items-center justify-center space-y-2 py-4">
                      <Loader2 className="h-4 w-4 animate-spin text-[#efff55]" />
                      <span className="text-[9px] font-bold tracking-widest text-zinc-500 uppercase animate-pulse">Running Code...</span>
                    </div>
                  ) : hasRun && terminalOutput ? (
                    <div className="space-y-1">
                      {terminalOutput.stdout && (
                        <div className="whitespace-pre-wrap leading-relaxed text-emerald-300">{terminalOutput.stdout}</div>
                      )}
                      {terminalOutput.stderr && (
                        <div className="whitespace-pre-wrap leading-relaxed text-rose-400 font-bold">{terminalOutput.stderr}</div>
                      )}
                      {!terminalOutput.stdout && !terminalOutput.stderr && (
                        <div className="text-zinc-500 italic">[Program exited with code {terminalOutput.exit_code}]</div>
                      )}
                    </div>
                  ) : (
                    <div className="flex h-full items-center text-zinc-500 italic">
                      Run your code to see console output, compilation errors, and execution timings here.
                    </div>
                  )}
                </div>

                {/* Console Status Bar */}
                <div className="flex h-8 items-center justify-between border-t border-white/[0.06] bg-[#161616] px-5 text-[10px] font-bold text-zinc-500">
                  <div className="flex items-center gap-2">
                    <span>Status:</span>
                    <span className={`px-1.5 py-0.5 rounded text-[9px] font-black tracking-wider ${
                      status === 'success' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' :
                      status === 'error' ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20' :
                      status === 'running' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 
                      'bg-zinc-800/40 text-zinc-500 border border-zinc-800'
                    }`}>
                      {status === 'success' ? 'SUCCESS' :
                       status === 'error' ? 'FAILED' :
                       status === 'running' ? 'RUNNING' : 'IDLE'}
                    </span>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Right Column: AI Assistant (Collapsible) */}
        <div className={`transition-all duration-300 ease-in-out shrink-0 overflow-hidden flex flex-col border border-white/[0.06] bg-[#1b1b1b] rounded-[2rem] shadow-lg ${
          chatCollapsed ? 'w-10' : 'w-[26rem]'
        }`}>
            {chatCollapsed ? (
              // Collapsed Chat Panel
              <div 
                onClick={() => setChatCollapsed(false)}
                className="flex h-full flex-col items-center py-6 gap-6 bg-white/[0.01] hover:bg-white/[0.03] transition-colors cursor-pointer select-none"
                title="Expand AI Assistant"
              >
                <button className="text-zinc-400 hover:text-white transition">
                  <ChevronLeft className="h-4.5 w-4.5" />
                </button>
                <span className="text-[10px] font-black uppercase tracking-[0.25em] text-zinc-500 [writing-mode:vertical-lr]">
                  AI Assistant
                </span>
              </div>
            ) : (
              // Expanded Chat Panel
              <div className="flex flex-col h-full min-h-0">
                
                {/* Chat Panel Header */}
                <div className="flex h-14 shrink-0 items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-6">
                  <div className="flex items-center gap-3">
                    <button 
                      onClick={() => setChatCollapsed(true)} 
                      className="p-1.5 rounded-lg border border-white/[0.06] bg-white/[0.02] hover:bg-white/5 text-zinc-400 hover:text-white transition"
                      title="Minimize Chat"
                    >
                      <ChevronRight className="h-4 w-4" />
                    </button>
                    
                    {/* Capsule Switch Mode Toggle */}
                    <div className="flex bg-[#121212] p-1 rounded-full border border-white/[0.06]">
                      <button
                        onClick={() => setChatMode('chat')}
                        className={`px-4 py-1 text-[11px] font-bold rounded-full transition ${
                          chatMode === 'chat' 
                            ? 'bg-[#efff55] text-black shadow-md' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Chat Mode
                      </button>
                      <button
                        onClick={() => setChatMode('agent')}
                        className={`px-4 py-1 text-[11px] font-bold rounded-full transition ${
                          chatMode === 'agent' 
                            ? 'bg-[#efff55] text-black shadow-md' 
                            : 'text-zinc-400 hover:text-white'
                        }`}
                      >
                        Agent Mode
                      </button>
                    </div>
                  </div>
                </div>

                {/* Chat Message Panel */}
                <div ref={chatContainerRef} className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-5">
                  {messages.map((message, idx) => (
                    <div key={`${message.role}-${idx}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-[92%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
                        message.role === 'user'
                          ? 'bg-[#2a2a2a] text-white shadow-md rounded-br-sm font-semibold'
                          : 'border border-white/[0.06] bg-white/[0.03] text-zinc-300 shadow-sm rounded-bl-sm'
                      }`}>
                        {message.role === 'assistant' ? (
                          <div className="space-y-4">
                            <MarkdownRenderer content={message.text} />
                            {message.proposedCode && (
                              <div className="pt-2">
                                <button
                                  onClick={() => {
                                    setProposedCode(message.proposedCode);
                                    setEditorMode('diff');
                                  }}
                                  className="flex items-center gap-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1.5 text-xs font-bold text-amber-400 transition hover:bg-amber-500/20 active:scale-95"
                                >
                                  <AlertCircle className="h-3.5 w-3.5" />
                                  View Proposed Changes
                                </button>
                              </div>
                            )}
                          </div>
                        ) : (
                          <p>{message.text}</p>
                        )}
                      </div>
                    </div>
                  ))}
                  
                  {sending && (
                    <div className="flex justify-start">
                      <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-xs font-bold text-slate-400">
                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[#efff55]" />
                        <span>Cluss is thinking...</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Chat Input Area */}
                <div className="border-t border-white/[0.06] bg-transparent p-4">
                  <div className="flex items-center gap-3 rounded-[2rem] border border-white/[0.06] bg-[#121212] p-1.5 shadow-sm transition-all focus-within:border-[#efff55]/30 focus-within:bg-white/[0.02]">
                    <textarea
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder={
                        chatMode === 'agent' 
                          ? 'Tell the AI agent what to code/modify...' 
                          : 'Ask a coding question or explain concepts...'
                      }
                      rows={1}
                      className="h-10 flex-1 resize-none overflow-hidden bg-transparent px-4 py-2 text-sm font-medium text-white outline-none placeholder:text-white/30 custom-scroll"
                    />
                    <button
                      type="button"
                      disabled={sending || !chatInput.trim()}
                      onClick={handleSendMessage}
                      className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#efff55] text-black shadow-sm transition hover:scale-105 disabled:bg-zinc-800 disabled:text-white/20 disabled:scale-100"
                    >
                      <Send className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

              </div>
            )}
        </div>

      </motion.div>
    );

    return (
      <DashboardShell title="Code Playground" showCreate={false} disableDefaultPadding={true} contentClassName="px-4 pt-[6.5rem] pb-4 sm:px-6 lg:px-8 h-screen overflow-hidden">
        {isPlaygroundFullscreen ? createPortal(playgroundContent, document.body) : playgroundContent}

        {/* Premium Glassmorphism Custom Modal (Portal-rendered at root level) */}
        {createPortal(
          <AnimatePresence>
            {modalConfig && (
              <div className="fixed inset-0 z-[300] flex items-center justify-center bg-black/60 backdrop-blur-sm">
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="w-[28rem] rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 shadow-2xl text-white font-nunito"
                >
                  <div className="flex items-center gap-3 text-amber-400 mb-3">
                    <AlertCircle className="h-5 w-5" />
                    <h3 className="text-base font-black uppercase tracking-wider text-white">{modalConfig.title}</h3>
                  </div>
                  <p className="text-sm leading-relaxed text-zinc-300 mb-6">{modalConfig.message}</p>
                  <div className="flex justify-end gap-3">
                    <button
                      onClick={() => setModalConfig(null)}
                      className="rounded-full border border-white/[0.06] bg-white/[0.02] px-5 py-2.5 text-xs font-bold text-zinc-400 hover:text-white transition"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={() => {
                        modalConfig.onConfirm();
                        setModalConfig(null);
                      }}
                      className="rounded-full bg-[#efff55] px-5 py-2.5 text-xs font-black text-black hover:bg-[#efff55]/90 transition"
                    >
                      Confirm
                    </button>
                  </div>
                </motion.div>
              </div>
            )}
          </AnimatePresence>,
          document.body
        )}
      </DashboardShell>
    );
  };
