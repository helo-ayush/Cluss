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
import LightMarkdownRenderer from '../components/LightMarkdownRenderer';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';
import { SignInButton } from '@clerk/clerk-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import CodeChallengeBlock from '../components/CodeChallengeBlock';
import { useUsage } from '../contexts/UsageContext';

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

function LessonSkeleton() {
  return (
    <DashboardShell title="Opening lesson..." eyebrow="Guided Lesson" showCreate={false} disableDefaultPadding>
      <div className="mx-auto max-w-[104rem] space-y-6 px-4 pt-24 pb-20 sm:px-6 lg:px-8">
        <section className="relative overflow-hidden rounded-[2.4rem] border border-white/[0.06] bg-[#1b1b1b] p-5 shadow-[0_24px_90px_rgba(0,0,0,0.38)] sm:p-7 lg:p-8">
          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_27rem] xl:grid-cols-[minmax(0,1fr)_31rem]">
            <div className="min-w-0 space-y-5">
              <div className="flex gap-2">
                <div className="h-10 w-24 animate-pulse rounded-full bg-white/[0.04]" />
                <div className="h-10 w-48 animate-pulse rounded-full bg-[#efff55]/5 border border-[#efff55]/10" />
              </div>
              <div className="h-5 w-56 animate-pulse rounded-full bg-white/[0.04]" />
              <div className="h-16 w-full max-w-3xl animate-pulse rounded-2xl bg-white/[0.05]" />
              <div className="h-16 w-2/3 animate-pulse rounded-2xl bg-white/[0.03]" />
              <div className="flex gap-3">
                <div className="h-12 w-32 animate-pulse rounded-full bg-white/[0.05]" />
                <div className="h-12 w-24 animate-pulse rounded-full bg-white/[0.03]" />
              </div>
            </div>
            <div className="space-y-3">
              <div className="h-36 animate-pulse rounded-[1.65rem] border border-white/[0.06] bg-white/[0.02]" />
              <div className="grid grid-cols-2 gap-3">
                {[0, 1, 2, 3].map((item) => (
                  <div key={item} className="h-24 animate-pulse rounded-[1.25rem] border border-white/[0.06] bg-white/[0.02]" />
                ))}
              </div>
            </div>
          </div>
        </section>

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_27rem]">
          <main className="min-w-0 space-y-5 rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.32)] md:p-7">
            <div className="mb-6 flex items-center justify-between border-b border-white/[0.06] pb-6">
              <div className="space-y-3">
                <div className="h-4 w-32 animate-pulse rounded-full bg-white/[0.03]" />
                <div className="h-8 w-72 animate-pulse rounded-xl bg-white/[0.05]" />
              </div>
              <div className="h-11 w-28 animate-pulse rounded-full bg-white/[0.03]" />
            </div>
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-[1.75rem] border border-white/[0.06] bg-white/[0.02] p-5 md:p-7">
                <div className="h-7 w-2/3 animate-pulse rounded-xl bg-white/[0.05]" />
                <div className="mt-5 space-y-3">
                  <div className="h-4 w-full animate-pulse rounded-full bg-white/[0.03]" />
                  <div className="h-4 w-11/12 animate-pulse rounded-full bg-white/[0.03]" />
                  <div className="h-4 w-3/4 animate-pulse rounded-full bg-white/[0.03]" />
                </div>
              </div>
            ))}
          </main>
          <aside className="hidden min-w-0 xl:flex xl:h-[calc(100dvh-7rem)] xl:flex-col xl:gap-2">
            <div className="grid grid-cols-4 gap-2 rounded-[1.35rem] border border-white/[0.06] bg-[#1b1b1b] p-2">
              {[0, 1, 2, 3].map((item) => (
                <div key={item} className="h-10 animate-pulse rounded-[0.9rem] bg-white/[0.03]" />
              ))}
            </div>
            <div className="flex flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b]">
              <div className="border-b border-white/[0.06] p-4">
                <div className="h-8 w-56 animate-pulse rounded-xl bg-white/[0.05]" />
              </div>
              <div className="flex-1 p-4">
                <div className="h-24 animate-pulse rounded-2xl bg-white/[0.03]" />
              </div>
              <div className="border-t border-white/[0.06] p-4">
                <div className="h-14 animate-pulse rounded-full bg-white/[0.03]" />
              </div>
            </div>
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}

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
    ? 'bg-white text-black shadow-[0_16px_34px_rgba(255,255,255,0.18)] hover:-translate-y-0.5'
    : 'border border-white/[0.06] bg-[#161616] text-slate-300 hover:-translate-y-0.5 hover:bg-[#1c1c1c]';

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`flex w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50 ${toneClass}`}
    >
      <span className="flex items-center gap-3">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <ArrowRight className="h-4 w-4 opacity-70" />
    </button>
  );
}

