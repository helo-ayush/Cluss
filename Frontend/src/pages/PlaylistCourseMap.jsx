import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import MarkdownRenderer from '../components/MarkdownRenderer';

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
    unprocessed: { label: 'Not Started', color: '#475569', background: 'rgba(71, 85, 105, 0.12)' },
  }[status] || { label: 'Locked', color: '#64748b', background: 'rgba(100, 116, 139, 0.12)' };

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
    <div className="course-modal-backdrop fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6" onClick={(event) => {
      if (event.target === event.currentTarget) onClose();
    }}>
      <motion.div
        initial={{ opacity: 0, y: 22, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="course-modal-panel flex h-full w-full max-w-5xl flex-col overflow-hidden md:h-auto md:max-h-[90vh] md:rounded-[2rem]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/5 px-5 py-5 md:px-7">
          <div>
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
              Day {dayIndex + 1} Checkpoint
            </p>
            <h2 className="mt-2 font-serif text-3xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
              {isReview ? 'Checkpoint Review' : 'Show what you learned'}
            </h2>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              <span className="course-stat-chip">{attemptsUsed}/{maxAttempts} attempts used</span>
              {result && (
                <span className="course-stat-chip" style={{ color: result.passed ? '#15803d' : '#b91c1c' }}>
                  {result.overallScore}% score
                </span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/80"
          >
            <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--theme-text-muted)' }}>
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
                  activeTab === tab.key ? 'text-white' : ''
                }`}
                style={{
                  background: activeTab === tab.key ? 'linear-gradient(135deg, #111827, #312e81)' : 'rgba(255,255,255,0.7)',
                  color: activeTab === tab.key ? '#ffffff' : 'rgba(15, 23, 42, 0.58)',
                  border: '1px solid rgba(15, 23, 42, 0.08)',
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        <div className="flex-1 overflow-y-auto px-5 py-6 md:px-7">
          {activeTab === 'theory' && (
            <div className="mx-auto max-w-3xl space-y-5">
              {(checkpoint?.theoryQuestions || []).map((question, index) => {
                const feedback = result?.theoryScores?.find((entry) => entry.questionIndex === index);
                return (
                  <div key={index} className="course-surface rounded-[1.7rem] p-5">
                    <div className="flex items-start gap-4">
                      <div
                        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-label text-xs font-bold"
                        style={{
                          background: feedback
                            ? feedback.score >= 60
                              ? 'rgba(21, 128, 61, 0.12)'
                              : 'rgba(185, 28, 28, 0.12)'
                            : 'rgba(67, 56, 202, 0.12)',
                          color: feedback ? (feedback.score >= 60 ? '#15803d' : '#b91c1c') : '#4338ca',
                        }}
                      >
                        {feedback ? feedback.score : index + 1}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-body text-sm font-semibold leading-7" style={{ color: 'var(--theme-text-heading)' }}>
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
                      className="mt-4 w-full resize-y rounded-[1.2rem] border border-black/10 bg-white/70 p-4 font-body text-sm outline-none transition focus:border-[#4338ca]/35"
                      style={{ color: 'var(--theme-text-heading)' }}
                    />

                    {feedback?.feedback && (
                      <div className="course-surface-soft mt-4 rounded-[1.2rem] p-4">
                        <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#4338ca' }}>
                          Feedback
                        </p>
                        <div className="mt-2 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
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
            <div className="mx-auto max-w-3xl space-y-5">
              <div className="course-surface rounded-[1.7rem] p-5">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#4338ca' }}>
                  Coding Challenge
                </p>
                <div className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                  <MarkdownRenderer content={checkpoint.codingQuestion?.prompt} />
                </div>
                {checkpoint.codingQuestion?.expectedBehavior && (
                  <div className="course-surface-soft mt-4 rounded-[1.2rem] p-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#15803d' }}>
                      Expected Behavior
                    </p>
                    <div className="mt-2 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                      <MarkdownRenderer content={checkpoint.codingQuestion.expectedBehavior} />
                    </div>
                  </div>
                )}
              </div>

              {codeFiles.map((file, index) => (
                <div key={index} className="overflow-hidden rounded-[1.7rem] border border-black/10">
                  <div className="course-surface flex items-center gap-3 border-b border-black/10 px-4 py-3">
                    <span className="material-symbols-outlined text-[18px]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      description
                    </span>
                    <input
                      value={file.fileName}
                      onChange={(event) => updateFile(index, 'fileName', event.target.value)}
                      disabled={isReview}
                      className="flex-1 bg-transparent font-label text-[11px] font-bold uppercase tracking-[0.18em] outline-none"
                      style={{ color: 'var(--theme-text-heading)' }}
                      placeholder="filename"
                    />
                    {codeFiles.length > 1 && !isReview && (
                      <button type="button" onClick={() => removeFile(index)} className="text-[#b91c1c]">
                        <span className="material-symbols-outlined text-[18px]">close</span>
                      </button>
                    )}
                  </div>

                  <div className="course-code-surface flex min-h-[220px] overflow-hidden">
                    <div
                      ref={(element) => {
                        gutterRefs.current[index] = element;
                      }}
                      className="w-12 shrink-0 overflow-hidden border-r border-white/8 bg-[#111318] py-5 pr-3 text-right font-mono text-[11px] text-[#677083]"
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
                      className="custom-scroll flex-1 resize-none bg-transparent p-5 font-mono text-[13px] leading-[21px] text-[#e5e7eb] outline-none"
                    />
                  </div>
                </div>
              ))}

              {!isReview && (
                <button type="button" onClick={addFile} className="course-outline-button w-full justify-center">
                  <span className="material-symbols-outlined text-[18px]">add</span>
                  Add File
                </button>
              )}

              {result?.codingScore && (
                <div className="course-surface-soft rounded-[1.6rem] p-5">
                  <div className="flex items-center justify-between gap-3">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: '#4338ca' }}>
                      Coding Score
                    </p>
                    <span className="font-headline text-2xl font-bold" style={{ color: result.codingScore.score >= 60 ? '#15803d' : '#b91c1c' }}>
                      {result.codingScore.score}/100
                    </span>
                  </div>
                  <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                    {result.codingScore.feedback}
                  </p>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-black/5 px-5 py-5 md:px-7">
          {result ? (
            <div className="course-stat-chip" style={{ color: result.passed ? '#15803d' : '#b91c1c' }}>
              {result.passed ? 'Checkpoint passed' : 'Keep refining your answers'}
            </div>
          ) : (
            <div />
          )}

          {!isReview && attemptsUsed < maxAttempts ? (
            <button type="button" onClick={handleSubmit} disabled={submitting} className="course-primary-button">
              {submitting ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
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
            <button type="button" onClick={onClose} className="course-outline-button">
              Close
            </button>
          )}
        </div>
      </motion.div>
    </div>
  );
}

function DayCard({ day, index, isCurrent, isLocked, courseId, onStartCheckpoint }) {
  const navigate = useNavigate();
  const checkpointStatus = day.checkpoint?.status || 'locked';
  const showCheckpointButton =
    (isCurrent || checkpointStatus === 'available' || checkpointStatus === 'passed' || checkpointStatus === 'failed_all') &&
    day.status !== 'ready';

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.4, ease: 'easeOut' }}
      className="course-surface relative overflow-hidden rounded-[2rem] p-6 md:p-7"
      style={{ opacity: isLocked ? 0.62 : 1 }}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-28"
          style={{
            background: isCurrent
              ? 'linear-gradient(180deg, rgba(67, 56, 202, 0.14), transparent)'
              : day.status === 'ready'
              ? 'linear-gradient(180deg, rgba(21, 128, 61, 0.12), transparent)'
              : 'linear-gradient(180deg, rgba(15, 23, 42, 0.05), transparent)',
          }}
        />
      </div>

      <div className="relative z-10">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.4rem] font-headline text-xl font-bold"
              style={{
                background: isCurrent ? 'rgba(67, 56, 202, 0.12)' : 'rgba(15, 23, 42, 0.06)',
                color: isCurrent ? '#4338ca' : 'var(--theme-text-heading)',
              }}
            >
              {day.dayNumber}
            </div>
            <div>
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                Playlist Day {day.dayNumber}
              </p>
              <h3 className="mt-2 font-serif text-3xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
                {day.isFiller ? `Focus: ${day.fillerTopic}` : `Study block for day ${day.dayNumber}`}
              </h3>
              <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                {day.videos.length} video{day.videos.length === 1 ? '' : 's'} planned for this day, with about{' '}
                {formatDuration(day.totalDuration)} of study time.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {isCurrent && <span className="course-kicker">Current Day</span>}
            <StatusPill status={day.status} />
          </div>
        </div>

        <div className="mt-6 grid gap-3 md:grid-cols-3">
          <div className="course-surface-soft rounded-[1.35rem] px-4 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
              Videos
            </p>
            <p className="mt-2 font-headline text-3xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
              {day.videos.length}
            </p>
          </div>
          <div className="course-surface-soft rounded-[1.35rem] px-4 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
              Estimated Time
            </p>
            <p className="mt-2 font-headline text-3xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
              {formatDuration(day.totalDuration)}
            </p>
          </div>
          <div className="course-surface-soft rounded-[1.35rem] px-4 py-4">
            <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
              Checkpoint
            </p>
            <p className="mt-2 font-body text-sm font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
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
            <div key={video.videoId || videoIndex} className="course-surface-soft flex items-center gap-3 rounded-[1.2rem] px-4 py-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#eef2ff] text-[#4338ca]">
                <span className="font-label text-xs font-bold">{String(videoIndex + 1).padStart(2, '0')}</span>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-body text-sm font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
                  {video.title}
                </p>
                <p className="mt-1 truncate font-body text-xs" style={{ color: 'var(--theme-text-body)' }}>
                  {video.channel || 'YouTube'} • {formatDuration(video.duration)}
                </p>
              </div>
            </div>
          ))}
          {day.videos.length > 4 && (
            <p className="pl-1 font-label text-[11px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
              + {day.videos.length - 4} more video{day.videos.length - 4 === 1 ? '' : 's'}
            </p>
          )}
        </div>

        <div className="mt-7 flex flex-col gap-3 md:flex-row">
          <button
            type="button"
            onClick={() => !isLocked && navigate(`/playlist/${courseId}/day/${index}`)}
            disabled={isLocked}
            className="course-primary-button justify-center disabled:opacity-50"
          >
            <span className="material-symbols-outlined text-[18px]">play_circle</span>
            {day.status === 'ready' ? `Review Day ${day.dayNumber}` : `Start Day ${day.dayNumber}`}
          </button>

          {showCheckpointButton && (
            <button type="button" onClick={() => onStartCheckpoint(index)} className="course-outline-button justify-center">
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
          <div className="course-surface-soft mt-5 flex items-center gap-3 rounded-[1.3rem] px-4 py-4">
            <span className="material-symbols-outlined text-[20px]" style={{ color: '#15803d' }}>
              verified
            </span>
            <p className="font-body text-sm font-semibold" style={{ color: '#15803d' }}>
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
    <div className="course-shell flex min-h-screen items-center justify-center px-6">
      <div className="course-surface flex flex-col items-center gap-4 rounded-[2rem] px-8 py-10 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#111827] border-t-transparent" />
        <p className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>
          Building your playlist plan...
        </p>
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
    return <LoadingState />;
  }

  if (!course || !course.days) {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-xl rounded-[2rem] px-8 py-10 text-center">
          <h1 className="font-serif text-4xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
            Playlist course not found
          </h1>
          <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
            We could not load this study plan. Head back to the dashboard and open it again.
          </p>
          <Link to="/dashboard" className="course-primary-button mt-6">
            Return to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  const currentDayIndex = course.currentDayIndex || 0;

  return (
    <div className="course-shell">
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
        <div className="course-modal-backdrop fixed inset-0 z-40 flex items-center justify-center">
          <div className="course-surface flex flex-col items-center gap-4 rounded-[2rem] px-8 py-8 text-center">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#111827] border-t-transparent" />
            <p className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>
              Preparing checkpoint questions...
            </p>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-8 px-4 pb-20 pt-28 md:px-6 lg:px-8">
        <motion.section
          initial={{ opacity: 0, y: 22 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: 'easeOut' }}
          className="course-hero-card overflow-hidden rounded-[2.5rem] px-6 py-8 md:px-10 md:py-10"
        >
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-3">
              <Link to="/dashboard" className="course-outline-button">
                <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                Dashboard
              </Link>
              <span className="course-kicker">
                <span className="material-symbols-outlined text-[14px]">smart_display</span>
                Playlist Course
              </span>
            </div>
            <div className="course-stat-chip">
              <span className="material-symbols-outlined text-[18px]" style={{ color: '#4338ca' }}>
                event_note
              </span>
              Day {Math.min(currentDayIndex + 1, days.length)} of {days.length}
            </div>
          </div>

          <div className="mt-8 grid gap-8 lg:grid-cols-[1.35fr_0.95fr]">
            <div>
              <p className="font-label text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(15, 23, 42, 0.44)' }}>
                Structured Study Plan
              </p>
              <h1 className="mt-4 font-serif text-4xl font-semibold leading-tight md:text-6xl" style={{ color: 'var(--theme-text-heading)' }}>
                {course.course_title}
              </h1>
              <p className="mt-4 max-w-3xl font-body text-sm leading-7 md:text-[15px]" style={{ color: 'var(--theme-text-body)' }}>
                Your playlist has been reshaped into day-by-day study blocks with checkpoints so
                each session feels intentional instead of overwhelming.
              </p>
            </div>

            <div className="course-surface-soft rounded-[2rem] p-6">
              <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                Plan Progress
              </p>
              <div className="mt-5 grid gap-3">
                <div className="course-surface rounded-[1.3rem] px-4 py-4">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      Completion
                    </span>
                    <span className="font-label text-xs font-bold" style={{ color: '#4338ca' }}>
                      {stats.progressPct}%
                    </span>
                  </div>
                  <div className="mt-3 course-progress-track">
                    <div className="course-progress-fill" style={{ width: `${stats.progressPct}%` }} />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="course-surface rounded-[1.3rem] px-4 py-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      Videos
                    </p>
                    <p className="mt-2 font-headline text-3xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
                      {stats.totalVideos}
                    </p>
                  </div>
                  <div className="course-surface rounded-[1.3rem] px-4 py-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      Total Time
                    </p>
                    <p className="mt-2 font-headline text-3xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
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
              isLocked={index > currentDayIndex && day.status !== 'ready'}
              courseId={courseId}
              onStartCheckpoint={handleStartCheckpoint}
            />
          ))}
        </section>

        <motion.section
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.45 }}
          className="course-surface mx-auto max-w-3xl rounded-[2rem] px-6 py-8 text-center"
        >
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef2ff] text-[#4338ca]">
            <span className="material-symbols-outlined text-[30px]">
              {stats.progressPct === 100 ? 'emoji_events' : 'sports_score'}
            </span>
          </div>
          <h2 className="mt-4 font-serif text-3xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
            {stats.progressPct === 100 ? 'Playlist Complete' : 'Keep the streak alive'}
          </h2>
          <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
            {stats.progressPct === 100
              ? 'Every planned day is complete. You can revisit any session or checkpoint whenever you want.'
              : `${stats.completedDays} of ${days.length} study days are complete so far.`}
          </p>
        </motion.section>
      </main>
    </div>
  );
}
