import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Bot,
  CheckCircle2,
  ClipboardList,
  Code,
  Code2,
  Crown,
  Download,
  Eye,
  FileText,
  HelpCircle,
  Layers,
  Lightbulb,
  Loader2,
  Map,
  Megaphone,
  MessageCircle,
  RefreshCcw,
  RotateCcw,
  Send,
  Sparkles,
  WandSparkles,
  X,
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';
import { SignInButton } from '@clerk/clerk-react';
import LoadingScreen from '../components/LoadingScreen';
import CodeChallengeBlock from '../components/CodeChallengeBlock';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const BLOCK_ACTIONS = [
  { key: 'explain-briefly', label: 'Explain deeply', icon: WandSparkles },
  { key: 'simplify', label: 'Simplify', icon: Lightbulb },
  { key: 'give-example', label: 'Give example', icon: FileText },
  { key: 'quiz-me', label: 'Quiz me here', icon: HelpCircle },
];

const quickPrompts = [
  'Explain this like I am brand new.',
  'Give me a real-life example.',
  'Ask me one question to check if I understood.',
];

const LOADING_MESSAGES = [
  'Initializing knowledge engine...',
  'Sourcing academic context...',
  'Structuring core concepts...',
  'Generating expert-level explanations...',
  'Crafting real-world examples...',
  'Assembling visual study blocks...',
  'Optimizing for your learning goal...',
  'Finalizing interactive elements...',
  'Polishing lesson document...',
  'Validating architectural accuracy...',
  'Readying your workspace...',
  'Cross-referencing data points...',
  'Synthesizing deep insights...',
  'Final check of knowledge structure...',
];

function subtopicRef(moduleIndex, subtopicIndex) {
  return `${moduleIndex}:${subtopicIndex}`;
}

function safeBlocks(lessonContent = {}, fallbackTitle = 'Lesson notes') {
  if (Array.isArray(lessonContent.blocks) && lessonContent.blocks.length) {
    return lessonContent.blocks;
  }

  const blocks = [
    lessonContent.overview && {
      blockId: 'legacy-overview',
      type: 'intro',
      title: 'Start here',
      body: lessonContent.overview,
      revisionHistory: [],
    },
    lessonContent.explanation && {
      blockId: 'legacy-explanation',
      type: 'concept',
      title: fallbackTitle,
      body: lessonContent.explanation,
      revisionHistory: [],
    },
    lessonContent.example && {
      blockId: 'legacy-example',
      type: 'example',
      title: 'Example',
      body: lessonContent.example,
      revisionHistory: [],
    },
    lessonContent.summary && {
      blockId: 'legacy-summary',
      type: 'summary',
      title: 'Summary',
      body: lessonContent.summary,
      revisionHistory: [],
    },
  ].filter(Boolean);

  return blocks.length
    ? blocks
    : [{
      blockId: 'empty-lesson',
      type: 'intro',
      title: fallbackTitle,
      body: 'Generate this lesson to turn the topic into structured notes.',
      revisionHistory: [],
    }];
}

function slugify(value) {
  return String(value || 'study-notes')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 70) || 'study-notes';
}

function ToolButton({ icon: Icon, label, onClick, disabled, tone = 'default' }) {
  const toneClass = tone === 'primary'
    ? 'bg-[#111827] text-white shadow-[0_16px_34px_rgba(17,24,39,0.18)] hover:-translate-y-0.5'
    : 'border border-black/5 bg-white/75 text-slate-700 hover:-translate-y-0.5 hover:bg-white';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 opacity-70" />
    </button>
  );
}

