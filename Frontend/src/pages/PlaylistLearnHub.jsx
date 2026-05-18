import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowLeft,
  ArrowRight,
  Bot,
  Check,
  CheckCircle2,
  ChevronRight,
  CirclePlay,
  Clock,
  FileText,
  HelpCircle,
  Layers,
  Loader2,
  Lock,
  Plus,
  Send,
  ShieldCheck,
  Sparkles,
  Trophy,
  Video,
  VideoOff,
  X
} from 'lucide-react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useUsage } from '../contexts/UsageContext';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';

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

function CheckpointModal({ checkpoint, courseId, dayIndex, clerkId, onClose, onSubmitted, plan }) {
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
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold font-label" style={{ borderColor: result.passed ? 'rgba(21, 128, 61, 0.3)' : 'rgba(185, 28, 28, 0.3)', color: result.passed ? '#34d399' : '#f87171', backgroundColor: result.passed ? 'rgba(21, 128, 61, 0.1)' : 'rgba(185, 28, 28, 0.1)' }}>
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
                  <Send className="h-4 w-4 text-black animate-pulse" />
                  Submit ({maxAttempts - attemptsUsed} left)
                  <CreditCost cost={getCostForAction(plan, 'playlistCheckpointGrading')} className="text-black ml-2" />
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

function VideoListItem({ video, index, isActive, isWatched, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className={`group flex w-full items-center gap-3 rounded-[1.2rem] border px-4 py-3 text-left transition cursor-pointer ${
        isActive
          ? 'border-indigo-500/25 bg-[#1b1c24]'
          : 'border-white/5 bg-[#12141c] hover:border-white/10 hover:bg-white/[0.055]'
      }`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: isActive ? 'rgba(99, 102, 241, 0.12)' : isWatched ? 'rgba(52, 211, 153, 0.12)' : 'rgba(255, 255, 255, 0.06)',
          color: isActive ? '#818cf8' : isWatched ? '#34d399' : '#e2e8f0',
        }}
      >
        {isWatched ? (
          <Check className="h-4 w-4" />
        ) : (
          <span className="font-label text-xs font-black">{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className={`truncate font-body text-sm font-semibold transition ${isActive ? 'text-white' : 'text-slate-300 group-hover:text-white'}`}>
          {video.title}
        </p>
        <p className="mt-1 truncate font-body text-xs text-zinc-500">
          {video.channel || 'YouTube'} • {formatDuration(video.duration)}
        </p>
      </div>

      <span className="transition" style={{ color: isActive ? '#818cf8' : isWatched ? '#34d399' : 'rgba(255, 255, 255, 0.2)' }}>
        {isActive ? <CirclePlay className="h-5.5 w-5.5 text-indigo-400" /> : isWatched ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : <div className="h-5 w-5 rounded-full border-2 border-white/10" />}
      </span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-[104rem] space-y-6 px-4 pt-24 pb-20 sm:px-6 lg:px-8 animate-pulse">
      <div className="rounded-[2.4rem] border border-white/10 bg-[#12141c] p-8 md:p-12">
        <div className="h-10 w-56 rounded-full bg-white/[0.06]" />
        <div className="mt-6 h-16 w-3/4 rounded-2xl bg-white/[0.08]" />
        <div className="mt-4 h-6 w-1/2 rounded-xl bg-white/[0.05]" />
      </div>
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="h-[34rem] rounded-[2rem] border border-white/10 bg-white/[0.04]" />
        <div className="h-[34rem] rounded-[2rem] border border-white/10 bg-[#0d0e10]" />
      </div>
    </div>
  );
}

function StudyPulsePanel({ progress, watchedCount, totalVideos }) {
  const safeProgress = clampProgress(progress);

  return (
    <div className="relative overflow-hidden rounded-[1.65rem] border border-white/10 bg-[#181a21] p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)] sm:col-span-2 lg:col-span-2 xl:col-span-2">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-100/40 to-transparent" />
      <div className="flex items-start justify-between gap-5">
        <div className="min-w-0">
          <p className="text-[10px] font-black uppercase tracking-[0.24em] text-cyan-100/70 font-label">Daily pulse</p>
          <h2 className="mt-3 text-4xl font-black leading-none text-white font-headline">{safeProgress}%</h2>
          <p className="mt-3 text-sm font-semibold leading-6 text-zinc-500 font-body">Progress through planned daily material.</p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10 text-cyan-100 font-label text-sm font-black">
          {watchedCount}/{totalVideos}
        </div>
      </div>
      <div className="mt-6">
        <div className="mb-2 flex items-center justify-between text-[10px] font-black uppercase tracking-[0.18em] text-zinc-600 font-label">
          <span>Watched</span>
          <span>{safeProgress}%</span>
        </div>
        <div className="h-2 overflow-hidden rounded-full bg-white/[0.08]">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-200 via-white to-emerald-200 transition-all duration-700"
            style={{ width: `${safeProgress}%` }}
          />
        </div>
      </div>
    </div>
  );
}

function MetricTile({ label, value, detail, delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -3, scale: 1.01 }}
      className="group relative overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[0.045] p-4 shadow-[0_18px_54px_rgba(0,0,0,0.22)]"
    >
      <div>
        <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 font-label">{label}</p>
        <p className="mt-2 text-3xl font-black text-white font-headline">{value}</p>
      </div>
      <p className="mt-2 text-xs font-semibold leading-5 text-zinc-500 font-body">{detail}</p>
    </motion.div>
  );
}

function LearningCommandDeck({ course, day, dayProgress, watchedCount, videos, plan }) {
  return (
    <section className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#12141c] shadow-[0_24px_90px_rgba(0,0,0,0.38)]">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.085),transparent_38%),linear-gradient(180deg,rgba(99,102,241,0.08),transparent_45%),linear-gradient(115deg,transparent_0%,rgba(245,158,11,0.08)_68%,transparent_100%)]" />
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/35 to-transparent" />

      <div className="relative grid gap-8 p-5 sm:p-7 lg:grid-cols-[minmax(0,1fr)_24rem] lg:p-8 xl:grid-cols-[minmax(0,1fr)_31rem]">
        {/* Left Side Info */}
        <div className="flex min-w-0 flex-col gap-6">
          <div className="flex flex-wrap items-center gap-2.5">
            <Link to={`/playlist/${course._id}`} className="inline-flex min-h-10 items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-xs font-black text-zinc-200 transition hover:bg-white/[0.1] hover:text-white">
              <ArrowLeft className="h-4 w-4" />
              Syllabus Map
            </Link>
            <span className="inline-flex rounded-full border border-cyan-300/20 bg-cyan-300/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100 font-label">
              Playlist Day {day.dayNumber}
            </span>
          </div>

          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 font-label">
              {course.course_title}
            </p>
            <h1 className="mt-3 break-words text-[2.2rem] font-black leading-[1.02] tracking-[-0.03em] text-white sm:text-[3rem] lg:text-[3.8rem] font-headline">
              {day.isFiller ? `Focus: ${day.fillerTopic}` : `Study block for day ${day.dayNumber}`}
            </h1>
            <p className="mt-4 text-[15px] leading-8 text-zinc-400 font-body">
              Move through the videos in order, check them off as you finish, then take the checkpoint to complete the day.
            </p>
          </div>
        </div>

        {/* Right Side Pulse + Metrics */}
        <div className="flex flex-col gap-4 lg:items-end">
          <StudyPulsePanel progress={dayProgress} watchedCount={watchedCount} totalVideos={videos.length} />
          <div className="grid w-full grid-cols-2 gap-3">
            <MetricTile label="Videos" value={videos.length} detail="Learning items" />
            <MetricTile label="Time" value={formatDuration(day.totalDuration)} detail="Total duration" delay={0.04} />
          </div>
        </div>
      </div>
    </section>
  );
}

// locally embedded TutorPanel sidebar just like GuidedStudyPlanHub
function TutorPanel({ courseId, moduleIndex, subtopicIndex, user, activeVideoTitle, plan }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      text: 'I am here with the video open. Select a video, watch it, and ask me what feels fuzzy.',
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
        text: `New video topic loaded: "${activeVideoTitle || 'Introduction'}". Ask a doubt from this lesson below!`,
      },
    ]);
    setInput('');
  }, [courseId, moduleIndex, subtopicIndex, activeVideoTitle]);

  const sendMessage = async () => {
    const finalMessage = input.trim();
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
          explainMode: 'solving video doubts',
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

  return (
    <aside className="no-scrollbar flex min-h-0 w-full h-full flex-col overflow-hidden rounded-[2rem] border border-white/10 bg-[#12141c] shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
      <div className="border-b border-white/10 bg-transparent p-4">
        <div className="flex items-start gap-4">
          <div className="mt-1 flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl border border-cyan-200/20 bg-cyan-200/10">
             <span className="relative flex h-3 w-3">
               <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-200 opacity-75"></span>
               <span className="relative inline-flex h-3 w-3 rounded-full bg-cyan-100"></span>
             </span>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[10px] font-black uppercase tracking-[0.25em] text-cyan-100/70 font-label">Tutor Chat</p>
            <h2 className="mt-0.5 text-xl font-black tracking-tight text-white font-headline">Ask beside the video</h2>
          </div>
        </div>
      </div>

      <div ref={chatContainerRef} className="no-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain p-4 bg-transparent">
        {messages.map((message, index) => (
          <div key={`${message.role}-${index}`} className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[92%] rounded-2xl px-5 py-4 text-sm leading-relaxed ${
              message.role === 'user'
                ? 'bg-white text-black shadow-md rounded-br-sm font-medium'
                : 'border border-white/10 bg-white/[0.055] text-slate-300 shadow-sm rounded-bl-sm font-body'
            }`}>
              {message.role === 'assistant' ? <MarkdownRenderer content={message.text} /> : <p>{message.text}</p>}
            </div>
          </div>
        ))}
        {sending && (
          <div className="flex justify-start">
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.055] px-4 py-2 text-sm font-semibold text-slate-400 font-body">
              <Loader2 className="h-4 w-4 animate-spin text-cyan-100" />
              Thinking with video transcript context...
            </div>
          </div>
        )}
      </div>

      <div className="border-t border-white/10 bg-transparent p-4">
        <div className="flex items-center gap-3 rounded-[2rem] border border-white/10 bg-white/[0.055] p-1.5 shadow-sm transition-all focus-within:border-cyan-200/40">
          <textarea
            value={input}
            onChange={(event) => setInput(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                sendMessage();
              }
            }}
            placeholder={`Ask about ${activeVideoTitle || 'this video'}...`}
            rows={1}
            className="h-12 flex-1 resize-none overflow-hidden whitespace-nowrap bg-transparent px-4 py-3 text-sm font-medium leading-6 text-white outline-none placeholder:text-slate-500 custom-scroll"
          />
          <button type="button" disabled={sending || !input.trim()} onClick={() => sendMessage()} className="flex h-[40px] shrink-0 items-center justify-center gap-1.5 rounded-full bg-white px-4 text-black shadow-sm transition hover:scale-105 disabled:opacity-40 disabled:hover:scale-100 cursor-pointer">
            <Send className="h-4 w-4" />
            <CreditCost cost={getCostForAction(plan, 'tutorChat')} className="text-black" />
          </button>
        </div>
      </div>
    </aside>
  );
}

export default function PlaylistLearnHub() {
  const { courseId, dayIndex: dayIdxStr } = useParams();
  const dayIndex = parseInt(dayIdxStr, 10);
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [watchedSet, setWatchedSet] = useState(new Set());
  const [showCheckpoint, setShowCheckpoint] = useState(false);
  const [checkpointData, setCheckpointData] = useState(null);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);
  const { usageData, fetchUsage } = useUsage();

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        const d = data.course.days?.[dayIndex];
        if (d?.checkpoint?.status === 'passed' || d?.status === 'ready') {
          setWatchedSet(new Set(d.videos.map((_, i) => i)));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId, dayIndex]);

  useEffect(() => { setActiveVideoIdx(0); }, [courseId, dayIndex]);
  useEffect(() => { fetchCourse(); }, [fetchCourse, isLoaded]);

  useEffect(() => {
    const shouldLock = loadingCheckpoint || showCheckpoint;
    if (!shouldLock) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [loadingCheckpoint, showCheckpoint]);

  const handleMarkWatched = () => {
    let nextSet;
    setWatchedSet((prev) => {
      nextSet = new Set(prev);
      nextSet.add(activeVideoIdx);
      return nextSet;
    });
    const curDay = course?.days?.[dayIndex];
    if (!curDay) return;
    for (let i = activeVideoIdx + 1; i < curDay.videos.length; i += 1) {
      if (!nextSet?.has(i)) {
        setActiveVideoIdx(i);
        return;
      }
    }
  };

  const handleStartCheckpoint = async () => {
    setLoadingCheckpoint(true);
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}/day/${dayIndex}/checkpoint`);
      const data = await res.json();
      if (data.success) {
        setCheckpointData(data.checkpoint);
        setShowCheckpoint(true);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingCheckpoint(false);
    }
  };

  const handleMarkDayComplete = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}/day/${dayIndex}/ready`, { method: 'POST' });
      const data = await res.json();
      if (data.success) fetchCourse();
    } catch (err) {
      console.error(err);
    }
  };

  // Derive values
  const day = course?.days?.[dayIndex];
  const videos = day?.videos || [];
  const activeVideo = videos[activeVideoIdx];
  const allWatched = watchedSet.size >= videos.length && videos.length > 0;
  const checkpointStatus = day?.checkpoint?.status || 'locked';
  const dayCompleted = day?.status === 'ready' || checkpointStatus === 'passed';
  const hasTutorAccess = usageData ? usageData.plan === 'pro' || usageData.plan === 'ultra' : false;

  const dayProgress = useMemo(() => {
    if (videos.length === 0) return 0;
    return Math.round((watchedSet.size / videos.length) * 100);
  }, [videos.length, watchedSet.size]);

  if (loading) return (
    <DashboardShell title="Loading" showCreate={false} disableDefaultPadding>
      <LoadingState />
    </DashboardShell>
  );

  if (!day) {
    return (
      <DashboardShell title="Not Found" showCreate={false} disableDefaultPadding>
        <div className="flex min-h-screen items-center justify-center px-6 bg-[#050505]">
          <div className="max-w-xl rounded-[2.4rem] border border-white/10 bg-[#12141c] px-8 py-10 text-center shadow-[0_24px_90px_rgba(0,0,0,0.4)] w-full">
            <h1 className="font-serif text-4xl font-semibold text-white tracking-tight">Day not found</h1>
            <p className="mt-4 text-sm leading-7 text-slate-400 font-body">
              This study day could not be loaded. Return to the playlist overview and pick another one.
            </p>
            <Link to={`/playlist/${courseId}`} className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-slate-200 mt-6 min-w-[200px] mx-auto cursor-pointer">
              Back to Study Plan
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <>
      <DashboardShell
        title={activeVideo?.title || `Day ${day.dayNumber}`}
        eyebrow={`Playlist Day ${day.dayNumber}`}
        showCreate={false}
      >
        {showCheckpoint && checkpointData && (
          <CheckpointModal
            checkpoint={checkpointData}
            courseId={courseId}
            dayIndex={dayIndex}
            clerkId={user?.id}
            onClose={() => {
              setShowCheckpoint(false);
              setCheckpointData(null);
            }}
            onSubmitted={() => fetchCourse()}
            plan={usageData?.plan}
          />
        )}

        {loadingCheckpoint && (
          <div className="course-modal-backdrop fixed inset-0 z-[1090] flex items-center justify-center">
            <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-[#181a21] px-8 py-8 text-center shadow-2xl">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              <p className="font-body text-sm text-slate-300">Preparing checkpoint questions...</p>
            </div>
          </div>
        )}

        <div className="mx-auto max-w-[104rem] flex flex-col gap-6">
          <div className="order-1">
            <LearningCommandDeck
              course={course}
              day={day}
              dayProgress={dayProgress}
              watchedCount={watchedSet.size}
              videos={videos}
              plan={usageData?.plan}
            />
          </div>

          <div className="order-2 grid gap-6 xl:grid-cols-[minmax(0,1fr)_24rem]">
            {/* Left Column: Active Video, Video stack list queue, Actions Grid */}
            <section className="min-w-0 space-y-6">
              {/* Active Video card */}
              <div className="w-full overflow-hidden rounded-[2.2rem] border border-white/10 bg-[#12141c] p-4 shadow-[0_24px_80px_rgba(0,0,0,0.32)]">
                {activeVideo?.videoId ? (
                  <div className="aspect-video overflow-hidden rounded-[1.6rem] bg-black border border-white/5 shadow-2xl">
                    <iframe
                      className="h-full w-full"
                      src={`https://www.youtube.com/embed/${activeVideo.videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0`}
                      title={activeVideo.title}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>
                ) : (
                  <div className="flex aspect-video flex-col items-center justify-center rounded-[1.6rem] bg-[#0a0b10] px-6 text-center border border-white/5">
                    <VideoOff className="h-14 w-14 text-zinc-600 animate-pulse" />
                    <p className="mt-4 font-body text-sm leading-7 text-zinc-400">No video is attached to this item.</p>
                  </div>
                )}
              </div>

              {/* Interactive Video Stack Queue list */}
              <div id="playlist-day-queue" className="w-full rounded-[2.2rem] border border-white/10 bg-[#0d0e10] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.28)]">
                <div className="flex items-center justify-between border-b border-white/5 pb-4 mb-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 font-label">Video Stack</p>
                    <h3 className="mt-1 text-xl font-black text-white font-headline">Playlist Day Queue</h3>
                  </div>
                  <div className="rounded-full border border-indigo-500/20 bg-indigo-500/10 px-3 py-1 text-indigo-400 font-label text-xs font-black">
                    {watchedSet.size}/{videos.length} completed
                  </div>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 max-h-[22rem] overflow-y-auto pr-1 custom-scroll bg-transparent">
                  {videos.map((video, index) => (
                    <VideoListItem
                      key={video.videoId || index}
                      video={video}
                      index={index}
                      isActive={index === activeVideoIdx}
                      isWatched={watchedSet.has(index)}
                      onClick={(clickedIndex) => setActiveVideoIdx(clickedIndex)}
                    />
                  ))}
                </div>
              </div>

              {/* Responsive Actions Grid (Source, Action, Checkpoint) */}
              <div className="grid gap-4 md:grid-cols-1 lg:grid-cols-3">
                {/* 1. Video Source Card */}
                <div className="min-w-0 rounded-[2rem] border border-white/10 bg-[#12141c] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 font-label">Video Source</p>
                  <div className="mt-4 flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 shadow-[0_0_15px_rgba(239,68,68,0.15)]">
                      <Video className="h-5 w-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-black text-white font-headline">{activeVideo?.channel || 'YouTube lesson'}</p>
                      <p className="mt-2 text-sm leading-6 text-zinc-400 font-body">
                        Duration {formatDuration(activeVideo?.duration)}. Watch fully, then check it off.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. Day Action Card */}
                <div className="min-w-0 rounded-[2rem] border border-white/10 bg-[#12141c] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 font-label">Day Action</p>
                  <div className="mt-4 flex flex-col gap-4">
                    {watchedSet.has(activeVideoIdx) ? (
                      <div className="flex items-center gap-3 rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <CheckCircle2 className="h-5.5 w-5.5 text-emerald-400" />
                        <div>
                          <p className="text-sm font-black text-emerald-300 font-headline">Completed</p>
                          <p className="font-body text-xs text-emerald-400/70">Checked off.</p>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={handleMarkWatched}
                        className="flex min-h-11 items-center justify-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-black text-black transition hover:bg-zinc-200 w-full cursor-pointer hover:-translate-y-0.5"
                      >
                        <Check className="h-4.5 w-4.5 text-black" />
                        Mark Watched
                      </button>
                    )}

                    <div className="flex items-center justify-between gap-3 pt-1">
                      <button
                        type="button"
                        onClick={() => dayIndex > 0 && navigate(`/playlist/${courseId}/day/${dayIndex - 1}`)}
                        disabled={dayIndex <= 0}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] py-2 text-xs font-black text-zinc-300 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-40 cursor-pointer disabled:cursor-not-allowed"
                      >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Prev
                      </button>
                      {dayCompleted && dayIndex < (course?.days?.length || 0) - 1 && (
                        <button
                          type="button"
                          onClick={() => navigate(`/playlist/${courseId}/day/${dayIndex + 1}`)}
                          className="flex-1 flex items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] py-2 text-xs font-black text-zinc-300 transition hover:bg-white/[0.08] hover:text-white cursor-pointer"
                        >
                          Next
                          <ArrowRight className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* 3. Day Checkpoint Card */}
                <div id="playlist-day-checkpoint" className="min-w-0 rounded-[2rem] border border-white/10 bg-[#12141c] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                  <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500 font-label">Checkpoint</p>
                  <div className="mt-4 flex flex-col gap-3">
                    {dayCompleted ? (
                      <div className="flex items-center gap-3 rounded-[1.4rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-4 shadow-[inset_0_1px_0_rgba(255,255,255,0.05)]">
                        <ShieldCheck className="h-5.5 w-5.5 text-emerald-400" />
                        <div>
                          <p className="text-sm font-black text-emerald-300 font-headline">Verified</p>
                          <p className="font-body text-xs text-emerald-400/70">Logged.</p>
                        </div>
                      </div>
                    ) : (
                      <>
                        {!allWatched && (
                          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-3 text-[11px] leading-relaxed text-amber-300/80 font-body">
                            ⚠️ Queue incomplete. We recommend watching all videos first, but you can proceed if you're ready!
                          </div>
                        )}
                        <button
                          type="button"
                          onClick={handleMarkDayComplete}
                          className="flex min-h-10 items-center justify-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-black transition hover:bg-zinc-200 w-full cursor-pointer hover:-translate-y-0.5"
                        >
                          <CheckCircle2 className="h-4 w-4 text-black" />
                          Mark Day Complete
                        </button>
                        <button
                          type="button"
                          onClick={handleStartCheckpoint}
                          disabled={loadingCheckpoint}
                          className="flex min-h-10 items-center justify-center gap-1.5 rounded-full border border-white/10 bg-white/[0.05] px-4 py-2 text-xs font-black text-zinc-300 transition hover:bg-white/[0.09] hover:text-white w-full disabled:opacity-50 cursor-pointer disabled:cursor-not-allowed hover:-translate-y-0.5"
                        >
                          {loadingCheckpoint ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-zinc-400" />
                              Preparing
                            </>
                          ) : (
                            <>
                              <Trophy className="h-3.5 w-3.5 text-zinc-400" />
                              AI Checkpoint
                              <CreditCost cost={getCostForAction(usageData?.plan, 'playlistCheckpointGeneration')} className="ml-0.5" />
                            </>
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </section>

            {/* Right Column: Embedded Tutor Copilot Chat Sidebar */}
            <aside className="min-w-0 xl:sticky xl:top-24 xl:flex xl:flex-col xl:gap-2 xl:overflow-hidden w-full h-[580px] xl:h-[calc(100dvh-7.5rem)]">
              {course && (
                <TutorPanel
                  courseId={courseId}
                  moduleIndex={dayIndex}
                  subtopicIndex={activeVideoIdx}
                  user={user}
                  activeVideoTitle={activeVideo?.title}
                  plan={usageData?.plan}
                />
              )}
            </aside>
          </div>
        </div>
      </DashboardShell>
    </>
  );
}
