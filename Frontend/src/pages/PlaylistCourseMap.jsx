import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  ChevronRight,
  CirclePlay,
  Clock,
  FileCode,
  FileText,
  Gauge,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Plus,
  Send,
  ShieldCheck,
  Search,
  Trophy,
  Video,
  X
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DashboardShell from '../components/dashboard/DashboardShell';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

function clampProgress(value) {
  const number = Number(value) || 0;
  return Math.max(0, Math.min(100, number));
}

function scrollToElement(id, block = 'start') {
  const element = document.getElementById(id);
  if (element) element.scrollIntoView({ behavior: 'smooth', block });
}

function StatusPill({ status }) {
  const tone = {
    ready: { label: 'Completed', border: 'border-emerald-500/20', bg: 'bg-emerald-500/10 text-emerald-400' },
    processing: { label: 'Preparing', border: 'border-indigo-500/20', bg: 'bg-indigo-500/10 text-indigo-400' },
    failed: { label: 'Needs Retry', border: 'border-rose-500/20', bg: 'bg-rose-500/10 text-rose-400' },
    unprocessed: { label: 'Upcoming', border: 'border-white/10', bg: 'bg-white/5 text-zinc-400' },
  }[status] || { label: 'Upcoming', border: 'border-white/10', bg: 'bg-white/5 text-zinc-400' };

  return (
    <span className={`inline-flex items-center rounded-full border px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] ${tone.border} ${tone.bg}`}>
      {tone.label}
    </span>
  );
}