function NoteBlock({ block, active, busy, onSelect, onAction, onAsk, onChatTrigger }) {
  const typeConfig = {
    intro: { icon: BookOpen, color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', label: 'Introduction' },
    concept: { icon: Lightbulb, color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200', label: 'Concept' },
    example: { icon: Eye, color: 'text-emerald-700', bg: 'bg-emerald-50', border: 'border-emerald-200', label: 'Example' },
    diagram: { icon: Map, color: 'text-fuchsia-700', bg: 'bg-fuchsia-50', border: 'border-fuchsia-200', label: 'Diagram' },
    code: { icon: Code, color: 'text-slate-700', bg: 'bg-slate-100', border: 'border-slate-300', label: 'Code' },
    callout: { icon: Megaphone, color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', label: 'Important' },
    summary: { icon: Layers, color: 'text-violet-700', bg: 'bg-violet-50', border: 'border-violet-200', label: 'Summary' },
    project: { icon: Crown, color: 'text-yellow-700', bg: 'bg-yellow-50', border: 'border-yellow-200', label: 'Mini-Project' },
    practice: { icon: HelpCircle, color: 'text-rose-700', bg: 'bg-rose-50', border: 'border-rose-200', label: 'Practice' },
  };

  const config = typeConfig[block.type] || typeConfig.concept;
  const TypeIcon = config.icon;
  const history = Array.isArray(block.revisionHistory) ? block.revisionHistory : [];
  
  const [viewIndex, setViewIndex] = useState(history.length);
  
  useEffect(() => {
    setViewIndex(history.length);
  }, [history.length]);
  
  const currentView = viewIndex < history.length ? history[viewIndex] : block;
  const hasMultipleVersions = history.length > 0;

  return (
    <motion.article
      id={`note-block-${block.blockId}`}
      layout
      onClick={() => onSelect(block)}
      tabIndex={0}
      onFocus={() => onSelect(block)}
      className={`group relative overflow-hidden rounded-[2rem] border p-5 outline-none transition md:p-7 ${
        active
          ? 'border-[#4338ca]/30 bg-white shadow-[0_24px_60px_rgba(67,56,202,0.12)]'
          : 'border-black/5 bg-white/72 hover:border-[#4338ca]/18 hover:bg-white'
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${config.bg} ${config.color} ${config.border}`}>
            <TypeIcon className="h-3 w-3" />
            {config.label}
          </span>
          <h2 className="mt-4 break-words font-serif text-3xl font-semibold leading-tight text-slate-950 md:text-4xl">
            {block.title}
          </h2>
        </div>
        <div className={`flex flex-wrap items-center gap-2 transition md:justify-end ${active ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
          <button type="button" onClick={(event) => { event.stopPropagation(); onAsk(block); }} className="rounded-full bg-[#111827] px-3 py-2 text-xs font-bold uppercase tracking-[0.12em] text-white transition hover:-translate-y-0.5">
            Ask AI
          </button>
          {BLOCK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <button
                key={action.key}
                type="button"
                disabled={busy}
                onClick={(event) => {
                  event.stopPropagation();
                  if (action.key === 'explain-briefly') {
                    onAction(block, action.key);
                  } else {
                    let prompt = '';
                    if (action.key === 'simplify') prompt = 'Simplify this block for me.';
                    else if (action.key === 'give-example') prompt = 'Give me a real-life example for this block.';
                    else if (action.key === 'quiz-me') prompt = 'Quiz me on this specific part.';
                    if (onChatTrigger) onChatTrigger(block, prompt);
                  }
                }}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/5 bg-white px-3 py-2 text-xs font-bold text-slate-600 transition hover:bg-slate-50 disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
          {hasMultipleVersions && (
            <div className="inline-flex items-center gap-1 rounded-full border border-black/5 bg-white px-1.5 py-1 text-xs font-bold text-slate-500 shadow-sm" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={viewIndex === 0}
                onClick={() => setViewIndex(prev => prev - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-30 transition"
              >
                &lt;
              </button>
              <span className="min-w-[2.5rem] text-center tracking-widest">{viewIndex + 1}/{history.length + 1}</span>
              <button
                type="button"
                disabled={viewIndex === history.length}
                onClick={() => setViewIndex(prev => prev + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-slate-100 disabled:opacity-30 transition"
              >
                &gt;
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 min-w-0">
        <MarkdownRenderer content={currentView.body || ''} />
      </div>

      {currentView.code && (
        <div className="mt-5 min-w-0 overflow-hidden rounded-2xl shadow-sm">
          <MarkdownRenderer content={`\`\`\`${currentView.language || block.language || ''}\n${currentView.code}\n\`\`\``} />
        </div>
      )}

      {currentView.callout && (
        <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50/70 px-4 py-3 text-sm leading-6 text-amber-800 [&_p]:text-amber-800 [&_p]:mb-0 [&_strong]:text-amber-900">
          <MarkdownRenderer content={currentView.callout.replace(/^>\s*/, '')} />
        </div>
      )}
      {currentView.inlineChallenge && (
        <CodeChallengeBlock challenge={currentView.inlineChallenge} />
      )}

      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-white/70 backdrop-blur-sm z-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#4338ca]" />
        </div>
      )}
    </motion.article>
  );
}