function LessonMetric({ label, value, detail, accent = '#b9f9ff' }) {
  return (
    <div className="relative overflow-hidden rounded-[1.25rem] border border-white/[0.06] bg-white/[0.02] p-4">
      <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{label}</p>
      <p className="mt-2 text-3xl font-bold leading-none text-white">{value}</p>
      <p className="mt-2 text-xs font-medium leading-5 text-zinc-500">{detail}</p>
    </div>
  );
}

function LessonCommandDeck({
  course,
  module,
  subtopic,
  courseId,
  numericModuleIndex,
  numericSubtopicIndex,
  blocks,
  isReady,
  generating,
  loadingMessage,
  moduleProgress,
  practiceCount,
  usageData,
  generateLesson,
  downloadPdf,
  pdfBusy,
  setPracticeOpen,
  goPrev,
  goNext,
  prevUnlockedRef,
  nextUnlockedRef,
}) {
  const totalLessons = module?.subtopics?.length || 0;
  const lessonPosition = totalLessons ? `${numericSubtopicIndex + 1}/${totalLessons}` : `${numericSubtopicIndex + 1}`;
  const statusLabel = generating ? 'Generating' : isReady ? 'Ready' : 'Not generated';

  return (
    <section className="relative overflow-hidden rounded-[2.4rem] border border-white/[0.06] bg-[#1b1b1b] shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.02),transparent_38%),linear-gradient(180deg,rgba(239,255,85,0.02),transparent_45%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

      <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_27rem] lg:p-8 xl:grid-cols-[minmax(0,1fr)_31rem]">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to={`/dashboard/guided/study-plan/${courseId}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-xs font-semibold text-zinc-200 transition hover:bg-white/[0.08] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Map
            </Link>
            <span className="inline-flex rounded-full border border-[#efff55]/20 bg-[#efff55]/5 px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#efff55]">
              Guided lesson studio
            </span>
            <span className="inline-flex rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-400">
              {statusLabel}
            </span>
          </div>

          <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{module?.module_title}</p>
          <h1 className="mt-3 break-words text-[2.35rem] font-bold leading-[1.02] tracking-[-0.03em] text-white sm:text-[3.2rem] lg:text-[4rem]">
            {subtopic.subtopic_title}
          </h1>
          <p className="mt-4 max-w-3xl text-[15px] leading-8 text-zinc-400">
            Work through the lesson document, ask the tutor with focused context, then generate practice when you want to prove it stuck.
          </p>

          <div className="mt-7 flex flex-wrap gap-3">
            {!isReady ? (
              <button type="button" disabled={generating} onClick={() => generateLesson(false)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 disabled:opacity-50">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {generating ? loadingMessage : 'Generate lesson'}
                {!generating && <CreditCost cost={getCostForAction(usageData?.plan, 'guidedLessonGeneration')} className="text-black/60" />}
              </button>
            ) : (
              <>
                <button type="button" onClick={() => setPracticeOpen(true)} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-[#efff55] px-5 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-[#efff55]/90 hover:shadow-[0_0_20px_rgba(239,255,85,0.15)]">
                  <ClipboardList className="h-4 w-4" />
                  Practice
                </button>
                <button type="button" onClick={downloadPdf} disabled={pdfBusy} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-5 py-3 text-sm font-semibold text-zinc-200 transition hover:-translate-y-0.5 hover:bg-white/[0.08] hover:text-white disabled:opacity-50">
                  {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                  PDF
                </button>
              </>
            )}
            <button type="button" onClick={goPrev} disabled={!prevUnlockedRef} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white disabled:opacity-35">
              <ArrowLeft className="h-4 w-4" />
              Prev
            </button>
            <button type="button" onClick={goNext} disabled={!nextUnlockedRef} className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-5 py-3 text-sm font-semibold text-zinc-300 transition hover:-translate-y-0.5 hover:bg-white/[0.06] hover:text-white disabled:opacity-35">
              Next
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex min-w-0 flex-col gap-4 lg:items-end">
          <div className="w-full rounded-[1.65rem] border border-white/[0.06] bg-white/[0.025] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.01)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[#efff55]/70">Lesson pulse</p>
                <h2 className="mt-3 text-4xl font-bold leading-none text-white">{moduleProgress}%</h2>
                <p className="mt-3 text-sm font-medium leading-6 text-zinc-500">Module progress by completed topics.</p>
              </div>
              <div className="rounded-2xl border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-xs font-semibold text-zinc-300">
                {lessonPosition}
              </div>
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-white/[0.04]">
              <div className="h-full rounded-full bg-gradient-to-r from-[#efff55] to-white transition-all duration-700" style={{ width: `${moduleProgress}%` }} />
            </div>
          </div>

          <div className="grid w-full grid-cols-2 gap-3">
            <LessonMetric label="Blocks" value={blocks.length} detail="Study sections" accent="#b9f9ff" />
            <LessonMetric label="Practice" value={practiceCount} detail="Sheets saved" accent="#6ee7b7" />
            <LessonMetric label="Lesson" value={lessonPosition} detail="Position" accent="#ffffff" />
            <LessonMetric label="Status" value={isReady ? 'On' : 'Off'} detail={statusLabel} accent="#fde68a" />
          </div>
        </div>
      </div>
    </section>
  );
}

function NoteBlock({ block, active, busy, onSelect, onAction, onAsk, onChatTrigger }) {
  const typeConfig = {
    intro: { icon: BookOpen, color: 'text-zinc-300', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]', label: 'Introduction' },
    concept: { icon: Lightbulb, color: 'text-zinc-300', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]', label: 'Concept' },
    example: { icon: Eye, color: 'text-zinc-300', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]', label: 'Example' },
    diagram: { icon: Map, color: 'text-zinc-300', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]', label: 'Diagram' },
    code: { icon: Code, color: 'text-zinc-300', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]', label: 'Code' },
    callout: { icon: Megaphone, color: 'text-amber-300', bg: 'bg-amber-500/5', border: 'border-amber-500/10', label: 'Important' },
    summary: { icon: Layers, color: 'text-zinc-300', bg: 'bg-white/[0.03]', border: 'border-white/[0.06]', label: 'Summary' },
    project: { icon: Crown, color: 'text-[#efff55]', bg: 'bg-[#efff55]/5', border: 'border-[#efff55]/20 shadow-[0_0_15px_rgba(239,255,85,0.05)]', label: 'Mini-Project' },
    practice: { icon: HelpCircle, color: 'text-[#efff55]', bg: 'bg-[#efff55]/5', border: 'border-[#efff55]/20', label: 'Practice' },
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
      className={`group relative overflow-hidden rounded-[1.75rem] border p-5 outline-none transition duration-300 md:p-7 ${
        active
          ? 'border-[#efff55]/25 bg-[#1b1b1b] shadow-[0_0_30px_rgba(239,255,85,0.03)]'
          : 'border-white/[0.06] bg-[#1b1b1b] hover:border-white/[0.12] hover:bg-white/[0.03]'
      }`}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="min-w-0">
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.16em] ${config.bg} ${config.color} ${config.border}`}>
            {config.label}
          </span>
          <h2 className="mt-4 break-words text-2xl font-bold leading-tight tracking-[-0.02em] text-white md:text-3xl">
            {block.title}
          </h2>
        </div>
        <div className={`flex flex-wrap items-center gap-2 transition md:justify-end ${active ? 'opacity-100' : 'opacity-100 md:opacity-0 md:group-hover:opacity-100'}`}>
          <button type="button" onClick={(event) => { event.stopPropagation(); onAsk(block); }} className="rounded-full bg-[#efff55] px-3.5 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-black transition hover:-translate-y-0.5 hover:shadow-[0_0_15px_rgba(239,255,85,0.2)]">
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
            className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-[#161616] px-3 py-2 text-[11px] font-semibold text-zinc-300 transition hover:bg-white/[0.05] hover:text-white disabled:opacity-50"
              >
                <Icon className="h-3.5 w-3.5" />
                {action.label}
              </button>
            );
          })}
          {hasMultipleVersions && (
            <div className="inline-flex items-center gap-1 rounded-full border border-white/[0.06] bg-[#161616] px-1.5 py-1 text-xs font-semibold text-slate-400 shadow-sm" onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                disabled={viewIndex === 0}
                onClick={() => setViewIndex(prev => prev - 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 transition"
              >
                &lt;
              </button>
              <span className="min-w-[2.5rem] text-center tracking-widest">{viewIndex + 1}/{history.length + 1}</span>
              <button
                type="button"
                disabled={viewIndex === history.length}
                onClick={() => setViewIndex(prev => prev + 1)}
                className="flex h-6 w-6 items-center justify-center rounded-full hover:bg-white/10 disabled:opacity-30 transition"
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
        <div className="mt-5 rounded-2xl border border-amber-500/10 bg-amber-500/5 px-4 py-3 text-sm leading-6 text-amber-200 [&_p]:text-amber-200 [&_p]:mb-0 [&_strong]:text-amber-100">
          <MarkdownRenderer content={currentView.callout.replace(/^>\s*/, '')} />
        </div>
      )}
      {currentView.inlineChallenge && (
        <CodeChallengeBlock challenge={currentView.inlineChallenge} />
      )}

      {busy && (
        <div className="absolute inset-0 flex items-center justify-center rounded-[2rem] bg-[#1b1b1b]/70 backdrop-blur-sm z-10">
          <Loader2 className="h-6 w-6 animate-spin text-[#efff55]" />
        </div>
      )}
    </motion.article>
  );
}

function PreTestModal({ open, onClose, courseId, subtopicRef, plan, navigate, moduleIndex, subtopicIndex }) {
  const [timeLimit, setTimeLimit] = useState(15);
  const [difficulty, setDifficulty] = useState('medium');
  const [questionTypes, setQuestionTypes] = useState(['mcqs', 'written']);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState('');
  const isPro = plan && plan !== 'free';

  const toggleType = (type) => {
    setQuestionTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  const estimatedCount = {
    easy:   { 10: 6,  15: 8,  30: 12, 45: 18 },
    medium: { 10: 7,  15: 10, 30: 15, 45: 22 },
    hard:   { 10: 8,  15: 12, 30: 18, 45: 26 },
  }[difficulty]?.[timeLimit] ?? 10;

  const costMap = { 10: 15, 15: 20, 30: 30, 45: 40 };
  const generationCost = costMap[timeLimit] || 20;
  const gradingCost = getCostForAction(plan, 'assessmentGrading');

  const handleStart = async () => {
    if (questionTypes.length === 0) { setError('Select at least one question type.'); return; }
    setGenerating(true);
    setError('');
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${subtopicRef}/practice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ difficulty, questionTypes, timeLimit }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Could not generate practice.');
      const pi = data.practiceIndex ?? 0;
      navigate(`/dashboard/guided/study-plan/${courseId}/learn/${moduleIndex}/${subtopicIndex}/practice?pi=${pi}&tl=${timeLimit}`);
    } catch (err) {
      setError(err.message);
      setGenerating(false);
    }
  };

  if (!open) return null;

  const timeLimitOptions = [{ label: '10 min', value: 10 }, { label: '15 min', value: 15 }, { label: '30 min', value: 30 }, { label: '45 min', value: 45 }];
  const difficultyOptions = [{ label: 'Easy', value: 'easy', color: '#4ade80' }, { label: 'Medium', value: 'medium', color: '#fbbf24' }, { label: 'Hard', value: 'hard', color: '#f87171' }];
  const typeOptions = [
    { key: 'mcqs', label: 'MCQ', icon: '⊙', pro: false },
    { key: 'written', label: 'Written', icon: '✎', pro: false },
    { key: 'math', label: 'Math', icon: '∑', pro: true },
    { key: 'code', label: 'Code', icon: '</>', pro: true },
  ];

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-[1200] flex items-center justify-center p-4"
        style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.div
          className="relative w-full max-w-md rounded-[2rem] border border-white/[0.08] bg-[#141414] shadow-[0_40px_120px_rgba(0,0,0,0.6)]"
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 200, damping: 22 }}
          onClick={e => e.stopPropagation()}
        >
          <div className="p-6 md:p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Practice Test</p>
                <h2 className="mt-1 text-2xl font-bold tracking-tight text-white">Configure your test</h2>
              </div>
              <button onClick={onClose} className="flex h-9 w-9 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.03] text-zinc-400 hover:text-white transition">
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Time Limit */}
            <div className="mb-5">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">Time Limit</p>
              <div className="grid grid-cols-4 gap-2">
                {timeLimitOptions.map(opt => (
                  <button key={opt.value} onClick={() => setTimeLimit(opt.value)}
                    className={`rounded-[1rem] border py-2.5 text-xs font-bold transition ${
                      timeLimit === opt.value
                        ? 'border-[#efff55]/45 bg-white/[0.03] text-white shadow-[0_0_15px_rgba(239,255,85,0.05)]'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Difficulty */}
            <div className="mb-5">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">Difficulty</p>
              <div className="grid grid-cols-3 gap-2">
                {difficultyOptions.map(opt => (
                  <button key={opt.value} onClick={() => setDifficulty(opt.value)}
                    className={`rounded-[1rem] border py-2.5 text-xs font-bold transition ${
                      difficulty === opt.value
                        ? 'border-white/20 text-white'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white'
                    }`}
                    style={difficulty === opt.value ? { borderColor: opt.color + '40', background: opt.color + '08', color: opt.color } : {}}>
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Question Types */}
            <div className="mb-6">
              <p className="mb-2.5 text-xs font-semibold uppercase tracking-widest text-zinc-500">Question Types</p>
              <div className="grid grid-cols-2 gap-2">
                {typeOptions.map(opt => {
                  const locked = opt.pro && !isPro;
                  const active = questionTypes.includes(opt.key) && !locked;
                  return (
                    <button key={opt.key}
                      onClick={() => !locked && toggleType(opt.key)}
                      disabled={locked}
                      className={`relative flex items-center gap-2.5 rounded-[1rem] border px-3.5 py-3 text-sm font-semibold transition ${
                        locked ? 'border-white/[0.04] bg-white/[0.01] text-zinc-600 cursor-not-allowed'
                        : active ? 'border-[#efff55]/35 bg-white/[0.03] text-white shadow-[0_0_15px_rgba(239,255,85,0.03)]'
                        : 'border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:border-white/20 hover:text-white'
                      }`}>
                      <span className="text-base">{opt.icon}</span>
                      <span>{opt.label}</span>
                      {locked && (
                        <span className="ml-auto rounded-full bg-white/[0.06] border border-white/[0.08] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">
                          PRO
                        </span>
                      )}
                      {active && !locked && (
                        <span className="ml-auto h-2 w-2 rounded-full bg-[#efff55] shadow-[0_0_8px_#efff55]" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Estimate with Dynamic Question Count and Rising Credits Cost */}
            <div className="mb-6 rounded-[1.6rem] border border-white/[0.06] bg-white/[0.01] p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1">Total Questions</p>
                  <span className="text-3xl font-black text-white">{estimatedCount} <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">questions</span></span>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500 mb-1">Generation Cost</p>
                  <span className="text-3xl font-black text-white"><span className="text-[#efff55] mr-0.5">⚡</span>{generationCost} <span className="text-xs text-zinc-500 font-bold uppercase tracking-wider">credits</span></span>
                </div>
              </div>
              <div className="border-t border-white/[0.04] pt-3 flex items-center justify-between text-xs text-zinc-500">
                <span>Dynamic pricing based on selected time limit</span>
                <span>AI Grading: <strong className="text-[#efff55] font-semibold">Included</strong></span>
              </div>
            </div>

            {error && <p className="mb-3 rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-2 text-xs text-rose-300">{error}</p>}

            <div className="flex gap-3">
              <button onClick={onClose} className="flex-1 rounded-full border border-white/[0.06] bg-white/[0.02] py-3 text-sm font-semibold text-zinc-400 hover:text-white transition">
                Cancel
              </button>
              <button onClick={handleStart} disabled={generating}
                className="flex flex-[2] items-center justify-center gap-2 rounded-full bg-[#efff55] py-3 text-sm font-bold text-black transition hover:bg-[#efff55]/90 hover:shadow-[0_0_20px_rgba(239,255,85,0.2)] disabled:opacity-60">
                {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                {generating ? 'Generating test...' : 'Start Test →'}
              </button>
            </div>
          </div>
        </motion.div>
      </motion.div>
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
  const chatContainerRef = useRef(null);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: chatContainerRef.current.scrollHeight,
        behavior: 'smooth'
      });
    }
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
    <aside className="no-scrollbar flex min-h-0 flex-1 flex-col overflow-hidden rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
      <div ref={chatContainerRef} className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 pt-5">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-[#2a2a2a] text-white shadow-md rounded-br-sm'
                : 'border border-white/[0.06] bg-white/[0.03] text-zinc-300 shadow-sm rounded-bl-sm'
            }`}>
              {message.role === 'assistant' ? <MarkdownRenderer content={message.text} /> : <p className="font-semibold">{message.text}</p>}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-sm font-semibold text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin text-[#efff55]" />
              Thinking with your selected context...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/[0.06] bg-transparent p-4">
        <div className="flex items-center gap-3 rounded-[2rem] border border-white/[0.06] bg-white/[0.03] p-1.5 shadow-sm transition-all focus-within:border-[#efff55]/30 focus-within:bg-white/[0.04]">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder={selectedBlock ? `Ask about ${selectedBlock.title}...` : 'Ask a doubt from this lesson...'}
            rows={1}
            className="h-12 flex-1 resize-none overflow-hidden whitespace-nowrap bg-transparent px-4 py-3 text-sm font-medium leading-6 text-white outline-none placeholder:text-white/30 custom-scroll"
          />
          <button type="button" disabled={sending || !input.trim()} onClick={() => sendMessage()} className="flex h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full px-4 font-bold shadow-sm transition duration-300 disabled:bg-[#1b1b1b] disabled:text-white/20 disabled:opacity-100 bg-[#efff55] text-black hover:scale-105">
            <Send className="h-4 w-4" />
            <CreditCost cost={getCostForAction(plan, 'tutorChat')} className={sending || !input.trim() ? "text-white/20" : "text-black"} />
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
  const { usageData, fetchUsage } = useUsage();
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [rewritingBlockId, setRewritingBlockId] = useState('');
  const [practiceModalOpen, setPracticeModalOpen] = useState(false);
  const [selectedBlock, setSelectedBlock] = useState(null);
  const [pageError, setPageError] = useState('');
  const [pdfBusy, setPdfBusy] = useState(false);
  const [externalPrompt, setExternalPrompt] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState(LOADING_MESSAGES[0]);
  const pdfRef = useRef(null);

  const numericModuleIndex = Number(moduleIndex);
  const numericSubtopicIndex = Number(subtopicIndex);
  const currentRef = subtopicRef(numericModuleIndex, numericSubtopicIndex);

  const redirectToLibrary = useCallback((message) => {
    navigate('/dashboard/guided', {
      replace: true,
      state: { toast: { message } },
    });
  }, [navigate]);

  const fetchCourse = useCallback(async () => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}?clerkId=${user.id}`);
      const data = await res.json();
      if (!data.success || data.course?.sourceType !== 'guided-topic') {
        redirectToLibrary(data.message || 'You do not have access to that guided plan.');
        return;
      }
      const nextSubtopic = data.course.modules?.[numericModuleIndex]?.subtopics?.[numericSubtopicIndex];
      if (!nextSubtopic) {
        redirectToLibrary('That lesson could not be found.');
        return;
      }
      if (nextSubtopic.status === 'locked') {
        redirectToLibrary('That lesson is locked. Complete the earlier steps first.');
        return;
      }
      setCourse(data.course);
    } catch (error) {
      redirectToLibrary(error.message || 'Could not open that lesson.');
    } finally {
      setLoading(false);
    }
  }, [courseId, numericModuleIndex, numericSubtopicIndex, redirectToLibrary, user?.id]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);




  const module = course?.modules?.[numericModuleIndex];
  const subtopic = module?.subtopics?.[numericSubtopicIndex];
  const lessonContent = subtopic?.lessonContent || {};
  const blocks = useMemo(() => safeBlocks(lessonContent, subtopic?.subtopic_title), [lessonContent, subtopic?.subtopic_title]);
  const isReady = subtopic?.generationStatus === 'ready';
  const moduleProgress = useMemo(() => {
    const subtopics = module?.subtopics || [];
    if (!subtopics.length) return 0;
    const completed = subtopics.filter((item) => item.status === 'completed').length;
    return Math.round((completed / subtopics.length) * 100);
  }, [module]);
  const practiceCount = subtopic?.practices?.length || 0;
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
    } else {
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
      navigate(`/dashboard/guided/study-plan/${courseId}/learn/${nextUnlockedRef.moduleIndex}/${nextUnlockedRef.subtopicIndex}`);
      return;
    }
    navigate(`/dashboard/guided/study-plan/${courseId}`);
  };

  const goPrev = () => {
    if (prevUnlockedRef) {
      navigate(`/dashboard/guided/study-plan/${courseId}/learn/${prevUnlockedRef.moduleIndex}/${prevUnlockedRef.subtopicIndex}`);
      return;
    }
    navigate(`/dashboard/guided/study-plan/${courseId}`);
  };

  if (!isLoaded) {
    return <LessonSkeleton />;
  }

  if (!isSignedIn) {
    return (
      <DashboardShell title="Sign in required" showCreate={false} disableDefaultPadding>
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="rounded-[2.4rem] border border-white/[0.06] bg-[#1b1b1b] px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)] max-w-xl w-full">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[#efff55]/20 bg-[#efff55]/5 text-[#efff55]">
              <Lock className="h-7 w-7" />
            </div>
            <h1 className="mt-6 text-3xl font-bold text-white">Sign in to continue</h1>
            <p className="mt-4 text-sm leading-7 text-slate-400">You must be logged in to view this lesson. If you are the creator, please sign in.</p>
            <div className="mt-6">
              <SignInButton mode="modal">
                <button type="button" className="flex items-center justify-center gap-2 rounded-full bg-[#efff55] px-5 py-3 text-sm font-bold text-black transition hover:bg-[#efff55]/90 hover:shadow-[0_0_15px_rgba(239,255,85,0.2)] w-full">Sign In</button>
              </SignInButton>
            </div>
          </div>
        </div>
      </DashboardShell>
    );
  }

  if (loading) {
    return <LessonSkeleton />;
  }

  if (!course || !subtopic) {
    return <LessonSkeleton />;
  }

  if (subtopic.status === 'locked') {
    redirectToLibrary('That lesson is locked. Complete the earlier steps first.');
    return <LessonSkeleton />;
  }

  return (
    <DashboardShell
      title={subtopic?.subtopic_title || 'Guided Lesson'}
      eyebrow={module?.module_title || 'Module Lesson'}
      showCreate={false}
      disableDefaultPadding
    >
      <div className="mx-auto max-w-[104rem] space-y-6 px-4 pt-24 pb-4 sm:px-6 lg:px-8">
        <LessonCommandDeck
          course={course}
          module={module}
          subtopic={subtopic}
          courseId={courseId}
          numericModuleIndex={numericModuleIndex}
          numericSubtopicIndex={numericSubtopicIndex}
          blocks={blocks}
          isReady={isReady}
          generating={generating}
          loadingMessage={loadingMessage}
          moduleProgress={moduleProgress}
          practiceCount={subtopic?.practices?.length || 0}
          usageData={usageData}
          generateLesson={generateLesson}
          downloadPdf={downloadPdf}
          pdfBusy={pdfBusy}
          setPracticeOpen={setPracticeModalOpen}
          goPrev={goPrev}
          goNext={goNext}
          prevUnlockedRef={prevUnlockedRef}
          nextUnlockedRef={nextUnlockedRef}
        />

        {pageError && (
          <div className="flex items-start gap-3 rounded-[1.5rem] border border-rose-500/10 bg-rose-500/5 px-5 py-4 text-sm font-medium text-rose-300">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0" />
            <span>{pageError}</span>
          </div>
        )}

        <div className="grid min-w-0 gap-6 xl:grid-cols-[minmax(0,1fr)_24rem] 2xl:grid-cols-[minmax(0,1fr)_27rem]">
          <main className="min-w-0 space-y-6">
            {!isReady ? (
              <section className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-7 text-center shadow-[0_20px_70px_rgba(0,0,0,0.32)] md:p-12">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-[1.5rem] border border-[#efff55]/20 bg-[#efff55]/5 text-[#efff55]">
                  <Sparkles className="h-7 w-7" />
                </div>
                <h2 className="mt-6 text-3xl font-bold tracking-[-0.02em] text-white">Generate the notes when you are ready</h2>
                <p className="mx-auto mt-4 max-w-2xl text-sm leading-7 text-zinc-400">
                  We only spend credits when you explicitly create this lesson. The output is cached, editable by block, and exportable as a PDF.
                </p>
                <button type="button" disabled={generating} onClick={() => generateLesson(false)} className="mx-auto mt-7 flex min-h-12 min-w-[200px] items-center justify-center gap-2 rounded-full bg-[#efff55] px-6 py-3 text-sm font-bold text-black transition hover:bg-[#efff55]/90 hover:shadow-[0_0_20px_rgba(239,255,85,0.15)] disabled:opacity-50">
                  {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                  {generating ? loadingMessage : 'Generate lesson notes'}
                  {!generating && <CreditCost cost={getCostForAction(usageData?.plan, 'guidedLessonGeneration')} className="text-black ml-2" />}
                </button>
              </section>
            ) : (
              <section className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.32)] md:p-7">
                <div className="mb-6 flex flex-col gap-4 border-b border-white/[0.06] pb-6 md:flex-row md:items-center md:justify-between">
                  <div>
                    <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Notes document</p>
                    <h2 className="mt-2 text-2xl font-bold tracking-[-0.02em] text-white">
                      {(lessonContent.pdfTitle || subtopic.subtopic_title)
                        .replace(/\.pdf$/i, '')
                        .replace(/_/g, ' ')
                        .trim()}
                    </h2>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <button type="button" onClick={downloadPdf} disabled={pdfBusy} className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/[0.08]">
                      {pdfBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      PDF
                    </button>
                    <button type="button" onClick={() => setPracticeModalOpen(true)} className="flex items-center gap-2 rounded-full bg-[#efff55] px-4 py-3 text-sm font-bold text-black transition hover:bg-[#efff55]/90 hover:shadow-[0_0_15px_rgba(239,255,85,0.15)]">
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
          <div id="guided-tutor-panel" className="no-scrollbar min-w-0 xl:sticky xl:top-24 xl:flex xl:h-[calc(100dvh-7rem)] xl:flex-col xl:gap-2 xl:overflow-hidden">
            <div className="grid shrink-0 grid-cols-4 gap-2 rounded-[1.35rem] border border-white/[0.06] bg-[#1b1b1b] p-2 shadow-[0_18px_54px_rgba(0,0,0,0.22)]">
              {[
                { icon: ArrowLeft, tip: 'Prev', onClick: goPrev, disabled: !prevUnlockedRef },
                { icon: Download, tip: 'PDF', onClick: downloadPdf, disabled: !isReady || pdfBusy },
                { icon: RefreshCcw, tip: 'Again', onClick: () => generateLesson(true), disabled: generating, costAction: 'regenerateLesson' },
                { icon: ArrowRight, tip: 'Next', onClick: goNext, disabled: !nextUnlockedRef },
              ].map(({ icon: Ic, tip, onClick: onBtnClick, disabled: dis, costAction }) => (
                <button
                  type="button"
                  key={tip}
                  onClick={onBtnClick}
                  disabled={dis}
                  title={tip}
                  className="flex min-h-10 min-w-0 flex-col items-center justify-center gap-1 rounded-[0.9rem] border border-white/[0.06] bg-white/[0.02] px-2 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-zinc-400 transition duration-300 hover:bg-white/[0.05] hover:text-[#efff55] disabled:opacity-35"
                >
                  <Ic className="h-4 w-4 shrink-0" />
                  <span className="flex max-w-full items-center gap-1 truncate">
                    {tip}
                    {costAction && <CreditCost cost={getCostForAction(usageData?.plan, costAction)} />}
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

      <PreTestModal
        open={practiceModalOpen}
        onClose={() => setPracticeModalOpen(false)}
        courseId={courseId}
        subtopicRef={currentRef}
        plan={usageData?.plan}
        navigate={navigate}
        moduleIndex={numericModuleIndex}
        subtopicIndex={numericSubtopicIndex}
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
              <LightMarkdownRenderer content={block.body || ''} />
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
    </DashboardShell>
  );
}