function CheckpointModal({ checkpoint, courseId, dayIndex, clerkId, onClose, onSubmitted }) {
  const [activeTab, setActiveTab] = useState('theory');
  const [theoryAnswers, setTheoryAnswers] = useState(Array(checkpoint?.theoryQuestions?.length || 0).fill(''));
  const [codeFiles, setCodeFiles] = useState([{ fileName: 'filename', content: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const gutterRefs = useRef([]);

  const lastSubmission =
    checkpoint?.submissions?.length > 0
      ? checkpoint.submissions[checkpoint.submissions.length - 1]
      : null;

  useEffect(() => {
    if (lastSubmission && (checkpoint?.status === 'passed' || checkpoint?.status === 'failed_all')) {
      setResult(lastSubmission.feedback);
      setTheoryAnswers(lastSubmission.theoryAnswers || []);
      if (lastSubmission.codeFiles?.length > 0) setCodeFiles(lastSubmission.codeFiles);
    }
  }, [checkpoint?.status, lastSubmission]);

  const isReview = checkpoint?.status === 'passed' || checkpoint?.status === 'failed_all';
  const attemptsUsed = checkpoint?.attemptsUsed || 0;
  const maxAttempts = checkpoint?.maxAttempts || 3;

  const updateAnswer = (index, value) => {
    const next = [...theoryAnswers];
    next[index] = value;
    setTheoryAnswers(next);
  };

  const updateFile = (index, key, value) => {
    const next = [...codeFiles];
    next[index] = { ...next[index], [key]: value };
    setCodeFiles(next);
  };

  const addFile = () => setCodeFiles([...codeFiles, { fileName: 'filename', content: '' }]);
  const removeFile = (index) => setCodeFiles(codeFiles.filter((_, fileIndex) => fileIndex !== index));

  const syncScroll = (event, index) => {
    if (gutterRefs.current[index]) {
      gutterRefs.current[index].scrollTop = event.target.scrollTop;
    }
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}/day/${dayIndex}/checkpoint/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId,
          theoryAnswers,
          codeFiles: checkpoint.questionType === 'mixed' ? codeFiles : [],
        }),
      });
      const data = await res.json();
      if (data.feedback) setResult(data.feedback);
      onSubmitted(data);
    } catch (err) {
      console.error(err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="course-modal-backdrop fixed inset-0 z-[1100] flex items-stretch justify-center p-0 md:items-center md:p-6 bg-black/60 backdrop-blur-md" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="flex h-screen w-full max-w-6xl flex-col overflow-hidden md:h-[min(92vh,960px)] md:rounded-[2rem] border border-white/10 bg-[#12141c] shadow-[0_24px_90px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 md:px-7 bg-[#0c0d12]/50">
          <div>
            <p className="font-label text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">
              Day {dayIndex + 1} Checkpoint
            </p>
            <h2 className="mt-2 font-headline text-3xl font-black text-white">
              {isReview ? 'Checkpoint Review' : 'Show what you learned'}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-[#181a21] border border-white/10 px-3 py-1 text-xs font-bold text-slate-300 font-label">{attemptsUsed}/{maxAttempts} attempts used</span>
              {result && (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold font-label" style={{ borderColor: result.passed ? 'rgba(21, 128, 61, 0.3)' : 'rgba(185, 28, 28, 0.3)', color: result.passed ? '#4ade80' : '#f87171', backgroundColor: result.passed ? 'rgba(21, 128, 61, 0.1)' : 'rgba(185, 28, 28, 0.1)' }}>
                  {result.overallScore}% score
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-300 transition hover:bg-white/[0.1] hover:text-white cursor-pointer"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {checkpoint?.questionType === 'mixed' && (
          <div className="flex gap-2 px-5 pt-5 md:px-7 bg-[#0c0d12]/30">
            {[
              { key: 'theory', label: 'Theory' },
              { key: 'coding', label: 'Coding' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 font-label text-[11px] font-black uppercase tracking-[0.18em] transition cursor-pointer ${
                  activeTab === tab.key ? 'text-white' : 'text-zinc-400 hover:text-white hover:bg-white/5'
                }`}
                style={{
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #312e81, #111827)' : 'transparent',
                  border: activeTab === tab.key ? '1px solid rgba(99, 102, 241, 0.4)' : '1px solid rgba(255, 255, 255, 0.1)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="custom-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-8 md:py-6 bg-[#0c0d12]/20">
          {activeTab === 'theory' && (
            <div className="mx-auto w-full max-w-4xl space-y-5">
              {(checkpoint?.theoryQuestions || []).map((question, index) => {
                const feedback = result?.theoryScores?.find((entry) => entry.questionIndex === index);
                return (
                  <div key={index} className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-5 hover:bg-white/[0.045] transition-colors duration-200">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[0.95rem] font-headline text-xs font-black shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]"
                        style={{
                          background: feedback
                            ? feedback.score >= 60
                              ? 'rgba(34, 197, 94, 0.12)'
                              : 'rgba(239, 68, 68, 0.12)'
                            : 'rgba(99, 102, 241, 0.12)',
                          color: feedback ? (feedback.score >= 60 ? '#34d399' : '#f87171') : '#818cf8',
                        }}
                      >
                        {feedback ? feedback.score : index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-body text-sm font-semibold leading-7 text-white">
                          <MarkdownRenderer content={question.question} />
                        </div>
                      </div>
                    </div>

                    <textarea
                      value={theoryAnswers[index] || ''}
                      onChange={(event) => updateAnswer(index, event.target.value)}
                      disabled={isReview}
                      rows={5}
                      placeholder="Write your answer here..."
                      className="mt-4 w-full resize-y rounded-[1.2rem] border border-white/10 bg-black/40 p-4 font-body text-sm outline-none transition focus:border-indigo-500/50 text-slate-300 placeholder-slate-600 focus:bg-black/50"
                    />

                    {feedback?.feedback && (
                      <div className="mt-4 rounded-[1.2rem] border border-indigo-500/20 bg-indigo-500/10 p-4">
                        <p className="font-label text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                          Feedback
                        </p>
                        <div className="mt-2 font-body text-sm leading-7 text-indigo-100">
                          <MarkdownRenderer content={feedback.feedback} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'coding' && checkpoint?.questionType === 'mixed' && (
            <div className="mx-auto w-full max-w-4xl space-y-5">
              <div className="rounded-[1.7rem] border border-white/10 bg-white/[0.035] p-5">
                <p className="font-label text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                  Coding Challenge
                </p>
                <div className="mt-3 font-body text-sm leading-7 text-slate-300">
                  <MarkdownRenderer content={checkpoint.codingQuestion?.prompt} />
                </div>
                {checkpoint.codingQuestion?.expectedBehavior && (
                  <div className="mt-4 rounded-[1.2rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="font-label text-[10px] font-black uppercase tracking-[0.18em] text-emerald-400">
                      Expected Behavior
                    </p>
                    <div className="mt-2 font-body text-sm leading-7 text-emerald-100">
                      <MarkdownRenderer content={checkpoint.codingQuestion.expectedBehavior} />
                    </div>
                  </div>
                )}
              </div>

              {codeFiles.map((file, index) => (
                <div key={index} className="overflow-hidden rounded-[1.7rem] border border-white/10 bg-black/40">
                  <div className="flex items-center gap-3 border-b border-white/10 bg-white/[0.025] px-4 py-3">
                    <FileText className="h-4 w-4 text-zinc-400" />
                    <input
                      value={file.fileName}
                      onChange={(event) => updateFile(index, 'fileName', event.target.value)}
                      disabled={isReview}
                      className="flex-1 bg-transparent font-label text-[11px] font-black uppercase tracking-[0.18em] outline-none text-white placeholder-zinc-600"
                      placeholder="filename"
                    />
                    {codeFiles.length > 1 && !isReview && (
                      <button type="button" onClick={() => removeFile(index)} className="text-red-400 hover:text-red-300 cursor-pointer">
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  <div className="flex min-h-[220px] overflow-hidden bg-[#0a0b10]">
                    <div
                      ref={(element) => {
                        gutterRefs.current[index] = element;
                      }}
                      className="w-12 shrink-0 overflow-hidden border-r border-white/10 bg-[#0a0b10] py-5 pr-3 text-right font-mono text-[11px] text-slate-500"
                    >
                      {file.content.split('\n').map((_, lineIndex) => (
                        <div key={lineIndex} className="h-[21px]">
                          {lineIndex + 1}
                        </div>
                      ))}
                    </div>
                    <textarea
                      value={file.content}
                      onChange={(event) => updateFile(index, 'content', event.target.value)}
                      onScroll={(event) => syncScroll(event, index)}
                      disabled={isReview}
                      rows={10}
                      placeholder="Paste your code here..."
                      className="custom-scroll flex-1 resize-none bg-transparent p-5 font-mono text-[13px] leading-[21px] text-[#e5e7eb] outline-none placeholder-zinc-600"
                    />
                  </div>
                </div>
              ))}

              {!isReview && (
                <button type="button" onClick={addFile} className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-white/[0.045] px-5 py-4 text-sm font-black text-slate-300 transition hover:bg-white/[0.075] hover:text-white cursor-pointer">
                  <Plus className="h-4 w-4" />
                  Add File
                </button>
              )}

              {result?.codingScore && (
                <div className="rounded-[1.6rem] border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-label text-[10px] font-black uppercase tracking-[0.18em] text-indigo-400">
                      Coding Score
                    </p>
                    <span className="font-headline text-2xl font-black" style={{ color: result.codingScore.score >= 60 ? '#34d399' : '#f87171' }}>
                      {result.codingScore.score}/100
                    </span>
                  </div>
                  <p className="mt-3 font-body text-sm leading-7 text-slate-300">
                    {result.codingScore.feedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-5 md:px-7 bg-[#0c0d12]/50">
          {result ? (
            <div className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-black font-label" style={{ borderColor: result.passed ? 'rgba(21, 128, 61, 0.3)' : 'rgba(185, 28, 28, 0.3)', color: result.passed ? '#34d399' : '#f87171', backgroundColor: result.passed ? 'rgba(21, 128, 61, 0.1)' : 'rgba(185, 28, 28, 0.1)' }}>
              {result.passed ? 'Checkpoint passed' : 'Keep refining your answers'}
            </div>
          ) : (
            <div />
          )}

          {!isReview && attemptsUsed < maxAttempts ? (
            <button type="button" onClick={handleSubmit} disabled={submitting} className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-black text-black transition hover:bg-slate-200 disabled:opacity-50 cursor-pointer">
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin text-black" />
                  Grading
                </>
              ) : (
                <>
                  <Send className="h-4 w-4 text-black" />
                  Submit ({maxAttempts - attemptsUsed} left)
                </>
              )}
            </button>
          ) : (
            <button type="button" onClick={onClose} className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-5 py-3 text-sm font-black text-zinc-300 transition hover:bg-white/[0.1] hover:text-white cursor-pointer">
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-[104rem] space-y-6 px-4 pt-24 pb-20 sm:px-6 lg:px-8 animate-pulse">
      <div className="rounded-[2.6rem] border border-white/10 bg-[#12141c] p-8 md:p-12">
        <div className="h-10 w-56 rounded-full bg-white/[0.06]" />
        <div className="mt-6 h-16 w-3/4 rounded-2xl bg-white/[0.08]" />
        <div className="mt-4 h-6 w-1/2 rounded-xl bg-white/[0.05]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="h-96 rounded-[2rem] border border-white/10 bg-white/[0.04]" />
        <div className="h-72 rounded-[2rem] border border-white/10 bg-[#0d0e10]" />
      </div>
    </div>
  );
}

function StudyPulsePanel({ progress, currentDay }) {
  const safeProgress = clampProgress(progress);

  return (
    <div className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#181a21] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/40 to-transparent" />
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/70 font-label">Study pulse</p>
          <h2 className="mt-3 text-4xl font-black leading-none text-white font-headline">{safeProgress}%</h2>
          <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-zinc-500 font-body">
            {currentDay?.isFiller ? currentDay.fillerTopic : currentDay ? `Study block for day ${currentDay.dayNumber}` : 'Plan is complete!'}
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100">
          <Gauge className="h-6 w-6" />
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 font-label">
          <span>Overall</span>
          <span>{safeProgress}/100</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-white to-amber-200 transition-all duration-700"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, detail, accent = '#f5f5f5', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.22)]"
    >
      <div className="relative">
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 font-label">{label}</p>
        <p className="mt-2 text-3xl font-black text-white font-headline">{value}</p>
      </div>
      <p className="relative mt-2 text-xs font-semibold leading-5 text-zinc-500 font-body">{detail}</p>
    </motion.div>
  );
}

function CommandDeck({ course, currentDayIndex, currentDay, stats, days, onContinue }) {
  const progress = stats.progressPct;

  return (
    <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#12141c] shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.085),transparent_38%),linear-gradient(180deg,rgba(20,184,166,0.08),transparent_45%),linear-gradient(115deg,transparent_0%,rgba(245,158,11,0.08)_68%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8 xl:grid-cols-[minmax(0,1fr)_31rem]">

        {/* ── Left: Title + Up Next + Buttons ── */}
        <div className="flex min-w-0 flex-col gap-7">
          {/* Badges + Title */}
          <div>
            <div className="flex flex-wrap items-center gap-2.5">
              <Link to="/dashboard" className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-zinc-200 transition hover:bg-white/[0.1] hover:text-white">
                <ArrowLeft className="h-4 w-4" />
                Dashboard
              </Link>
              <span className="inline-flex items-center rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100 font-label">
                Playlist command center
              </span>
            </div>
            <h1 className="mt-6 break-words text-[2.2rem] font-black leading-[1.02] tracking-[-0.03em] text-white sm:text-[3rem] lg:text-[3.8rem] font-headline">
              {course.course_title}
            </h1>
            <p className="mt-4 text-[15px] leading-8 text-zinc-400 font-body">
              Your playlist has been reshaped into day-by-day study blocks with checkpoints so
              each session feels intentional instead of overwhelming.
            </p>
          </div>

          {/* Up Next card */}
          <div className="w-full max-w-[32rem] overflow-hidden rounded-[1.5rem] border border-white/10 bg-white/[0.055] p-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 font-label">Up next</p>
            <div className="mt-3 grid min-w-0 grid-cols-[auto_minmax(0,1fr)] gap-3">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
                <CirclePlay className="h-5 w-5" />
              </div>
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-zinc-400 font-body">
                  {currentDay ? `Day ${currentDay.dayNumber} of ${days.length}` : 'Plan is complete!'}
                </p>
                <h2 className="mt-1 break-words text-xl font-black leading-snug text-white line-clamp-2 font-headline">
                  {currentDay ? (currentDay.isFiller ? currentDay.fillerTopic : `Study Block ${currentDay.dayNumber}`) : 'All set!'}
                </h2>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              onClick={onContinue}
              className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 cursor-pointer"
            >
              Continue <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* ── Right: Study Pulse + Metrics ── */}
        <div className="flex flex-col gap-4 lg:items-end">
          <StudyPulsePanel progress={progress} currentDay={currentDay} />
          <div className="grid w-full grid-cols-2 gap-3">
            <MetricTile label="Days" value={days.length} detail="Study blocks" accent="#b9f9ff" />
            <MetricTile label="Videos" value={stats.totalVideos} detail="Learning items" accent="#ffffff" delay={0.04} />
            <MetricTile label="Total Time" value={formatDuration(stats.totalDuration)} detail="Duration" accent="#6ee7b7" delay={0.08} />
            <MetricTile label="Completed" value={stats.completedDays} detail="Passed blocks" accent="#fde68a" delay={0.12} />
          </div>
        </div>

      </div>
    </section>
  );
}

function SyllabusToolbar({ query, setQuery, filter, setFilter, visibleCount, totalCount }) {
  const filters = [
    { key: 'all', label: 'All' },
    { key: 'active', label: 'Active' },
    { key: 'completed', label: 'Done' },
    { key: 'locked', label: 'Locked' },
  ];

  return (
    <div className="flex flex-col gap-4 border-b border-white/10 px-5 py-5 lg:flex-row lg:items-center lg:justify-between bg-transparent">
      <div className="flex items-center gap-4">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
          <Layers className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500 font-label">Playlist path</p>
          <h2 className="mt-1 text-2xl font-black text-white font-headline">Syllabus board</h2>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex min-h-12 items-center gap-3 rounded-full border border-white/10 bg-black/30 px-4 focus-within:border-indigo-200/30">
          <Search className="h-4 w-4 text-zinc-500" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search lessons"
            className="w-full min-w-0 bg-transparent text-sm font-semibold text-white outline-none placeholder:text-zinc-600 sm:w-60"
          />
        </div>

        <div className="flex gap-1 overflow-x-auto rounded-full border border-white/10 bg-black/25 p-1 custom-scroll-x">
          {filters.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-black transition cursor-pointer ${
                filter === item.key ? 'bg-white text-black' : 'text-zinc-400 hover:bg-white/[0.06] hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <span className="text-xs font-bold text-zinc-600">{visibleCount}/{totalCount}</span>
      </div>
    </div>
  );
}

function SyllabusBoard({ courseId, days, currentDayIndex, query, setQuery, filter, setFilter, filteredDays, visibleCount, totalCount, onStartCheckpoint }) {
  const navigate = useNavigate();

  return (
    <section className="overflow-hidden rounded-[2rem] border border-white/10 bg-[#12141c] shadow-[0_24px_80px_rgba(0,0,0,0.34)]">
      <SyllabusToolbar
        query={query}
        setQuery={setQuery}
        filter={filter}
        setFilter={setFilter}
        visibleCount={visibleCount}
        totalCount={totalCount}
      />

      <div className="p-5 sm:p-6 lg:p-7 bg-[#0c0d12]/50">
        {visibleCount === 0 ? (
          <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.025] text-center">
            <HelpCircle className="h-8 w-8 text-zinc-600" />
            <h3 className="mt-4 text-xl font-black text-white font-headline">No study blocks found</h3>
            <p className="mt-2 text-sm text-zinc-500 font-body">Adjust your query search terms or filter buttons.</p>
          </div>
        ) : (
          <div className="space-y-8">
            {filteredDays.map(({ day, dayIndex }) => {
              const isCurrent = dayIndex === currentDayIndex;
              const checkpointStatus = day.checkpoint?.status || 'locked';
              const locked = checkpointStatus === 'locked';
              const showCheckpointButton =
                (isCurrent || checkpointStatus === 'available' || checkpointStatus === 'passed' || checkpointStatus === 'failed_all') &&
                day.status !== 'ready';

              return (
                <div key={day._id || dayIndex} id={`day-section-${dayIndex}`} className="relative">
                  {/* Day Header Block */}
                  <div className={`mb-4 flex flex-col gap-4 rounded-[1.5rem] border p-4 sm:flex-row sm:items-center sm:justify-between transition-colors duration-300 ${
                    isCurrent
                      ? 'border-indigo-500/30 bg-[#181a24] shadow-[0_4px_24px_rgba(99,102,241,0.06)]'
                      : 'border-white/10 bg-white/[0.045]'
                  }`}>
                    <div className="flex min-w-0 items-center gap-4">
                      <div className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl text-lg font-black font-headline transition ${
                        isCurrent
                          ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.3)] border border-indigo-400/20'
                          : day.status === 'ready'
                          ? 'bg-emerald-500 text-white border border-emerald-400/20'
                          : 'bg-white/[0.06] text-zinc-300 border border-white/5'
                      }`}>
                        {day.dayNumber}
                      </div>
                      <div className="min-w-0">
                        <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500 font-label">Day {day.dayNumber}</p>
                        <h3 className="mt-1 truncate text-2xl font-black text-white font-headline">
                          {day.isFiller ? day.fillerTopic : `Study Block ${day.dayNumber}`}
                        </h3>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3">
                      <div className="h-2 w-32 overflow-hidden rounded-full bg-white/10 shrink-0">
                        <div
                          className={`h-full rounded-full bg-gradient-to-r transition-all duration-700 ${
                            day.status === 'ready'
                              ? 'from-emerald-400 to-emerald-300'
                              : isCurrent
                              ? 'from-indigo-400 to-cyan-300'
                              : 'from-zinc-600 to-zinc-400'
                          }`}
                          style={{ width: day.status === 'ready' ? '100%' : isCurrent ? '50%' : '0%' }}
                        />
                      </div>
                      <span className="text-xs font-black text-zinc-500 w-12 text-right">
                        {day.status === 'ready' ? '100%' : isCurrent ? 'Active' : '0%'}
                      </span>
                      <StatusPill status={day.status} />
                    </div>
                  </div>

                  {/* Videos Rows List */}
                  <div className="space-y-2.5">
                    {day.videos.map((video, videoIndex) => (
                      <button
                        key={videoIndex}
                        type="button"
                        disabled={locked}
                        onClick={() => !locked && navigate(`/playlist/${courseId}/day/${dayIndex}`)}
                        className={`group w-full overflow-hidden rounded-[1.35rem] border px-4 py-4 sm:px-5 border-white/5 bg-white/[0.03] transition-all duration-200 text-left ${
                          locked
                            ? 'opacity-40 cursor-not-allowed'
                            : 'hover:border-white/20 hover:bg-white/[0.06] hover:translate-x-1 cursor-pointer'
                        }`}
                      >
                        <div className="grid gap-4 grid-cols-[auto_minmax(0,1fr)_auto] items-center">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-2xl border ${
                            locked
                              ? 'border-white/5 bg-white/[0.02] text-zinc-600'
                              : isCurrent
                              ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-400'
                              : day.status === 'ready'
                              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                              : 'border-white/10 bg-black/30 text-white'
                          }`}>
                            {locked ? <Lock className="h-5 w-5" /> : <CirclePlay className="h-5 w-5" />}
                          </div>
                          <div className="min-w-0">
                            <span className={`rounded-full border px-2.5 py-0.5 text-[9px] font-black uppercase tracking-[0.18em] ${
                              locked
                                ? 'border-white/5 text-zinc-600'
                                : isCurrent
                                ? 'border-indigo-500/20 bg-indigo-500/10 text-indigo-300'
                                : 'border-white/10 bg-white/[0.04] text-zinc-400'
                            }`}>
                              Video {videoIndex + 1}
                            </span>
                            <h3 className={`mt-2.5 text-base font-black leading-snug truncate ${locked ? 'text-zinc-600' : 'text-slate-100 group-hover:text-white font-headline'}`}>
                              {video.title}
                            </h3>
                            <p className="mt-1 text-xs text-zinc-500 font-body">
                              {video.channel || 'YouTube'} • {formatDuration(video.duration)}
                            </p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-black uppercase tracking-[0.18em] ${locked ? 'text-zinc-700' : 'text-zinc-500 group-hover:text-white font-label'}`}>
                              {locked ? 'Locked' : 'Play'}
                            </span>
                            <ChevronRight className={`h-4 w-4 ${locked ? 'text-zinc-700' : 'text-zinc-500 group-hover:text-white'}`} />
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>

                  {/* Day Action Buttons (Nav and Checkpoint) */}
                  <div className="mt-4 flex flex-wrap gap-3 border-t border-white/5 pt-4 pb-6">
                    <button
                      type="button"
                      disabled={locked}
                      onClick={() => !locked && navigate(`/playlist/${courseId}/day/${dayIndex}`)}
                      className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:-translate-y-0.5 hover:bg-zinc-200 disabled:opacity-40 cursor-pointer"
                    >
                      {locked ? <Lock className="h-4 w-4" /> : <CirclePlay className="h-4 w-4" />}
                      {locked ? 'Locked' : day.status === 'ready' ? `Review Day ${day.dayNumber}` : `Start Day ${day.dayNumber}`}
                    </button>
                    {showCheckpointButton && (
                      <button
                        type="button"
                        onClick={() => onStartCheckpoint(dayIndex)}
                        className="inline-flex min-h-11 items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-sm font-bold text-zinc-300 transition hover:-translate-y-0.5 hover:bg-white/[0.09] hover:text-white cursor-pointer"
                      >
                        <Trophy className="h-4 w-4 text-zinc-400" />
                        {checkpointStatus === 'passed'
                          ? 'Review Checkpoint'
                          : checkpointStatus === 'failed_all'
                          ? 'Open Results'
                          : 'Take Checkpoint'}
                      </button>
                    )}
                    {day.status === 'ready' && (
                      <div className="inline-flex items-center gap-2 text-emerald-400 text-xs font-black uppercase tracking-wider pl-1 py-2">
                        <ShieldCheck className="h-4.5 w-4.5" />
                        Day Complete & Verified
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

function PlaylistHealthPanel({ days, currentDayIndex }) {
  return (
    <section className="flex min-h-0 flex-1 flex-col rounded-[2rem] border border-white/10 bg-[#0d0e10] p-4 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
      <div className="mb-4 flex shrink-0 items-center justify-between gap-3 px-1">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-zinc-500 font-label">Day stack</p>
          <h2 className="mt-1 text-xl font-black text-white font-headline">Plan health</h2>
        </div>
        <span className="rounded-full border border-white/10 px-2.5 py-1 text-[10px] font-black text-zinc-500 font-label">{days.length}</span>
      </div>

      <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1 custom-scroll bg-transparent">
        {days.map((day, index) => {
          const active = currentDayIndex === index;
          const progress = day.status === 'ready' ? 100 : active ? 50 : 0;

          return (
            <button
              key={index}
              type="button"
              onClick={() => scrollToElement(`day-section-${index}`)}
              className={`group w-full rounded-[1.15rem] border px-3 py-2.5 text-left transition hover:-translate-y-0.5 cursor-pointer ${
                active
                  ? 'border-indigo-500/30 bg-[#1b1c24]'
                  : 'border-white/[0.08] bg-white/[0.03] hover:border-white/[0.16] hover:bg-white/[0.055]'
              }`}
            >
              <div className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-xl text-xs font-black ${active ? 'bg-indigo-400 text-black border border-indigo-400/20' : 'bg-black/35 text-zinc-300'}`}>
                  {index + 1}
                </div>
                <div className="min-w-0">
                  <p className={`truncate text-xs font-black ${active ? 'text-white font-headline' : 'text-zinc-300 group-hover:text-white font-body'}`}>
                    {day.isFiller ? day.fillerTopic : `Day ${day.dayNumber} Study Block`}
                  </p>
                  <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/[0.08]">
                    <div
                      className={`h-full rounded-full transition-all duration-700 ${active ? 'bg-indigo-400' : progress === 100 ? 'bg-emerald-300' : 'bg-white/40'}`}
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>
                <span className="text-[11px] font-black text-zinc-500 font-label">{progress}%</span>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
}

export default function PlaylistCourseMap() {
  const { courseId } = useParams();
  const { user } = useUser();
  const navigate = useNavigate();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkpointDay, setCheckpointDay] = useState(null);
  const [checkpointData, setCheckpointData] = useState(null);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}`);
      const data = await res.json();
      if (data.success) setCourse(data.course);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    const shouldLockBody = loadingCheckpoint || (checkpointData && checkpointDay !== null);
    if (!shouldLockBody) return undefined;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [checkpointData, checkpointDay, loadingCheckpoint]);

  const handleStartCheckpoint = async (dayIdx) => {
    setLoadingCheckpoint(true);
    setCheckpointDay(dayIdx);
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}/day/${dayIdx}/checkpoint`);
      const data = await res.json();
      if (data.success) setCheckpointData(data.checkpoint);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCheckpoint(false);
    }
  };

  const days = course?.days || [];
  const currentDayIndex = course?.currentDayIndex || 0;

  const stats = useMemo(() => {
    const totalVideos = days.reduce((sum, day) => sum + day.videos.length, 0);
    const totalDuration = days.reduce((sum, day) => sum + day.totalDuration, 0);
    const completedDays = days.filter((day) => day.status === 'ready').length;
    const progressPct = days.length > 0 ? Math.round((completedDays / days.length) * 100) : 0;
    return { totalVideos, totalDuration, completedDays, progressPct };
  }, [days]);

  const filteredDays = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return days
      .map((day, dayIndex) => {
        const matchesQuery = !normalizedQuery
          || (day.isFiller && day.fillerTopic?.toLowerCase().includes(normalizedQuery))
          || day.videos.some(v => v.title?.toLowerCase().includes(normalizedQuery));

        const checkpointStatus = day.checkpoint?.status || 'locked';
        const matchesFilter = filter === 'all'
          || (filter === 'active' && dayIndex === currentDayIndex)
          || (filter === 'completed' && day.status === 'ready')
          || (filter === 'locked' && checkpointStatus === 'locked');

        return { day, dayIndex, matchesQuery, matchesFilter };
      })
      .filter(({ matchesQuery, matchesFilter }) => matchesQuery && matchesFilter);
  }, [days, query, filter, currentDayIndex]);

  if (loading) {
    return (
      <DashboardShell title="Loading" showCreate={false} disableDefaultPadding>
        <LoadingState />
      </DashboardShell>
    );
  }

  if (!course || !course.days) {
    return (
      <DashboardShell title="Not Found" showCreate={false} disableDefaultPadding>
        <div className="flex min-h-screen items-center justify-center px-6 bg-[#050505]">
          <div className="max-w-xl rounded-[2.4rem] border border-white/10 bg-[#12141c] px-8 py-10 text-center shadow-[0_24px_90px_rgba(0,0,0,0.4)] w-full">
            <h1 className="font-serif text-4xl font-semibold text-white tracking-tight">
              Playlist course not found
            </h1>
            <p className="mt-4 text-sm leading-7 text-slate-400 font-body">
              We could not load this study plan. Head back to the dashboard and open it again.
            </p>
            <Link to="/dashboard" className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-slate-200 mt-6 min-w-[200px] mx-auto cursor-pointer">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={course.course_title}
      eyebrow="Playlist Plan"
      showCreate={false}
    >
      {checkpointData && checkpointDay !== null && (
        <CheckpointModal
          checkpoint={checkpointData}
          courseId={courseId}
          dayIndex={checkpointDay}
          clerkId={user?.id}
          onClose={() => {
            setCheckpointData(null);
            setCheckpointDay(null);
          }}
          onSubmitted={() => fetchCourse()}
        />
      )}

      {loadingCheckpoint && (
        <div className="course-modal-backdrop fixed inset-0 z-[1090] flex items-center justify-center">
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-[#181a21] px-8 py-8 text-center shadow-2xl">
            <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
            <p className="font-body text-sm text-slate-300">
              Preparing checkpoint questions...
            </p>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-[104rem] flex flex-col gap-6">
        <div className="order-1">
          <CommandDeck
            course={course}
            currentDayIndex={currentDayIndex}
            currentDay={days[currentDayIndex] || null}
            stats={stats}
            days={days}
            onContinue={() => navigate(`/playlist/${courseId}/day/${currentDayIndex}`)}
          />
        </div>

        <div className="order-2 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
          <SyllabusBoard
            courseId={courseId}
            days={days}
            currentDayIndex={currentDayIndex}
            query={query}
            setQuery={setQuery}
            filter={filter}
            setFilter={setFilter}
            filteredDays={filteredDays}
            visibleCount={filteredDays.length}
            totalCount={days.length}
            onStartCheckpoint={handleStartCheckpoint}
          />

          <aside className="min-w-0 self-start xl:sticky xl:top-24 xl:flex xl:h-[calc(100dvh-9rem)] xl:flex-col xl:gap-6 xl:overflow-hidden">
            <PlaylistHealthPanel days={days} currentDayIndex={currentDayIndex} />
          </aside>
        </div>
      </div>
    </DashboardShell>
  );
}