function PracticeDrawer({
  open,
  onClose,
  subtopic,
  mcqAnswers,
  setMcqAnswers,
  writtenAnswers,
  setWrittenAnswers,
  codeAnswers,
  setCodeAnswers,
  submitting,
  onSubmit,
  plan,
  generatingPractice,
  onGeneratePractice,
  currentPracticeIndex,
  setCurrentPracticeIndex,
}) {
  const practices = subtopic?.practices || [];
  const currentPractice = practices[currentPracticeIndex];
  const bundle = currentPractice?.bundle || {};
  const feedback = currentPractice?.state?.feedback;
  const isSubmitted = (currentPractice?.state?.attemptsUsed || 0) > 0;
  const hasTasks = practices.length > 0 && ((bundle.mcqs?.length || 0) + (bundle.written?.length || 0) + (bundle.code?.length || 0) > 0);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1200] flex justify-end course-modal-backdrop"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', stiffness: 190, damping: 24 }}
            className="flex h-full w-full max-w-3xl flex-col overflow-hidden course-modal-panel sm:rounded-l-[2.4rem]"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-5 md:px-7">
              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.22em] text-[#4338ca]">Practice drawer</p>
                <div className="mt-2 flex items-center gap-4">
                  <h2 className="font-serif text-3xl font-semibold text-slate-950">Show what stuck</h2>
                  {practices.length > 0 && (
                    <div className="flex items-center gap-2 rounded-full border border-black/5 bg-slate-50 px-3 py-1">
                      <button onClick={() => setCurrentPracticeIndex(Math.max(0, currentPracticeIndex - 1))} disabled={currentPracticeIndex === 0} className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent">
                        <ArrowLeft className="h-3 w-3" />
                      </button>
                      <span className="text-xs font-bold text-slate-600">Sheet {currentPracticeIndex + 1} of {practices.length}</span>
                      <button onClick={() => setCurrentPracticeIndex(Math.min(practices.length - 1, currentPracticeIndex + 1))} disabled={currentPracticeIndex === practices.length - 1} className="p-1 rounded-full hover:bg-slate-200 disabled:opacity-30 disabled:hover:bg-transparent">
                        <ArrowRight className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
              <button type="button" onClick={onClose} className="flex h-11 w-11 items-center justify-center rounded-full border border-black/5 bg-white text-slate-500">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="modal-scroll min-h-0 flex-1 space-y-6 px-5 py-6 md:px-7">
              {practices.length === 0 && (
                <div className="rounded-[1.8rem] border border-black/5 bg-white/80 p-8 text-center shadow-sm">
                  <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef2ff] text-[#4338ca]">
                    <ClipboardList className="h-7 w-7" />
                  </div>
                  <h3 className="mt-5 font-serif text-2xl font-semibold text-slate-900">Ready to test yourself?</h3>
                  <p className="mx-auto mt-3 max-w-sm text-sm leading-7 text-slate-500">Generate a focused practice sheet based strictly on what you've learned so far in this lesson.</p>
                  <button type="button" onClick={onGeneratePractice} disabled={generatingPractice} className="course-primary-button mx-auto mt-6 justify-center">
                    {generatingPractice ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    {generatingPractice ? 'Generating...' : 'Generate Practice Sheet'}
                    <CreditCost cost={getCostForAction(plan, 'practiceGeneration')} className="ml-1.5" />
                  </button>
                </div>
              )}

              {practices.length > 0 && !hasTasks && (
                <div className="rounded-[1.8rem] border border-black/5 bg-white/80 p-6 text-sm leading-7 text-slate-500">
                  This practice sheet does not have tasks.
                </div>
              )}

              {(bundle.mcqs || []).map((mcq, index) => (
                <section key={`mcq-${index}`} className="rounded-[1.8rem] border border-black/5 bg-white/85 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">MCQ {index + 1}</p>
                  <h3 className="mt-3 text-lg font-bold leading-7 text-slate-900">{mcq.question}</h3>
                  <div className="mt-4 grid gap-3">
                    {(mcq.options || []).map((option, optionIndex) => (
                      <button
                        type="button"
                        key={`${index}-${optionIndex}`}
                        disabled={isSubmitted}
                        onClick={() => setMcqAnswers((prev) => ({ ...prev, [index]: option }))}
                        className={`rounded-2xl border px-4 py-3 text-left text-sm font-semibold transition ${
                          mcqAnswers[index] === option
                            ? 'border-[#4338ca] bg-[#eef2ff] text-[#312e81]'
                            : 'border-black/5 bg-white text-slate-600 hover:bg-slate-50'
                        }`}
                      >
                        {option}
                      </button>
                    ))}
                  </div>
                </section>
              ))}

              {(bundle.written || []).map((question, index) => (
                <section key={`written-${index}`} className="rounded-[1.8rem] border border-black/5 bg-white/85 p-5">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Written {index + 1}</p>
                  <h3 className="mt-3 text-lg font-bold leading-7 text-slate-900">{question.question}</h3>
                  {!!question.rubric?.length && (
                    <div className="mt-3 rounded-2xl bg-slate-50 px-4 py-3 text-sm leading-6 text-slate-500">
                      Look for: {question.rubric.join(', ')}
                    </div>
                  )}
                  <textarea
                    value={writtenAnswers[index] || ''}
                    disabled={isSubmitted}
                    onChange={(event) => setWrittenAnswers((prev) => ({ ...prev, [index]: event.target.value }))}
                    placeholder="Write your answer here..."
                    className="mt-4 min-h-32 w-full resize-y rounded-2xl border border-black/5 bg-white px-4 py-3 text-sm outline-none focus:border-[#4338ca]/40"
                  />
                </section>
              ))}

              {(bundle.code || []).map((task, index) => (
                <section key={`code-${index}`} className="rounded-[1.8rem] border border-black/5 bg-white/85 p-5">
                  <div className="flex flex-wrap items-center gap-3">
                    <p className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400">Code {index + 1}</p>
                    {task.language && <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-bold text-slate-600">{task.language}</span>}
                  </div>
                  <h3 className="mt-3 text-lg font-bold leading-7 text-slate-900">{task.prompt}</h3>
                  {task.starterCode && (
                    <div className="mt-4 overflow-hidden rounded-2xl">
                      <MarkdownRenderer content={`\`\`\`${task.language || ''}\n${task.starterCode}\n\`\`\``} />
                    </div>
                  )}
                  <textarea
                    value={codeAnswers[index] || ''}
                    disabled={isSubmitted}
                    onChange={(event) => setCodeAnswers((prev) => ({ ...prev, [index]: event.target.value }))}
                    placeholder="Paste or write your solution here..."
                    className="mt-4 min-h-40 w-full resize-y rounded-2xl border border-black/5 bg-[#111318] px-4 py-3 font-mono text-sm text-slate-100 outline-none focus:border-[#4338ca]/60"
                  />
                </section>
              ))}



              {feedback && (
                <section className="rounded-[1.8rem] border border-emerald-200 bg-emerald-50/80 p-5 text-emerald-900">
                  <p className="text-[11px] font-black uppercase tracking-[0.18em]">Latest feedback</p>
                  <h3 className="mt-3 text-2xl font-black">{feedback.score || 0}%</h3>
                  <div className="mt-3 text-sm leading-7">
                    <MarkdownRenderer content={feedback.coaching || feedback.overallFeedback || feedback.summary || ''} />
                  </div>
                </section>
              )}
            </div>

            <div className="border-t border-black/5 bg-white/80 px-5 py-4 md:px-7">
              {practices.length > 0 && !isSubmitted ? (
                <button type="button" disabled={submitting || !hasTasks} onClick={onSubmit} className="course-primary-button w-full justify-center">
                  {submitting ? 'Checking your work...' : 'Submit practice'}
                </button>
              ) : practices.length > 0 && isSubmitted ? (
                <button type="button" disabled={generatingPractice} onClick={onGeneratePractice} className="course-outline-button w-full justify-center border-slate-300">
                  {generatingPractice ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
                  {generatingPractice ? 'Generating...' : 'Generate New Practice Sheet'}
                  <CreditCost cost={getCostForAction(plan, 'practiceGeneration')} className="ml-2 font-bold" />
                </button>
              ) : null}
            </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function TutorPanel({ courseId, moduleIndex, subtopicIndex, user, selectedBlock, onClearBlock, externalPrompt, clearExternalPrompt, plan }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'I am here with the notes open. Select any block and ask me what feels fuzzy.',
    },
  ]);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages, sending]);

  useEffect(() => {
    setMessages([
      {
        role: 'assistant',
        text: 'New topic loaded. Click a note block when you want me to focus on a specific part.',
      },
    ]);
    setInput('');
  }, [courseId, moduleIndex, subtopicIndex]);

  const sendMessage = async (messageOverride) => {
    const finalMessage = (messageOverride || input).trim();
    if (!finalMessage || !user?.id || sending) return;

    const nextMessages = [...messages, { role: 'user', text: finalMessage }];
    setMessages(nextMessages);
    setInput('');
    setSending(true);

    try {
      const res = await fetch(`${API_BASE}/api/tutor-chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          courseId,
          moduleIndex: Number(moduleIndex),
          subtopicIndex: Number(subtopicIndex),
          message: finalMessage,
          history: messages,
          contextBlock: selectedBlock || null,
          explainMode: selectedBlock ? 'block-focused doubt solving' : 'lesson tutor',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'Tutor could not reply.');
      setMessages((prev) => [...prev, { role: 'assistant', text: data.reply }]);
    } catch (error) {
      setMessages((prev) => [...prev, { role: 'assistant', text: `I hit a limit or connection issue: ${error.message}` }]);
    } finally {
      setSending(false);
    }
  };

  useEffect(() => {
    if (externalPrompt) {
      sendMessage(externalPrompt);
      clearExternalPrompt();
    }
  }, [externalPrompt]);

  return (
    <aside className="flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2.4rem] border border-black/5 bg-white/70 backdrop-blur-2xl shadow-[0_20px_60px_rgba(0,0,0,0.03)]">
      <div className="border-b border-black/5 p-6 bg-white/40">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex items-center justify-center">
             <span className="relative flex h-3 w-3">
               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#4338ca] opacity-75"></span>
               <span className="relative inline-flex h-3 w-3 rounded-full bg-[#4338ca]"></span>
             </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[#4338ca]/80">Tutor Chat</p>
            <h2 className="mt-0.5 text-xl font-bold tracking-tight text-slate-900">Ask beside the notes</h2>
          </div>
        </div>

        {selectedBlock && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mt-5 rounded-2xl border border-[#4338ca]/15 bg-gradient-to-br from-[#eef2ff] to-white p-3.5 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-[9px] font-black uppercase tracking-[0.2em] text-[#4338ca]/70">Focused Context</p>
                <p className="mt-1 truncate text-sm font-semibold text-slate-800">{selectedBlock.title}</p>
              </div>
              <button type="button" onClick={onClearBlock} className="flex h-6 w-6 items-center justify-center rounded-full bg-white/50 text-slate-400 hover:bg-white hover:text-slate-700 hover:shadow-sm transition">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <div className="modal-scroll min-h-0 flex-1 space-y-5 p-6">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-[#1e1b4b] to-[#312e81] text-white shadow-md rounded-br-sm'
                : 'border border-[#4338ca]/10 bg-white/80 backdrop-blur-md text-slate-700 shadow-sm rounded-bl-sm'
            }`}>
              {message.role === 'assistant' ? <MarkdownRenderer content={message.text} /> : <p className="font-medium">{message.text}</p>}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-black/5 bg-white px-4 py-2 text-sm font-semibold text-slate-500">
              <Loader2 className="h-4 w-4 animate-spin" />
              Thinking with your selected context...
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <div className="border-t border-black/5 bg-white/40 p-5">
        <div className="mb-4 flex gap-2 overflow-x-auto pb-2 custom-scroll">
          {quickPrompts.map((prompt) => (
            <button
              type="button"
              key={prompt}
              onClick={() => sendMessage(prompt)}
              className="flex shrink-0 items-center gap-1.5 rounded-full border border-[#4338ca]/20 bg-white/80 px-4 py-2 text-[11px] font-bold tracking-wide text-slate-600 shadow-sm transition hover:-translate-y-0.5 hover:bg-white hover:text-[#4338ca] hover:shadow-md"
            >
              {prompt}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3 rounded-[2rem] border border-black/10 bg-white p-1.5 shadow-sm focus-within:border-slate-300 focus-within:ring-4 focus-within:ring-slate-100 transition-all">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder={selectedBlock ? 'Ask about the selected block...' : 'Ask a doubt from this lesson...'}
            className="h-[44px] flex-1 resize-none bg-transparent px-4 py-3 text-sm font-medium outline-none placeholder:text-slate-400 custom-scroll leading-tight"
          />
          <button type="button" disabled={sending || !input.trim()} onClick={() => sendMessage()} className="flex h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-[#94a3b8] px-4 text-white shadow-sm transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100">
            <Send className="h-4 w-4" />
            <CreditCost cost={getCostForAction(plan, 'tutorChat')} className="text-white" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function GuidedStudyPlanHub() {
  const { courseId, moduleIndex = 0, subtopicIndex = 0 } = useParams();
  const navigate = useNavigate();
  const { user, isLoaded, isSignedIn } = useUser();
  const [course, setCourse] = useState(null);
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rewritingBlockId, setRewritingBlockId] = useState('');
  const [practiceOpen, setPracticeOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [pageError, setPageError] = useState('');
  const [mcqAnswers, setMcqAnswers] = useState({});
  const [writtenAnswers, setWrittenAnswers] = useState({});
  const [codeAnswers, setCodeAnswers] = useState({});
  const [confidence, setConfidence] = useState('');
  const [studentNotes, setStudentNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [generatingPractice, setGeneratingPractice] = useState(false);
  const [currentPracticeIndex, setCurrentPracticeIndex] = useState(0);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [externalPrompt, setExternalPrompt] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const pdfRef = useRef(null);

  const numericModuleIndex = Number(moduleIndex);
  const numericSubtopicIndex = Number(subtopicIndex);
  const currentRef = subtopicRef(numericModuleIndex, numericSubtopicIndex);

  const fetchCourse = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}?clerkId=${user.id}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Study plan not found');
      setCourse(data.course);
      const nextSubtopic = data.course.modules?.[numericModuleIndex]?.subtopics?.[numericSubtopicIndex];
      setStudentNotes(nextSubtopic?.studentNotes || '');
    } catch (error) {
      setPageError(error.message);
    } finally {
      setLoading(false);
    }
  }, [courseId, numericModuleIndex, numericSubtopicIndex, user?.id]);

  const fetchUsage = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/${user.id}/usage`);
      const data = await res.json();
      if (data.success) setUsageData(data);
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    fetchUsage();
  }, [fetchUsage]);

  useEffect(() => {
    setConfidence('');
  }, [courseId, moduleIndex, subtopicIndex]);

  useEffect(() => {
    const module = course?.modules?.[numericModuleIndex];
    const subtopic = module?.subtopics?.[numericSubtopicIndex];
    const practices = subtopic?.practices || [];
    const currentPractice = practices[currentPracticeIndex];
    const submission = currentPractice?.state?.lastSubmission || {};

    setMcqAnswers(submission.mcqAnswers || {});
    setWrittenAnswers(submission.writtenAnswers || {});
    setCodeAnswers(submission.codeAnswers || {});
  }, [currentPracticeIndex, course, numericModuleIndex, numericSubtopicIndex]);



  useEffect(() => {
    if (practiceOpen) {
      document.body.classList.add('practice-drawer-open');
      document.documentElement.classList.add('practice-drawer-open');
    } else {
      document.body.classList.remove('practice-drawer-open');
      document.documentElement.classList.remove('practice-drawer-open');
    }
    return () => {
      document.body.classList.remove('practice-drawer-open');
      document.documentElement.classList.remove('practice-drawer-open');
    };
  }, [practiceOpen]);


  const module = course?.modules?.[numericModuleIndex];
  const subtopic = module?.subtopics?.[numericSubtopicIndex];
  const lessonContent = subtopic?.lessonContent || {};
  const blocks = useMemo(() => safeBlocks(lessonContent, subtopic?.subtopic_title), [lessonContent, subtopic?.subtopic_title]);
  const isReady = subtopic?.generationStatus === 'ready';
  const assessment = subtopic?.assessmentBundle || {};
  const aiUsage = {};

  // Handle generation status tracking and polling
  useEffect(() => {
    if (subtopic?.generationStatus === 'generating') {
      setGenerating(true);
      const timer = setInterval(() => {
        fetchCourse();
      }, 4000);
      return () => clearInterval(timer);
    } else if (subtopic?.generationStatus === 'ready') {
      setGenerating(false);
    }
  }, [subtopic?.generationStatus, fetchCourse]);

  // Shuffle loading messages
  useEffect(() => {
    if (!generating) return;
    const interval = setInterval(() => {
      setLoadingMessage(prev => {
        const nextIdx = (LOADING_MESSAGES.indexOf(prev) + 1) % LOADING_MESSAGES.length;
        return LOADING_MESSAGES[nextIdx];
      });
    }, 3000);
    return () => clearInterval(interval);
  }, [generating]);

  useEffect(() => {
    if (!selectedBlock) return;
    const fresh = blocks.find((block) => block.blockId === selectedBlock.blockId);
    if (fresh && fresh !== selectedBlock) setSelectedBlock(fresh);
  }, [blocks, selectedBlock]);

  const nextUnlockedRef = useMemo(() => {
    if (!course?.modules) return null;
    for (let m = numericModuleIndex; m < course.modules.length; m += 1) {
      const start = m === numericModuleIndex ? numericSubtopicIndex + 1 : 0;
      for (let s = start; s < (course.modules[m].subtopics || []).length; s += 1) {
        if (course.modules[m].subtopics[s].status !== 'locked') {
          return { moduleIndex: m, subtopicIndex: s };
        } else {
          return null;
        }
      }
    }
    return null;
  }, [course, numericModuleIndex, numericSubtopicIndex]);

  const prevUnlockedRef = useMemo(() => {
    if (!course?.modules) return null;
    for (let m = numericModuleIndex; m >= 0; m -= 1) {
      const start = m === numericModuleIndex ? numericSubtopicIndex - 1 : (course.modules[m].subtopics || []).length - 1;
      for (let s = start; s >= 0; s -= 1) {
        if (course.modules[m].subtopics[s].status !== 'locked') {
          return { moduleIndex: m, subtopicIndex: s };
        }
      }
    }
    return null;
  }, [course, numericModuleIndex, numericSubtopicIndex]);

  const replaceCourseFromResponse = (data) => {
    if (data.course) setCourse(data.course);
    fetchUsage();
  };

  const generateLesson = async (regenerate = false) => {
    setGenerating(true);
    setLoadingMessage(LOADING_MESSAGES[0]);
    setPageError('');
    try {
      const endpoint = regenerate ? 'regenerate' : 'generate';
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${currentRef}/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      const data = await res.json();
      
      // If already generating, the poller (useEffect) will handle it
      if (res.status === 409) {
        return; 
      }
      
      if (!data.success) throw new Error(data.error || data.message || 'Could not generate lesson.');
      replaceCourseFromResponse(data);
      setGenerating(false);
    } catch (error) {
      setPageError(error.message);
      setGenerating(false);
    }
  };

  const rewriteBlock = async (block, action) => {
    if (!isReady || block.blockId.startsWith('legacy-') || block.blockId === 'empty-lesson') {
      setPageError('Regenerate this lesson once to enable block-level AI actions.');
      return;
    }
    setRewritingBlockId(block.blockId);
    setPageError('');
    try {
      const selectedText = window.getSelection?.()?.toString?.() || '';
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${currentRef}/blocks/${block.blockId}/rewrite`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, selectedText }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'Could not update this block.');
      replaceCourseFromResponse(data);
      setSelectedBlock(data.block || block);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setRewritingBlockId('');
    }
  };


  const submitPractice = async () => {
    setSubmitting(true);
    setPageError('');
    try {
      const submission = {
        mcqAnswers,
        writtenAnswers,
        codeAnswers,
      };
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${currentRef}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission, confidence, studentNotes, practiceIndex: currentPracticeIndex }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Could not review your practice.');
      replaceCourseFromResponse(data);
    } catch (error) {
      setPageError(error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const generatePractice = async () => {
    setGeneratingPractice(true);
    setPageError('');
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${currentRef}/practice`, {
        method: 'POST',
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Could not generate practice.');
      replaceCourseFromResponse(data);
      if (data.subtopic?.practices) {
        setCurrentPracticeIndex(data.subtopic.practices.length - 1);
      }
      fetchUsage();
    } catch (error) {
      setPageError(error.message);
    } finally {
      setGeneratingPractice(false);
    }
  };

  const downloadPdf = async () => {
    if (!pdfRef.current) return;
    setPdfBusy(true);
    try {
      const { default: html2canvas } = await import('html2canvas-pro');
      const { jsPDF } = await import('jspdf');

      const el = pdfRef.current;
      el.style.position = 'fixed';
      el.style.left = '-9999px';
      el.style.top = '0';
      el.style.display = 'block';
      el.style.width = '760px';

      // Give a moment for asynchronous Mermaid diagrams to finish rendering
      // especially if they needed display:block to calculate layouts
      await new Promise(resolve => setTimeout(resolve, 1000));

      const scale = 2;
      const canvas = await html2canvas(el, { scale, useCORS: true });

      const imgData = canvas.toDataURL('image/jpeg', 0.98);
      const pdf = new jsPDF({ orientation: 'portrait', unit: 'in', format: 'a4' });

      const margin = 0.45;
      const pageW = pdf.internal.pageSize.getWidth();
      const pageH = pdf.internal.pageSize.getHeight();
      const innerW = pageW - margin * 2;
      const innerH = pageH - margin * 2;
      
      const pageHeightInCanvasPixels = (innerH / innerW) * canvas.width;
      
      // Intelligent Pagination: Find all elements we don't want to cut through
      const elRect = el.getBoundingClientRect();
      const breakElements = Array.from(el.querySelectorAll('section, pre, svg, table, img, .pdf-no-break'));
      
      let breakPoints = breakElements.map(node => {
          return (node.getBoundingClientRect().top - elRect.top) * scale;
      });
      breakElements.forEach(node => {
          if (node.tagName.toLowerCase() === 'section') {
              breakPoints.push((node.getBoundingClientRect().bottom - elRect.top) * scale);
          }
      });
      
      breakPoints.push(canvas.height);
      breakPoints = [...new Set(breakPoints)].sort((a, b) => a - b);

      el.style.display = 'none';
      el.style.position = '';
      el.style.left = '';
      
      let sourceY = 0;
      
      const stamp = () => {
        pdf.setFillColor(255, 255, 255);
        pdf.rect(0, 0, pageW, margin, 'F');
        pdf.rect(0, pageH - margin, pageW, margin, 'F');
      };

      while (sourceY < canvas.height) {
        const maxBottom = sourceY + pageHeightInCanvasPixels;
        let safeCutY = maxBottom;
        
        for (let i = 0; i < breakPoints.length; i++) {
            if (breakPoints[i] > sourceY && breakPoints[i] <= maxBottom) {
                safeCutY = breakPoints[i];
            }
        }
        
        // Prevent infinite loops if an element is taller than a page
        if (safeCutY <= sourceY + 50) {
             safeCutY = maxBottom;
        }
        if (safeCutY >= canvas.height) {
            safeCutY = canvas.height;
        }

        const drawHeightCanvasPixels = safeCutY - sourceY;
        const drawHeightInches = (drawHeightCanvasPixels / canvas.width) * innerW;

        const sliceCanvas = document.createElement('canvas');
        sliceCanvas.width = canvas.width;
        sliceCanvas.height = drawHeightCanvasPixels;
        const sliceCtx = sliceCanvas.getContext('2d');
        sliceCtx.fillStyle = '#ffffff';
        sliceCtx.fillRect(0, 0, sliceCanvas.width, sliceCanvas.height);
        
        sliceCtx.drawImage(
            canvas,
            0, sourceY, canvas.width, drawHeightCanvasPixels,
            0, 0, sliceCanvas.width, drawHeightCanvasPixels
        );

        if (sourceY > 0) pdf.addPage();
        pdf.addImage(sliceCanvas.toDataURL('image/jpeg', 0.98), 'JPEG', margin, margin, innerW, drawHeightInches);
        stamp();

        sourceY = safeCutY;
      }

      pdf.save(`${slugify(lessonContent.pdfTitle || subtopic?.subtopic_title)}.pdf`);
    } catch (error) {
      setPageError(`PDF export failed: ${error.message}`);
    } finally {
      setPdfBusy(false);
    }
  };

  const goNext = () => {
    if (nextUnlockedRef) {
      navigate(`/study-plan/${courseId}/learn/${nextUnlockedRef.moduleIndex}/${nextUnlockedRef.subtopicIndex}`);
      return;
    }
    navigate(`/study-plan/${courseId}`);
  };

  const goPrev = () => {
    if (prevUnlockedRef) {
      navigate(`/study-plan/${courseId}/learn/${prevUnlockedRef.moduleIndex}/${prevUnlockedRef.subtopicIndex}`);
      return;
    }
    navigate(`/study-plan/${courseId}`);
  };

  if (!isLoaded) {
    return <LoadingScreen message="Checking your credentials..." />;
  }

  if (!isSignedIn) {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-xl rounded-[2.4rem] px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-100 text-slate-500">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-serif text-4xl font-semibold text-slate-900">Sign in to continue</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">You must be logged in to view this lesson. If you are the creator, please sign in.</p>
          <div className="mt-6">
            <SignInButton mode="modal">
              <button type="button" className="course-primary-button justify-center w-full">Sign In</button>
            </SignInButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading) {
    return <LoadingScreen message="Opening the study workspace..." />;
  }

  if (!course || !subtopic) {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-xl rounded-[2.4rem] px-8 py-10 text-center">
          <h1 className="font-serif text-4xl font-semibold text-slate-900">Lesson not found</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">{pageError || 'This guided lesson could not be loaded or you do not have permission.'}</p>
          <Link to="/dashboard" className="course-primary-button mt-6 justify-center">Back to dashboard</Link>
        </div>
      </div>
    );
  }

  if (subtopic.status === 'locked') {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-xl rounded-[2.4rem] px-8 py-10 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-slate-100 text-slate-500">
            <Lock className="h-7 w-7" />
          </div>
          <h1 className="mt-6 font-serif text-4xl font-semibold text-slate-900">Locked Content</h1>
          <p className="mt-4 text-sm leading-7 text-slate-500">Please complete the preceding topics before accessing this lesson.</p>
          <Link to={`/study-plan/${courseId}`} className="course-primary-button mt-6 justify-center">Back to Map</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="course-shell min-h-screen px-3 pb-16 pt-24 sm:px-5 md:px-8 lg:px-10">
      <div className="mx-auto max-w-[96rem] space-y-6">
        <section className="course-surface rounded-[2.5rem] p-5 md:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <Link to={`/study-plan/${courseId}`} className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-slate-900">
                <ArrowLeft className="h-4 w-4" />
                Back to map
              </Link>
              <p className="mt-5 text-[11px] font-black uppercase tracking-[0.22em] text-[#4338ca]">{module?.module_title}</p>
              <h1 className="mt-3 max-w-4xl break-words font-serif text-[2.5rem] font-semibold leading-[0.96] text-slate-950 md:text-[4.2rem]">
                {subtopic.subtopic_title}
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-slate-500">
                Read the notes like a document, ask the tutor beside any block, then open practice only when you want to test yourself.
              </p>
            </div>
          </div>
        </section>

        {pageError && (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-rose-200 bg-rose-50 px-5 py-4 text-sm font-semibold text-rose-700">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{pageError}</span>
          </div>
        )}

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_27rem]">
          <main className="min-w-0 space-y-6">
            {!isReady ? (
              <section className="course-surface rounded-[2.6rem] p-7 text-center md:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] bg-[#eef2ff] text-[#4338ca]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="mt-6 font-serif text-4xl font-semibold text-slate-950">Generate the notes when you are ready</h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-slate-500">
                  We only spend credits when you explicitly create this lesson. The output is cached, editable by block, and exportable as a PDF.
                </p>
                <button type="button" disabled={generating} onClick={() => generateLesson(false)} className="course-primary-button mt-7 justify-center min-w-[200px]">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? loadingMessage : 'Generate lesson notes'}
                  {!generating && <CreditCost cost={getCostForAction(usageData?.plan, 'guidedLessonGeneration')} className="text-white ml-2" />}
                </button>
              </section>
            ) : (
              <section className="course-surface rounded-[2.6rem] p-4 md:p-7">
                <div className="mb-6 flex flex-col gap-4 border-b border-black/5 pb-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-black uppercase tracking-[0.22em] text-slate-400">Notes document</p>
                    <h2 className="mt-2 font-serif text-3xl font-semibold text-slate-950">
                      {(lessonContent.pdfTitle || subtopic.subtopic_title)
                        .replace(/\.pdf$/i, '')
                        .replace(/_/g, ' ')
                        .trim()}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={downloadPdf} disabled={pdfBusy} className="course-outline-button px-4 py-3">
                      {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      PDF
                    </button>
                    <button type="button" onClick={() => setPracticeOpen(true)} className="course-primary-button px-4 py-3">
                      <ClipboardList className="h-4 w-4" />
                      Practice
                    </button>
                  </div>
                </div>

                <div className="space-y-5">
                  {blocks.map((block) => (
                    <NoteBlock
                      key={block.blockId}
                      block={block}
                      active={selectedBlock?.blockId === block.blockId}
                      busy={rewritingBlockId === block.blockId}
                      onSelect={setSelectedBlock}
                      onAction={rewriteBlock}
                      onAsk={(nextBlock) => {
                        setSelectedBlock(nextBlock);
                        document.getElementById('guided-tutor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                      onChatTrigger={(nextBlock, prompt) => {
                        setSelectedBlock(nextBlock);
                        setExternalPrompt(prompt);
                        document.getElementById('guided-tutor-panel')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }}
                    />
                  ))}
                </div>
              </section>
            )}
          </main>

          <div id="guided-tutor-panel" className="min-w-0 xl:sticky xl:top-0 xl:flex xl:h-dvh xl:flex-col xl:gap-2 xl:py-3">
            <div className="flex items-center justify-between gap-1.5 rounded-full border border-black/5 bg-white/80 backdrop-blur-md p-1.5 shadow-sm shrink-0 overflow-hidden max-w-full w-full">
              {[
                { icon: ArrowLeft, tip: 'Prev', onClick: goPrev, disabled: !prevUnlockedRef },
                { icon: Download, tip: 'PDF', onClick: downloadPdf, disabled: !isReady || pdfBusy },
                { icon: RefreshCcw, tip: 'Regenerate', onClick: () => generateLesson(true), disabled: generating, costAction: 'regenerateLesson' },
                { icon: ArrowRight, tip: 'Next', onClick: goNext, disabled: !nextUnlockedRef },
              ].map(({ icon: Ic, tip, onClick: onBtnClick, disabled: dis, primary, costAction }) => (
                <button
                  type="button"
                  key={tip}
                  onClick={onBtnClick}
                  disabled={dis}
                  title={tip}
                  className={`flex items-center justify-center gap-1.5 rounded-full px-2 sm:px-3 py-2 text-[10px] sm:text-[11px] font-bold uppercase tracking-wide transition disabled:opacity-40 min-w-0 ${
                    primary
                      ? 'bg-[#111827] text-white shadow-sm'
                      : 'text-slate-600 hover:bg-slate-100'
                  }`}
                >
                  <Ic className="h-3.5 w-3.5 shrink-0" />
                  <span className="hidden sm:flex items-center gap-1 truncate">
                    {tip}
                    {costAction && <CreditCost cost={getCostForAction(usageData?.plan, costAction)} className={primary ? 'text-white' : ''} />}
                  </span>
                </button>
              ))}
            </div>

            <TutorPanel
              courseId={courseId}
              moduleIndex={numericModuleIndex}
              subtopicIndex={numericSubtopicIndex}
              user={user}
              selectedBlock={selectedBlock}
              onClearBlock={() => setSelectedBlock(null)}
              externalPrompt={externalPrompt}
              clearExternalPrompt={() => setExternalPrompt(null)}
              plan={usageData?.plan}
            />
          </div>
        </div>
      </div>

      <PracticeDrawer
        open={practiceOpen}
        onClose={() => setPracticeOpen(false)}
        subtopic={subtopic}
        mcqAnswers={mcqAnswers}
        setMcqAnswers={setMcqAnswers}
        writtenAnswers={writtenAnswers}
        setWrittenAnswers={setWrittenAnswers}
        codeAnswers={codeAnswers}
        setCodeAnswers={setCodeAnswers}
        submitting={submitting}
        onSubmit={submitPractice}
        generatingPractice={generatingPractice}
        onGeneratePractice={generatePractice}
        currentPracticeIndex={currentPracticeIndex}
        setCurrentPracticeIndex={setCurrentPracticeIndex}
        plan={usageData?.plan}
      />

      <div ref={pdfRef} style={{ display: 'none', background: '#fff', padding: '40px', color: '#0f172a', fontFamily: 'Inter, system-ui, sans-serif', width: '760px' }}>
        <p style={{ letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4f46e5', fontSize: 11, fontWeight: 800 }}>
          Cluss Study Notes
        </p>
        <h1 style={{ fontSize: 34, lineHeight: 1.05, margin: '16px 0 10px', fontFamily: 'Georgia, serif', color: '#0f172a' }}>
          {lessonContent.pdfTitle || subtopic.subtopic_title}
        </h1>
        <p style={{ color: '#64748b', fontSize: 13, lineHeight: 1.7, marginBottom: 26 }}>
          {course.course_title} — {module?.module_title}
        </p>
        {blocks.map((block) => (
          <section key={`pdf-${block.blockId}`} style={{ borderTop: '1px solid #e5e7eb', paddingTop: 20, marginTop: 20 }}>
            <p style={{ letterSpacing: '0.14em', textTransform: 'uppercase', color: '#64748b', fontSize: 10, fontWeight: 800 }}>
              {block.type || 'concept'}
            </p>
            <h2 style={{ fontSize: 22, margin: '8px 0 10px', color: '#0f172a' }}>{block.title}</h2>
            <div style={{ color: '#334155', fontSize: 13, lineHeight: 1.75 }}>
              <MarkdownRenderer content={block.body || ''} />
            </div>
            {block.code && (
              <pre style={{ whiteSpace: 'pre-wrap', background: '#111827', color: '#f8fafc', padding: 14, borderRadius: 14, fontSize: 11, overflowWrap: 'break-word', marginTop: 14 }}>
                {block.code}
              </pre>
            )}
            {block.callout && (
              <p style={{ background: '#fffbeb', color: '#92400e', padding: 12, borderRadius: 12, fontSize: 12, marginTop: 14 }}>
                {block.callout}
              </p>
            )}
          </section>
        ))}

      </div>
    </div>
  );
}
