import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TutorChatPanel from '../components/TutorChatPanel';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0m';
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
};

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
    if (gutterRefs.current[index]) gutterRefs.current[index].scrollTop = event.target.scrollTop;
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
                className="rounded-full px-4 py-2 font-label text-[11px] font-bold uppercase tracking-[0.18em]"
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

function VideoListItem({ video, index, isActive, isWatched, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(index)}
      className={`course-rail-item flex items-center gap-3 ${isActive ? 'course-rail-item-active' : ''}`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: isActive ? 'rgba(255, 255, 255, 0.12)' : isWatched ? 'rgba(21, 128, 61, 0.12)' : 'rgba(15, 23, 42, 0.06)',
          color: isActive ? '#ffffff' : isWatched ? '#15803d' : 'var(--theme-text-heading)',
        }}
      >
        {isWatched ? (
          <span className="material-symbols-outlined text-[18px]">check</span>
        ) : (
          <span className="font-label text-xs font-bold">{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="truncate font-body text-sm font-semibold" style={{ color: isActive ? '#ffffff' : 'var(--theme-text-heading)' }}>
          {video.title}
        </p>
        <p className="mt-1 truncate font-body text-xs" style={{ color: isActive ? 'rgba(255,255,255,0.7)' : 'var(--theme-text-body)' }}>
          {video.channel || 'YouTube'} • {formatDuration(video.duration)}
        </p>
      </div>

      <span className="material-symbols-outlined text-[18px]" style={{ color: isActive ? '#ffffff' : isWatched ? '#15803d' : 'rgba(15, 23, 42, 0.36)' }}>
        {isActive ? 'play_circle' : isWatched ? 'check_circle' : 'radio_button_unchecked'}
      </span>
    </button>
  );
}

function LoadingState() {
  return (
    <div className="course-shell flex min-h-screen items-center justify-center px-6">
      <div className="course-surface flex flex-col items-center gap-4 rounded-[2rem] px-8 py-10 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#111827] border-t-transparent" />
        <p className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>
          Opening your study day...
        </p>
      </div>
    </div>
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
  const [usageData, setUsageData] = useState(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        const day = data.course.days?.[dayIndex];
        if (day?.checkpoint?.status === 'passed' || day?.status === 'ready') {
          setWatchedSet(new Set(day.videos.map((_, index) => index)));
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [courseId, dayIndex]);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/${user.id}/usage`);
      const data = await res.json();
      if (data.success) setUsageData(data);
    } catch (err) {
      console.error(err);
    }
  }, [user]);

  useEffect(() => {
    setActiveVideoIdx(0);
  }, [courseId, dayIndex]);

  useEffect(() => {
    fetchCourse();
    fetchUsage();
  }, [fetchCourse, fetchUsage, isLoaded]);

  const handleMarkWatched = () => {
    let nextSet;
    setWatchedSet((prev) => {
      nextSet = new Set(prev);
      nextSet.add(activeVideoIdx);
      return nextSet;
    });

    const day = course?.days?.[dayIndex];
    if (!day) return;
    for (let index = activeVideoIdx + 1; index < day.videos.length; index += 1) {
      if (!nextSet?.has(index)) {
        setActiveVideoIdx(index);
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

  if (loading) {
    return <LoadingState />;
  }

  const day = course?.days?.[dayIndex];
  if (!day) {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-xl rounded-[2rem] px-8 py-10 text-center">
          <h1 className="font-serif text-4xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
            Day not found
          </h1>
          <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
            This study day could not be loaded. Return to the playlist overview and pick another one.
          </p>
          <Link to={`/playlist/${courseId}`} className="course-primary-button mt-6">
            Back to Study Plan
          </Link>
        </div>
      </div>
    );
  }

  const videos = day.videos || [];
  const activeVideo = videos[activeVideoIdx];
  const allWatched = watchedSet.size >= videos.length;
  const checkpointStatus = day.checkpoint?.status || 'locked';
  const dayCompleted = day.status === 'ready' || checkpointStatus === 'passed';
  const hasTutorAccess = usageData ? usageData.plan === 'pro' || usageData.plan === 'ultra' : false;

  const dayProgress = useMemo(() => {
    if (videos.length === 0) return 0;
    return Math.round((watchedSet.size / videos.length) * 100);
  }, [videos.length, watchedSet.size]);

  return (
    <>
      <div className="course-shell">
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

        <main className="relative z-10 mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 overflow-x-hidden px-3 pb-24 pt-24 md:gap-8 md:px-6 md:pb-20 md:pt-28 lg:px-8">
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, ease: 'easeOut' }}
            className="course-hero-card overflow-hidden rounded-[2rem] px-5 py-6 md:rounded-[2.5rem] md:px-10 md:py-10"
          >
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex flex-wrap items-center gap-3">
                <Link to={`/playlist/${courseId}`} className="course-outline-button">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Study Plan
                </Link>
                <span className="course-kicker">
                  <span className="material-symbols-outlined text-[14px]">today</span>
                  Day {day.dayNumber}
                </span>
              </div>
              <div className="course-stat-chip">
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#4338ca' }}>
                  play_lesson
                </span>
                {watchedSet.size}/{videos.length} watched
              </div>
            </div>

            <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="min-w-0">
                <p className="font-label text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(15, 23, 42, 0.44)' }}>
                  Active Video
                </p>
                <h1 className="mt-4 break-words font-serif text-[2.35rem] font-semibold leading-[1.02] sm:text-5xl md:text-6xl" style={{ color: 'var(--theme-text-heading)' }}>
                  {activeVideo?.title || `Day ${day.dayNumber}`}
                </h1>
                <p className="mt-4 max-w-3xl font-body text-sm leading-7 md:text-[15px]" style={{ color: 'var(--theme-text-body)' }}>
                  Move through the videos in order, mark them off as you finish, then take the
                  checkpoint to complete the day.
                </p>
              </div>

              <div className="course-surface-soft min-w-0 rounded-[1.75rem] p-5 md:rounded-[2rem] md:p-6">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                  Day Snapshot
                </p>
                <div className="mt-5 grid gap-3">
                  <div className="course-surface rounded-[1.3rem] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <span className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                        Progress
                      </span>
                      <span className="font-label text-xs font-bold" style={{ color: '#4338ca' }}>
                        {dayProgress}%
                      </span>
                    </div>
                    <div className="mt-3 course-progress-track">
                      <div className="course-progress-fill" style={{ width: `${dayProgress}%` }} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="course-surface rounded-[1.3rem] px-4 py-4">
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                        Videos
                      </p>
                      <p className="mt-2 font-headline text-3xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
                        {videos.length}
                      </p>
                    </div>
                    <div className="course-surface rounded-[1.3rem] px-4 py-4">
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                        Duration
                      </p>
                      <p className="mt-2 font-headline text-3xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
                        {formatDuration(day.totalDuration)}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.section>

          <div className="grid min-w-0 gap-6 lg:grid-cols-12 lg:gap-8">
            <section className="min-w-0 lg:col-span-8">
              <div className="space-y-6 lg:sticky lg:top-28">
                <div className="course-surface w-full overflow-hidden rounded-[1.75rem] p-2.5 md:rounded-[2.2rem] md:p-4">
                  {activeVideo?.videoId ? (
                    <div className="aspect-video overflow-hidden rounded-[1.2rem] bg-black md:rounded-[1.6rem]">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${activeVideo.videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0`}
                        title={activeVideo.title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center rounded-[1.2rem] bg-[#f8fafc] px-5 text-center md:rounded-[1.6rem] md:px-6">
                      <span className="material-symbols-outlined text-[56px]" style={{ color: 'rgba(15, 23, 42, 0.28)' }}>
                        videocam_off
                      </span>
                      <p className="mt-4 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                        No video is attached to this item.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid min-w-0 gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="course-surface min-w-0 rounded-[1.75rem] p-5 md:rounded-[2rem] md:p-6">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      Video Source
                    </p>
                    <div className="mt-4 flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#fef2f2] text-[#dc2626]">
                        <span className="material-symbols-outlined text-[22px]">smart_display</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
                          {activeVideo?.channel || 'YouTube lesson'}
                        </p>
                        <p className="mt-2 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                          Duration {formatDuration(activeVideo?.duration)}. Watch it fully, then mark it as
                          complete to keep your study streak moving.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="course-surface min-w-0 rounded-[1.75rem] p-5 md:rounded-[2rem] md:p-6">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      Day Action
                    </p>
                    <div className="mt-4 flex flex-col gap-4">
                      {watchedSet.has(activeVideoIdx) ? (
                        <div className="course-surface-soft flex items-center gap-3 rounded-[1.4rem] px-4 py-4">
                          <span className="material-symbols-outlined text-[22px]" style={{ color: '#15803d' }}>
                            check_circle
                          </span>
                          <div>
                            <p className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
                              Video watched
                            </p>
                            <p className="font-body text-xs" style={{ color: 'var(--theme-text-body)' }}>
                              This video is already checked off.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button type="button" onClick={handleMarkWatched} className="course-primary-button w-full justify-center">
                          <span className="material-symbols-outlined text-[18px]">task_alt</span>
                          Mark as Watched
                        </button>
                      )}

                      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                        <button
                          type="button"
                          onClick={() => dayIndex > 0 && navigate(`/playlist/${courseId}/day/${dayIndex - 1}`)}
                          disabled={dayIndex <= 0}
                          className="course-outline-button justify-center disabled:opacity-40"
                        >
                          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                          Previous Day
                        </button>
                        {dayCompleted && dayIndex < (course?.days?.length || 0) - 1 && (
                          <button
                            type="button"
                            onClick={() => navigate(`/playlist/${courseId}/day/${dayIndex + 1}`)}
                            className="course-outline-button justify-center"
                          >
                            Next Day
                            <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="min-w-0 lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-28">
                <div className="course-surface min-w-0 rounded-[1.75rem] p-5 md:rounded-[2.2rem] md:p-6">
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                        Video Queue
                      </p>
                      <h2 className="mt-2 break-words font-serif text-[1.8rem] font-semibold leading-tight md:text-2xl" style={{ color: 'var(--theme-text-heading)' }}>
                        Day {day.dayNumber}
                      </h2>
                    </div>
                    <div className="shrink-0 rounded-full bg-[#eef2ff] px-3 py-2 text-[#4338ca]">
                      <span className="font-label text-[11px] font-bold uppercase tracking-[0.18em]">
                        {dayProgress}%
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 space-y-2.5">
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

                <div className="course-surface min-w-0 rounded-[1.75rem] p-5 md:rounded-[2.2rem] md:p-6">
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                    Day Checkpoint
                  </p>
                  <h2 className="mt-2 font-serif text-[1.8rem] font-semibold leading-tight md:text-2xl" style={{ color: 'var(--theme-text-heading)' }}>
                    Validate the day
                  </h2>
                  <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                    After you finish the planned videos, take the checkpoint to complete the day and unlock the next step.
                  </p>

                  <div className="mt-5 course-progress-track">
                    <div className="course-progress-fill" style={{ width: `${dayProgress}%` }} />
                  </div>
                  <p className="mt-3 font-label text-xs font-bold" style={{ color: '#4338ca' }}>
                    {watchedSet.size}/{videos.length} videos complete
                  </p>

                  <div className="mt-6">
                    {dayCompleted ? (
                      <div className="course-surface-soft flex items-center gap-3 rounded-[1.4rem] px-4 py-4">
                        <span className="material-symbols-outlined text-[22px]" style={{ color: '#15803d' }}>
                          verified
                        </span>
                        <div>
                          <p className="font-body text-sm font-semibold" style={{ color: '#15803d' }}>
                            Day complete
                          </p>
                          <p className="font-body text-xs" style={{ color: 'var(--theme-text-body)' }}>
                            Checkpoint has already been passed.
                          </p>
                        </div>
                      </div>
                    ) : allWatched ? (
                      <button type="button" onClick={handleStartCheckpoint} disabled={loadingCheckpoint} className="course-primary-button w-full justify-center">
                        {loadingCheckpoint ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                            Preparing
                          </>
                        ) : (
                          <>
                            <span className="material-symbols-outlined text-[18px]">psychology</span>
                            Take Day Checkpoint
                          </>
                        )}
                      </button>
                    ) : (
                      <button type="button" disabled className="course-outline-button w-full justify-center opacity-50">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        Watch All Videos First
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>

        <button
          type="button"
          onClick={() => setIsTutorOpen(true)}
          className="course-floating-button fixed bottom-5 right-4 z-40 flex h-12 w-12 items-center justify-center rounded-full transition hover:scale-105 active:scale-95 md:bottom-6 md:right-6 md:h-14 md:w-14"
        >
          <span className="material-symbols-outlined text-[22px] text-white md:text-[24px]">smart_toy</span>
            {!hasTutorAccess ? (
              <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#f59e0b] text-white">
                <span className="material-symbols-outlined text-[10px]">lock</span>
              </span>
            ) : null}
          </button>
        </main>
      </div>

      {course && (
        <TutorChatPanel
          isOpen={isTutorOpen}
          onClose={() => setIsTutorOpen(false)}
          courseId={courseId}
          moduleIndex={dayIndex}
          subtopicIndex={activeVideoIdx}
          topicTitle={activeVideo?.title}
          hasTutorAccess={hasTutorAccess}
        />
      )}
    </>
  );
}
