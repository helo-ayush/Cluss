import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
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

function StatusPill({ status }) {
  const tone = {
    ready: { label: 'Completed', color: '#15803d', background: 'rgba(21, 128, 61, 0.12)' },
    processing: { label: 'Preparing', color: '#4338ca', background: 'rgba(67, 56, 202, 0.12)' },
    failed: { label: 'Needs Retry', color: '#b91c1c', background: 'rgba(185, 28, 28, 0.12)' },
    unprocessed: { label: 'Upcoming', color: '#64748b', background: 'rgba(100, 116, 139, 0.12)' },
  }[status] || { label: 'Upcoming', color: '#64748b', background: 'rgba(100, 116, 139, 0.12)' };

  return (
    <span
      className="inline-flex items-center rounded-full px-3 py-2 font-label text-[10px] font-bold uppercase tracking-[0.18em]"
      style={{ color: tone.color, background: tone.background }}
    >
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
    <div className="course-modal-backdrop fixed inset-0 z-[1100] flex items-stretch justify-center p-0 md:items-center md:p-6" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="flex h-screen w-full max-w-6xl flex-col overflow-hidden md:h-[min(92vh,960px)] md:rounded-[2rem] border border-white/10 bg-[#111111] shadow-[0_20px_60px_rgba(0,0,0,0.5)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-5 md:px-7">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-slate-400">
              Day {dayIndex + 1} Checkpoint
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold text-white">
              {isReview ? 'Checkpoint Review' : 'Show what you learned'}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="inline-flex items-center rounded-full bg-[#161616] border border-white/10 px-3 py-1 text-xs font-bold text-slate-300">{attemptsUsed}/{maxAttempts} attempts used</span>
              {result && (
                <span className="inline-flex items-center rounded-full border px-3 py-1 text-xs font-bold" style={{ borderColor: result.passed ? 'rgba(21, 128, 61, 0.3)' : 'rgba(185, 28, 28, 0.3)', color: result.passed ? '#4ade80' : '#f87171', backgroundColor: result.passed ? 'rgba(21, 128, 61, 0.1)' : 'rgba(185, 28, 28, 0.1)' }}>
                  {result.overallScore}% score
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-[#161616] text-slate-400 transition hover:bg-[#1c1c1c] hover:text-white"
          >
            <span className="material-symbols-outlined text-[18px]">
              close
            </span>
          </button>
        </div>

        {checkpoint?.questionType === 'mixed' && (
          <div className="flex gap-2 px-5 pt-5 md:px-7">
            {[
              { key: 'theory', label: 'Theory' },
              { key: 'coding', label: 'Coding' },
            ].map((tab) => (
              <button
                key={tab.key}
                type="button"
                onClick={() => setActiveTab(tab.key)}
                className={`rounded-full px-4 py-2 font-label text-[11px] font-bold uppercase tracking-[0.18em] transition ${
                  activeTab === tab.key ? 'text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'
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

        <div className="custom-scroll flex-1 overflow-y-auto overscroll-contain px-4 py-5 md:px-8 md:py-6">
          {activeTab === 'theory' && (
            <div className="mx-auto w-full max-w-4xl space-y-5">
              {(checkpoint?.theoryQuestions || []).map((question, index) => {
                const feedback = result?.theoryScores?.find((entry) => entry.questionIndex === index);
                return (
                  <div key={index} className="rounded-[1.7rem] border border-white/10 bg-[#161616] p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-label text-xs font-bold"
                        style={{
                          background: feedback
                            ? feedback.score >= 60
                              ? 'rgba(74, 222, 128, 0.12)'
                              : 'rgba(248, 113, 113, 0.12)'
                            : 'rgba(99, 102, 241, 0.12)',
                          color: feedback ? (feedback.score >= 60 ? '#4ade80' : '#f87171') : '#818cf8',
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
                      className="mt-4 w-full resize-y rounded-[1.2rem] border border-white/10 bg-[#0a0b10] p-4 font-body text-sm outline-none transition focus:border-indigo-500/50 text-slate-300 placeholder-slate-600"
                    />

                    {feedback?.feedback && (
                      <div className="mt-4 rounded-[1.2rem] border border-indigo-500/20 bg-indigo-500/10 p-4">
                        <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
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
              <div className="rounded-[1.7rem] border border-white/10 bg-[#161616] p-5">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                  Coding Challenge
                </p>
                <div className="mt-3 font-body text-sm leading-7 text-slate-300">
                  <MarkdownRenderer content={checkpoint.codingQuestion?.prompt} />
                </div>
                {checkpoint.codingQuestion?.expectedBehavior && (
                  <div className="mt-4 rounded-[1.2rem] border border-emerald-500/20 bg-emerald-500/10 p-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-emerald-400">
                      Expected Behavior
                    </p>
                    <div className="mt-2 font-body text-sm leading-7 text-emerald-100">
                      <MarkdownRenderer content={checkpoint.codingQuestion.expectedBehavior} />
                    </div>
                  </div>
                )}
              </div>

              {codeFiles.map((file, index) => (
                <div key={index} className="overflow-hidden rounded-[1.7rem] border border-white/10">
                  <div className="flex items-center gap-3 border-b border-white/10 bg-[#161616] px-4 py-3">
                    <span className="material-symbols-outlined text-[18px] text-slate-400">
                      description
                    </span>
                    <input
                      value={file.fileName}
                      onChange={(event) => updateFile(index, 'fileName', event.target.value)}
                      disabled={isReview}
                      className="flex-1 bg-transparent font-label text-[11px] font-bold uppercase tracking-[0.18em] outline-none text-white placeholder-slate-600"
                      placeholder="filename"
                    />
                    {codeFiles.length > 1 && !isReview && (
                      <button type="button" onClick={() => removeFile(index)} className="text-red-400 hover:text-red-300">
                        <span className="material-symbols-outlined text-[18px]">close</span>
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
                      className="custom-scroll flex-1 resize-none bg-transparent p-5 font-mono text-[13px] leading-[21px] text-[#e5e7eb] outline-none placeholder-slate-600"
                    />
                  </div>
                </div>
              ))}

              {!isReview && (
                <button type="button" onClick={addFile} className="flex w-full items-center justify-center gap-2 rounded-[1.2rem] border border-white/10 bg-[#161616] px-5 py-4 text-sm font-bold text-slate-300 transition hover:bg-[#1c1c1c] hover:text-white">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add File
                </button>
              )}

              {result?.codingScore && (
                <div className="rounded-[1.6rem] border border-white/10 bg-[#161616] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-400">
                      Coding Score
                    </p>
                    <span className="font-headline text-2xl font-bold" style={{ color: result.codingScore.score >= 60 ? '#4ade80' : '#f87171' }}>
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

        <div className="shrink-0 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 px-5 py-5 md:px-7">
          {result ? (
            <div className="inline-flex items-center rounded-full border px-3 py-1.5 text-xs font-bold" style={{ borderColor: result.passed ? 'rgba(21, 128, 61, 0.3)' : 'rgba(185, 28, 28, 0.3)', color: result.passed ? '#4ade80' : '#f87171', backgroundColor: result.passed ? 'rgba(21, 128, 61, 0.1)' : 'rgba(185, 28, 28, 0.1)' }}>
              {result.passed ? 'Checkpoint passed' : 'Keep refining your answers'}
            </div>
          ) : (
            <div />
          )}

          {!isReview && attemptsUsed < maxAttempts ? (
            <button type="button" onClick={handleSubmit} disabled={submitting} className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-slate-200 disabled:opacity-50">
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                  Grading
                </>
              ) : (
                <>
                  <span className="material-symbols-outlined text-[18px]">send</span>
                  Submit ({maxAttempts - attemptsUsed} left)
                </>
              )}
            </button>
          ) : (
            <button type="button" onClick={onClose} className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#161616] px-5 py-3 text-sm font-bold text-slate-300 transition hover:bg-[#1c1c1c] hover:text-white">
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DayCard({ day, index, isCurrent, courseId, onStartCheckpoint }) {
  const navigate = useNavigate();
  const checkpointStatus = day.checkpoint?.status || 'locked';
  const locked = checkpointStatus === 'locked';
  const showCheckpointButton =
    (isCurrent || checkpointStatus === 'available' || checkpointStatus === 'passed' || checkpointStatus === 'failed_all') &&
    day.status !== 'ready';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: locked ? 0.6 : 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      id={isCurrent ? 'playlist-current-day' : undefined}
      className={`relative overflow-hidden rounded-[2rem] border border-white/10 p-6 md:p-7 ${
        isCurrent ? 'bg-[#141414] shadow-[0_20px_60px_rgba(99,102,241,0.15)]' : 'bg-[#111111]'
      } ${locked ? 'grayscale-[0.5]' : ''}`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-28"
          style={{
            background: isCurrent
              ? 'linear-gradient(180deg, rgba(99, 102, 241, 0.15), transparent)'
              : day.status === 'ready'
              ? 'linear-gradient(180deg, rgba(74, 222, 128, 0.08), transparent)'
              : 'linear-gradient(180deg, rgba(255, 255, 255, 0.03), transparent)',
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] font-headline text-xl font-bold"
              style={{
                background: isCurrent ? 'rgba(99, 102, 241, 0.12)' : 'rgba(255, 255, 255, 0.06)',
                color: isCurrent ? '#818cf8' : '#e2e8f0',
              }}
            >
              {day.dayNumber}
            </div>
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em] text-slate-500">
                Playlist Day {day.dayNumber}
              </p>
              <h3 className="mt-2 font-serif text-3xl font-semibold text-white">
                {day.isFiller ? `Focus: ${day.fillerTopic}` : `Study block for day ${day.dayNumber}`}
              </h3>
              <p className="mt-3 font-body text-sm leading-7 text-slate-400">
                {day.videos.length} video{day.videos.length === 1 ? '' : 's'} planned for this day, with about{' '}
                {formatDuration(day.totalDuration)} of study time.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isCurrent && <span className="inline-flex items-center rounded-full bg-indigo-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400 border border-indigo-500/30">Current Day</span>}
            <StatusPill status={day.status} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="rounded-[1.35rem] border border-white/5 bg-[#161616] px-4 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Videos
            </p>
            <p className="mt-2 font-headline text-3xl font-bold text-white">
              {day.videos.length}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/5 bg-[#161616] px-4 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Estimated Time
            </p>
            <p className="mt-2 font-headline text-3xl font-bold text-white">
              {formatDuration(day.totalDuration)}
            </p>
          </div>
          <div className="rounded-[1.35rem] border border-white/5 bg-[#161616] px-4 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
              Checkpoint
            </p>
            <p className="mt-2 font-body text-sm font-semibold text-white">
              {day.status === 'ready'
                ? 'Passed'
                : checkpointStatus === 'failed_all'
                ? 'Attempts finished'
                : checkpointStatus === 'passed'
                ? 'Passed'
                : 'Pending'}
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-2">
          {day.videos.slice(0, 4).map((video, videoIndex) => (
            <div key={video.videoId || videoIndex} className="flex items-center gap-3 rounded-[1.2rem] border border-white/5 bg-[#161616] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
                <span className="font-label text-xs font-bold">{String(videoIndex + 1).padStart(2, '0')}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-semibold text-slate-200">
                  {video.title}
                </p>
                <p className="mt-1 truncate font-body text-xs text-slate-500">
                  {video.channel || 'YouTube'} • {formatDuration(video.duration)}
                </p>
              </div>
            </div>
          ))}
          {day.videos.length > 4 && (
            <p className="pl-1 font-label text-[11px] font-bold uppercase tracking-[0.18em] text-slate-500">
              + {day.videos.length - 4} more video{day.videos.length - 4 === 1 ? '' : 's'}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            disabled={locked}
            onClick={() => !locked && navigate(`/playlist/${courseId}/day/${index}`)}
            className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:-translate-y-0.5 hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0"
          >
            <span className="material-symbols-outlined text-[18px]">
              {locked ? 'lock' : 'play_circle'}
            </span>
            {locked ? 'Locked' : day.status === 'ready' ? `Review Day ${day.dayNumber}` : `Start Day ${day.dayNumber}`}
          </button>

          {showCheckpointButton && (
            <button type="button" onClick={() => onStartCheckpoint(index)} className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#161616] px-5 py-3 text-sm font-bold text-slate-300 transition hover:-translate-y-0.5 hover:bg-[#1c1c1c] hover:text-white">
              <span className="material-symbols-outlined text-[18px]">quiz</span>
              {checkpointStatus === 'passed'
                ? 'Review Checkpoint'
                : checkpointStatus === 'failed_all'
                ? 'Open Results'
                : 'Take Checkpoint'}
            </button>
          )}
        </div>

        {day.status === 'ready' && (
          <div className="mt-5 flex items-center gap-3 rounded-[1.3rem] border border-emerald-500/20 bg-emerald-500/10 px-4 py-4">
            <span className="material-symbols-outlined text-[20px] text-emerald-400">
              verified
            </span>
            <p className="font-body text-sm font-semibold text-emerald-300">
              Day complete. The checkpoint for this day has been passed.
            </p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function LoadingState() {
  return (
    <div className="mx-auto max-w-[96rem] space-y-6 px-4 pt-24 pb-20 sm:px-6 lg:px-8">
      <div className="rounded-[2.6rem] border border-white/10 bg-[#111111] p-8 md:p-12">
        <div className="h-10 w-56 animate-pulse rounded-full bg-white/[0.06]" />
        <div className="mt-6 h-16 w-3/4 animate-pulse rounded-2xl bg-white/[0.08]" />
        <div className="mt-4 h-6 w-1/2 animate-pulse rounded-xl bg-white/[0.05]" />
      </div>
      <div className="grid gap-5 lg:grid-cols-3">
        {[0, 1, 2].map((item) => (
          <div key={item} className="h-72 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.04]" />
        ))}
      </div>
    </div>
  );
}

export default function PlaylistCourseMap() {
  const { courseId } = useParams();
  const { user } = useUser();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [checkpointDay, setCheckpointDay] = useState(null);
  const [checkpointData, setCheckpointData] = useState(null);
  const [loadingCheckpoint, setLoadingCheckpoint] = useState(false);

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

  const stats = useMemo(() => {
    const totalVideos = days.reduce((sum, day) => sum + day.videos.length, 0);
    const totalDuration = days.reduce((sum, day) => sum + day.totalDuration, 0);
    const completedDays = days.filter((day) => day.status === 'ready').length;
    const progressPct = days.length > 0 ? Math.round((completedDays / days.length) * 100) : 0;
    return { totalVideos, totalDuration, completedDays, progressPct };
  }, [days]);

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
        <div className="flex min-h-screen items-center justify-center px-6">
          <div className="max-w-xl rounded-[2.4rem] border border-white/10 bg-[#111111] px-8 py-10 text-center shadow-[0_20px_60px_rgba(0,0,0,0.4)] w-full">
            <h1 className="font-serif text-4xl font-semibold text-white">
              Playlist course not found
            </h1>
            <p className="mt-4 font-body text-sm leading-7 text-slate-400">
              We could not load this study plan. Head back to the dashboard and open it again.
            </p>
            <Link to="/dashboard" className="flex items-center justify-center gap-2 rounded-full bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-slate-200 mt-6 min-w-[200px] mx-auto">
              Return to Dashboard
            </Link>
          </div>
        </div>
      </DashboardShell>
    );
  }

  const currentDayIndex = course.currentDayIndex || 0;

  return (
    <DashboardShell
      title={course.course_title}
      eyebrow="Playlist Plan"
      showCreate={false}
      disableDefaultPadding
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
          <div className="flex flex-col items-center gap-4 rounded-[2rem] border border-white/10 bg-[#161616] px-8 py-8 text-center shadow-2xl">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-indigo-500 border-t-transparent" />
            <p className="font-body text-sm text-slate-300">
              Preparing checkpoint questions...
            </p>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 pb-20 pt-24 md:px-6 lg:px-8">
        <motion.section
          id="playlist-progress-overview"
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="overflow-hidden rounded-[2.5rem] border border-white/10 bg-[#111111] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent px-6 py-8 md:px-10 md:py-10 shadow-[0_20px_60px_rgba(0,0,0,0.4)]"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/dashboard" className="flex items-center justify-center gap-2 rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-xs font-bold text-slate-300 transition hover:bg-[#1c1c1c] hover:text-white">
                <span className="material-symbols-outlined text-[16px]">arrow_back</span>
                Dashboard
              </Link>
              <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/30 bg-indigo-500/20 px-3 py-1 text-[11px] font-black uppercase tracking-[0.2em] text-indigo-400">
                <span className="material-symbols-outlined text-[14px]">smart_display</span>
                Playlist Course
              </span>
            </div>
            <div className="inline-flex items-center gap-1.5 rounded-full border border-white/10 bg-[#161616] px-4 py-2 text-xs font-bold text-slate-300">
              <span className="material-symbols-outlined text-[18px] text-indigo-400">
                event_note
              </span>
              Day {Math.min(currentDayIndex + 1, days.length)} of {days.length}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div>
              <p className="font-label text-[11px] font-bold uppercase tracking-[0.24em] text-slate-500">
                Structured Study Plan
              </p>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight text-white md:text-6xl">
                {course.course_title}
              </h1>
              <p className="mt-4 max-w-3xl font-body text-sm leading-7 text-slate-400 md:text-[15px]">
                Your playlist has been reshaped into day-by-day study blocks with checkpoints so
                each session feels intentional instead of overwhelming.
              </p>
            </div>

            <div className="rounded-[2rem] border border-white/5 bg-[#161616] p-6">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500">
                Plan Progress
              </p>
              <div className="mt-5 grid gap-3">
                <div className="rounded-[1.3rem] border border-white/5 bg-[#0a0b10] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Completion
                    </span>
                    <span className="font-label text-xs font-bold text-indigo-400">
                      {stats.progressPct}%
                    </span>
                  </div>
                  <div className="mt-3 h-2 overflow-hidden rounded-full bg-[#1c1c1c]">
                    <div className="h-full bg-indigo-500" style={{ width: `${stats.progressPct}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-[1.3rem] border border-white/5 bg-[#0a0b10] px-4 py-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Videos
                    </p>
                    <p className="mt-2 font-headline text-3xl font-bold text-white">
                      {stats.totalVideos}
                    </p>
                  </div>
                  <div className="rounded-[1.3rem] border border-white/5 bg-[#0a0b10] px-4 py-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em] text-slate-500">
                      Total Time
                    </p>
                    <p className="mt-2 font-headline text-3xl font-bold text-white">
                      {formatDuration(stats.totalDuration)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        <section className="space-y-6">
          {days.map((day, index) => (
            <DayCard
              key={day._id || index}
              day={day}
              index={index}
              isCurrent={index === currentDayIndex}
              courseId={courseId}
              onStartCheckpoint={handleStartCheckpoint}
            />
          ))}
        </section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="mx-auto max-w-3xl rounded-[2rem] border border-white/10 bg-[#111111] px-6 py-8 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-indigo-500/10 text-indigo-400">
            <span className="material-symbols-outlined text-[30px]">
              {stats.progressPct === 100 ? 'emoji_events' : 'sports_score'}
            </span>
          </div>
          <h2 className="mt-4 font-serif text-3xl font-semibold text-white">
            {stats.progressPct === 100 ? 'Playlist Complete' : 'Keep the streak alive'}
          </h2>
          <p className="mt-3 font-body text-sm leading-7 text-slate-400">
            {stats.progressPct === 100
              ? 'Every planned day is complete. You can revisit any session or checkpoint whenever you want.'
              : `${stats.completedDays} of ${days.length} study days are complete so far.`}
          </p>
        </motion.section>
      </main>
    </DashboardShell>
  );
}
