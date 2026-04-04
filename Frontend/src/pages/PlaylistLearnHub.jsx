import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import TutorChatPanel from '../components/TutorChatPanel';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ─── Helpers ───
const formatDuration = (seconds) => {
  if (!seconds || seconds <= 0) return '0:00';
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  return `${m}:${String(s).padStart(2, '0')}`;
};

// ═══════════════════════════════════════════════
//  CHECKPOINT MODAL (Inline version)
// ═══════════════════════════════════════════════
function CheckpointModal({ checkpoint, courseId, dayIndex, clerkId, onClose, onSubmitted }) {
  const [activeTab, setActiveTab] = useState('theory');
  const [theoryAnswers, setTheoryAnswers] = useState(Array(checkpoint?.theoryQuestions?.length || 0).fill(''));
  const [codeFiles, setCodeFiles] = useState([{ fileName: 'filename', content: '' }]);
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState(null);
  const gutterRefs = useRef([]);
  const lastSub = checkpoint?.submissions?.length > 0 ? checkpoint.submissions[checkpoint.submissions.length - 1] : null;

  const syncScroll = (e, idx) => {
    if (gutterRefs.current[idx]) {
      gutterRefs.current[idx].scrollTop = e.target.scrollTop;
    }
  };

  useEffect(() => {
    if (lastSub && (checkpoint?.status === 'passed' || checkpoint?.status === 'failed_all')) {
      setResult(lastSub.feedback);
      setTheoryAnswers(lastSub.theoryAnswers || []);
      if (lastSub.codeFiles?.length > 0) setCodeFiles(lastSub.codeFiles);
    }
  }, []);

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}/day/${dayIndex}/checkpoint/submit`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId, theoryAnswers, codeFiles: checkpoint.questionType === 'mixed' ? codeFiles : [] })
      });
      const data = await res.json();
      if (data.feedback) setResult(data.feedback);
      onSubmitted(data);
    } catch (e) { console.error(e); }
    finally { setSubmitting(false); }
  };

  const addFile = () => setCodeFiles([...codeFiles, { fileName: 'filename', content: '' }]);
  const removeFile = (i) => setCodeFiles(codeFiles.filter((_, idx) => idx !== i));
  const updateFile = (i, key, val) => { const f = [...codeFiles]; f[i] = { ...f[i], [key]: val }; setCodeFiles(f); };
  const updateAnswer = (i, val) => { const a = [...theoryAnswers]; a[i] = val; setTheoryAnswers(a); };

  const isReview = checkpoint?.status === 'passed' || checkpoint?.status === 'failed_all';
  const attemptsUsed = checkpoint?.attemptsUsed || 0;
  const maxAttempts = checkpoint?.maxAttempts || 3;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative w-full h-full md:h-auto md:max-h-[90vh] max-w-4xl md:rounded-2xl flex flex-col overflow-hidden"
        style={{ background: 'var(--color-background)', border: '1px solid var(--theme-border-strong)' }}>

        {/* Header */}
        <div className="shrink-0 p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <div>
            <h2 className="font-headline text-lg font-bold" style={{ color: 'var(--theme-text-heading)' }}>
              {isReview ? '📊 Checkpoint Review' : `🧠 Day ${dayIndex + 1} Checkpoint`}
            </h2>
            <div className="flex items-center gap-3 mt-1">
              <span className="font-label text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {attemptsUsed}/{maxAttempts} attempts used
              </span>
              {result && (
                <span className={`font-label text-xs font-bold ${result.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  Score: {result.overallScore}%
                </span>
              )}
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10"
            style={{ border: '1px solid var(--theme-border)' }}>
            <span className="material-symbols-outlined text-sm" style={{ color: 'var(--theme-text-muted)' }}>close</span>
          </button>
        </div>

        {/* Tabs */}
        {checkpoint?.questionType === 'mixed' && (
          <div className="shrink-0 flex gap-2 px-5 pt-4">
            {[{ key: 'theory', label: '📝 Theory' }, { key: 'coding', label: '💻 Coding' }].map(t => (
              <button key={t.key} onClick={() => setActiveTab(t.key)}
                className="px-4 py-2 rounded-lg font-label text-xs font-bold transition-all"
                style={{ background: activeTab === t.key ? 'rgba(99,102,241,0.1)' : 'transparent', color: activeTab === t.key ? '#818cf8' : 'var(--theme-text-muted)', border: `1px solid ${activeTab === t.key ? 'rgba(99,102,241,0.3)' : 'var(--theme-border)'}` }}>
                {t.label}
              </button>
            ))}
          </div>
        )}

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-5 custom-scroll">
          {activeTab === 'theory' && (
            <div className="space-y-6 max-w-3xl mx-auto">
              {(checkpoint?.theoryQuestions || []).map((q, i) => {
                const fb = result?.theoryScores?.find(s => s.questionIndex === i);
                return (
                  <div key={i} className="rounded-xl p-5" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--theme-border-strong)' }}>
                    <div className="flex items-start gap-3 mb-3">
                      <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-label text-xs font-bold"
                        style={{ background: fb ? (fb.score >= 60 ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(99,102,241,0.1)', color: fb ? (fb.score >= 60 ? '#22c55e' : '#ef4444') : '#818cf8', border: `1px solid ${fb ? (fb.score >= 60 ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)') : 'rgba(99,102,241,0.2)'}` }}>
                        {fb ? `${fb.score}` : i + 1}
                      </span>
                      <div className="flex-1 min-w-0">
                        <MarkdownRenderer content={q.question} className="font-body text-sm font-semibold" />
                      </div>
                    </div>
                    <textarea value={theoryAnswers[i] || ''} onChange={e => updateAnswer(i, e.target.value)} disabled={isReview}
                      rows={5} placeholder="Write your detailed answer here..."
                      className="w-full bg-transparent rounded-lg p-3 font-body text-sm resize-y outline-none disabled:opacity-60 transition-all focus:border-indigo-500/50"
                      style={{ border: '1px solid var(--theme-border-strong)', color: 'var(--theme-text-heading)' }} />
                    {fb && fb.feedback && (
                      <div className="mt-3 p-4 rounded-lg" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                        <p className="font-label text-[10px] uppercase font-bold mb-1" style={{ color: '#a78bfa' }}>Feedback</p>
                        <MarkdownRenderer content={fb.feedback} className="font-body text-xs" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'coding' && checkpoint?.questionType === 'mixed' && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="rounded-xl p-5" style={{ background: 'var(--color-surface-container)', border: '1px solid var(--theme-border-strong)' }}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="material-symbols-outlined text-base" style={{ color: '#818cf8' }}>terminal</span>
                  <p className="font-label text-xs uppercase font-bold tracking-wider" style={{ color: '#818cf8' }}>Coding Challenge</p>
                </div>
                <MarkdownRenderer content={checkpoint.codingQuestion?.prompt} className="font-body text-sm mb-3" />
                {checkpoint.codingQuestion?.expectedBehavior && (
                  <div className="p-3 rounded-lg" style={{ background: 'rgba(34,197,94,0.08)', border: '1px solid rgba(34,197,94,0.25)' }}>
                    <p className="font-label text-[10px] uppercase font-bold mb-1" style={{ color: '#34d399' }}>Expected Behavior</p>
                    <MarkdownRenderer content={checkpoint.codingQuestion.expectedBehavior} className="font-body text-xs" />
                  </div>
                )}
              </div>
              {codeFiles.map((f, i) => (
                <div key={i} className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--theme-border-strong)' }}>
                  <div className="flex items-center gap-2 px-4 py-2" style={{ background: 'var(--color-surface-container-high)', borderBottom: '1px solid var(--theme-border-strong)' }}>
                    <span className="material-symbols-outlined text-sm" style={{ color: 'var(--theme-text-faint)' }}>description</span>
                    <input value={f.fileName} onChange={e => updateFile(i, 'fileName', e.target.value)} disabled={isReview}
                      className="flex-1 bg-transparent border-none outline-none font-label text-[10px] uppercase font-bold"
                      style={{ color: 'var(--theme-text-heading)' }} placeholder="filename" />
                    {codeFiles.length > 1 && !isReview && (
                      <button onClick={() => removeFile(i)} className="w-6 h-6 rounded flex items-center justify-center hover:bg-red-500/20">
                        <span className="material-symbols-outlined text-sm text-red-400">close</span>
                      </button>
                    )}
                  </div>
                  <div className="relative flex font-mono text-[13px] overflow-hidden rounded-b-xl"
                    style={{ 
                      background: '#1e1e1e',
                      borderTop: 'none',
                      minHeight: '200px'
                    }}>
                    {/* Line Numbers Gutter */}
                    <div ref={el => gutterRefs.current[i] = el}
                      className="shrink-0 w-10 py-5 bg-[#1e1e1e] text-[#858585] text-[11px] text-right pr-3 select-none border-r border-[#333333] overflow-hidden leading-relaxed">
                      {(f.content.split('\n').map((_, idx) => (
                        <div key={idx} className="h-[21px]">{idx + 1}</div>
                      )))}
                      {/* Add extra empty line for breathing room */}
                      <div className="h-[20px]"></div>
                    </div>
                    {/* Textarea */}
                    <textarea value={f.content} 
                      onChange={e => updateFile(i, 'content', e.target.value)} 
                      onScroll={e => syncScroll(e, i)}
                      disabled={isReview}
                      rows={10} placeholder="Paste your code here..."
                      className="flex-1 p-5 bg-transparent outline-none disabled:opacity-60 leading-relaxed custom-scroll whitespace-pre overflow-auto"
                      style={{ 
                        color: '#d4d4d4',
                        caretColor: '#ffffff',
                        resize: 'none',
                        lineHeight: '21px'
                      }} />
                  </div>
                </div>
              ))}
              {!isReview && (
                <button onClick={addFile} className="w-full py-3 rounded-xl font-label text-xs font-bold flex items-center justify-center gap-2 transition-all hover:bg-white/5 active:scale-95"
                  style={{ border: '1px dashed var(--theme-border-strong)', color: 'var(--theme-text-muted)' }}>
                  <span className="material-symbols-outlined text-sm">add</span> Add File
                </button>
              )}
              {result?.codingScore && (
                <div className="p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.25)' }}>
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-label text-xs uppercase font-bold" style={{ color: '#a78bfa' }}>Coding Score</p>
                    <span className={`font-headline text-lg font-bold ${result.codingScore.score >= 60 ? 'text-emerald-400' : 'text-red-400'}`}>{result.codingScore.score}/100</span>
                  </div>
                  <MarkdownRenderer content={result.codingScore.feedback} className="font-body text-xs" />
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="shrink-0 p-5 flex items-center justify-between" style={{ borderTop: '1px solid var(--theme-border)' }}>
          {result ? (
            <div className="flex items-center gap-2">
              <span className={`w-3 h-3 rounded-full ${result.passed ? 'bg-emerald-400' : 'bg-red-400'}`} />
              <span className="font-label text-xs font-bold" style={{ color: result.passed ? '#34d399' : '#ef4444' }}>
                {result.passed ? 'Passed!' : 'Not passed yet'}
              </span>
            </div>
          ) : <div />}
          {!isReview && attemptsUsed < maxAttempts ? (
            <button onClick={handleSubmit} disabled={submitting}
              className="px-8 py-3 rounded-xl font-label text-sm font-bold text-white disabled:opacity-50 flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              {submitting ? (
                <><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" /> Grading...</>
              ) : (
                <><span className="material-symbols-outlined text-base">send</span> Submit ({maxAttempts - attemptsUsed} left)</>
              )}
            </button>
          ) : (
            <button onClick={onClose} className="px-6 py-3 rounded-xl font-label text-sm font-bold transition-all hover:bg-white/5"
              style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}>Close</button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Video List Item ───
function VideoListItem({ video, index, isActive, isWatched, onClick }) {
  const statusIcon = isWatched ? 'check_circle' : isActive ? 'play_circle' : 'radio_button_unchecked';
  const statusColor = isWatched ? '#22c55e' : isActive ? '#8b5cf6' : 'var(--theme-text-muted)';

  return (
    <button
      onClick={() => onClick(index)}
      className={`w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 group transition-all duration-200 cursor-pointer ${
        isActive ? 'subtopic-active-item' : 'hover:bg-white/5'
      }`}
    >
      {/* Index badge */}
      <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-label text-xs font-bold"
        style={{
          background: isActive ? 'rgba(139,92,246,0.15)' : isWatched ? 'rgba(34,197,94,0.12)' : 'var(--theme-glass-bg)',
          color: statusColor
        }}>
        {isWatched ? '✓' : index + 1}
      </div>

      {/* Title + Duration */}
      <div className="flex-1 min-w-0">
        <span className="text-sm font-body truncate block transition-colors"
          style={{
            color: isActive ? 'var(--theme-text-heading)' : isWatched ? 'var(--theme-text-body-strong)' : 'var(--theme-text-body)',
            fontWeight: isActive ? 600 : 400
          }}>
          {video.title}
        </span>
        {video.channel && (
          <span className="text-[10px] font-label block mt-0.5 truncate" style={{ color: 'var(--theme-text-faint)' }}>
            {video.channel} • {formatDuration(video.duration)}
          </span>
        )}
      </div>

      {/* Status icon */}
      <span className="material-symbols-outlined text-lg shrink-0 transition-colors" style={{ color: statusColor }}>
        {statusIcon}
      </span>
    </button>
  );
}

// ══════════════════════════════════════════════════
//  MAIN PAGE — PLAYLIST LEARN HUB
// ══════════════════════════════════════════════════
export default function PlaylistLearnHub() {
  const { courseId, dayIndex: dayIdxStr } = useParams();
  const dayIndex = parseInt(dayIdxStr, 10);
  const navigate = useNavigate();
  const { user, isLoaded } = useUser();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeVideoIdx, setActiveVideoIdx] = useState(0);
  const [watchedSet, setWatchedSet] = useState(new Set());

  // Checkpoint & Chat state
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
          setWatchedSet(new Set(day.videos.map((_, i) => i)));
        }
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [courseId, dayIndex]);

  const fetchUsage = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch(`${API_BASE}/api/user/${user.id}/usage`);
      const data = await res.json();
      if (data.success) setUsageData(data);
    } catch (e) { console.error(e); }
  }, [user]);

  useEffect(() => { 
    fetchCourse();
    fetchUsage();
  }, [fetchCourse, fetchUsage, isLoaded]);

  const handleMarkWatched = () => {
    setWatchedSet(prev => {
      const next = new Set(prev);
      next.add(activeVideoIdx);
      return next;
    });
    // Auto-advance to the next unwatched video
    const day = course?.days?.[dayIndex];
    if (day) {
      for (let i = activeVideoIdx + 1; i < day.videos.length; i++) {
        if (!watchedSet.has(i)) {
          setActiveVideoIdx(i);
          break;
        }
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
    } catch (e) { console.error(e); }
    finally { setLoadingCheckpoint(false); }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#8b5cf6', borderTopColor: 'transparent' }} />
            <p className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>Loading day content...</p>
          </div>
        </div>
      </>
    );
  }

  const day = course?.days?.[dayIndex];
  if (!day) {
    return (
      <>
        <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }} />
        <div className="relative z-10 min-h-screen flex items-center justify-center flex-col gap-4">
          <span className="material-symbols-outlined text-5xl" style={{ color: 'var(--theme-text-faint)' }}>error_outline</span>
          <p className="font-body text-lg" style={{ color: 'var(--theme-text-body)' }}>Day not found.</p>
          <Link to={`/playlist/${courseId}`} className="font-label text-sm font-bold underline" style={{ color: 'var(--color-primary)' }}>← Back to Course</Link>
        </div>
      </>
    );
  }

  const videos = day.videos || [];
  const activeVideo = videos[activeVideoIdx];
  const allWatched = watchedSet.size >= videos.length;
  const checkpointStatus = day.checkpoint?.status || 'locked';
  const dayCompleted = day.status === 'ready' || checkpointStatus === 'passed';

  return (
    <>
      <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }} />

      {/* Checkpoint Modal */}
      {showCheckpoint && checkpointData && (
        <CheckpointModal
          checkpoint={checkpointData}
          courseId={courseId}
          dayIndex={dayIndex}
          clerkId={user?.id}
          onClose={() => { setShowCheckpoint(false); setCheckpointData(null); }}
          onSubmitted={(data) => {
            fetchCourse();
            if (data.feedback?.passed) {
              // Day completed, could auto-navigate 
            }
          }}
        />
      )}

      <div className="relative z-10 min-h-screen pt-28 pb-20 px-4 md:px-6 lg:px-8 max-w-[1400px] mx-auto font-body">

        {/* ─── Breadcrumb & Header ─── */}
        <div className="mb-8 animate-blur-text" style={{ animationDelay: '0.1s' }}>
          <Link to={`/playlist/${courseId}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-label uppercase tracking-[0.15em] mb-4 transition-colors hover:scale-[1.02]"
            style={{ color: 'var(--theme-text-muted)' }}>
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Study Plan
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-pulse" />
                <span className="font-label text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--theme-text-muted)' }}>
                  Day {day.dayNumber}
                </span>
                <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>•</span>
                <span className="font-label text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  {watchedSet.size}/{videos.length} Watched
                </span>
                {day.isFiller && (
                  <>
                    <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>•</span>
                    <span className="px-2 py-0.5 rounded-full font-label text-[9px] font-bold uppercase"
                      style={{ background: 'rgba(168,85,247,0.1)', color: '#a855f7', border: '1px solid rgba(168,85,247,0.2)' }}>
                      Filler: {day.fillerTopic}
                    </span>
                  </>
                )}
              </div>
              <h1 className="font-serif text-3xl md:text-5xl font-bold italic leading-tight" style={{ color: 'var(--theme-text-heading)' }}>
                {activeVideo?.title || `Day ${day.dayNumber}`}
              </h1>
            </div>
          </div>
        </div>

        {/* ─── Main Grid Layout ─── */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">

          {/* ═══ LEFT: VIDEO PLAYER (8 Cols) ═══ */}
          <div className="lg:col-span-8 xl:col-span-8 lg:sticky lg:top-28 flex flex-col gap-6">

            {/* Video Container */}
            <div className="animate-blur-text" style={{ animationDelay: '0.2s' }}>
              {activeVideo?.videoId ? (
                <div className="video-glow aspect-video w-full rounded-2xl overflow-hidden shadow-2xl relative" style={{ background: '#000' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${activeVideo.videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0`}
                    title={activeVideo?.title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  />
                </div>
              ) : (
                <div className="video-glow aspect-video w-full rounded-2xl overflow-hidden relative flex flex-col items-center justify-center p-8 text-center glass-pill">
                  <span className="material-symbols-outlined text-6xl mb-4" style={{ color: 'var(--theme-text-faint)' }}>videocam_off</span>
                  <p className="font-label text-sm uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>No video available.</p>
                </div>
              )}
            </div>

            {/* Video Controls & Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-blur-text" style={{ animationDelay: '0.3s' }}>

              {/* Channel Meta */}
              <div className="flex-1 min-w-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--theme-border-strong)', backdropFilter: 'blur(20px)' }}>
                {activeVideo?.videoId ? (
                  <>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(239,68,68,0.1)' }}>
                      <span className="material-symbols-outlined text-lg" style={{ color: '#ef4444' }}>smart_display</span>
                    </div>
                    <div className="truncate">
                      <p className="font-label text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>Source</p>
                      <p className="font-body text-xs font-semibold truncate" style={{ color: 'var(--theme-text-heading)' }}>{activeVideo.channel || 'YouTube Tutorial'}</p>
                    </div>
                  </>
                ) : (
                  <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>No video source</span>
                )}
              </div>

              {/* Mark as Watched Button */}
              {activeVideo?.videoId && !watchedSet.has(activeVideoIdx) && (
                <button
                  onClick={handleMarkWatched}
                  className="relative shrink-0 px-8 py-3.5 rounded-2xl font-label text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98] cursor-pointer group overflow-hidden"
                  style={{
                    background: 'var(--theme-glass-bg)',
                    border: '1px solid var(--theme-border-strong)',
                    color: 'var(--theme-text-heading)'
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, transparent 100%)' }} />
                  <span className="material-symbols-outlined text-[18px] text-indigo-400 relative z-10 group-hover:scale-110 transition-transform duration-300">task_alt</span>
                  <span className="relative z-10">Mark as Watched</span>
                </button>
              )}
              {watchedSet.has(activeVideoIdx) && (
                <div className="shrink-0 px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2" style={{ background: 'var(--theme-glass-bg)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: '#818cf8' }}>check_circle</span>
                  <span className="font-label text-sm font-bold" style={{ color: '#818cf8' }}>Watched</span>
                </div>
              )}
            </div>

            {/* Day Navigation */}
            <div className="flex items-center justify-between gap-3 animate-blur-text" style={{ animationDelay: '0.35s' }}>
              <button
                onClick={() => dayIndex > 0 && navigate(`/playlist/${courseId}/day/${dayIndex - 1}`)}
                disabled={dayIndex <= 0}
                className="px-5 py-2.5 rounded-xl font-label text-xs font-bold flex items-center gap-2 transition-all hover:bg-white/5 disabled:opacity-30 disabled:cursor-not-allowed"
                style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}>
                <span className="material-symbols-outlined text-sm">arrow_back</span>
                Day {dayIndex}
              </button>
              {dayCompleted && dayIndex < (course?.days?.length || 0) - 1 && (
                <button
                  onClick={() => navigate(`/playlist/${courseId}/day/${dayIndex + 1}`)}
                  className="px-5 py-2.5 rounded-xl font-label text-xs font-bold flex items-center gap-2 transition-all hover:scale-[1.02] text-white"
                  style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 15px rgba(99,102,241,0.3)' }}>
                  Day {dayIndex + 2}
                  <span className="material-symbols-outlined text-sm">arrow_forward</span>
                </button>
              )}
            </div>
          </div>

          {/* ═══ RIGHT: PLAYLIST SIDEBAR (4 Cols) ═══ */}
          <aside className="lg:col-span-4 xl:col-span-4 animate-blur-text" style={{ animationDelay: '0.4s' }}>
            <div className="panel-card p-6 h-full flex flex-col" style={{ maxHeight: 'calc(100vh - 140px)', position: 'sticky', top: '112px' }}>

              <div className="mb-5">
                <h2 className="font-headline text-lg font-bold mb-1" style={{ color: 'var(--theme-text-heading)' }}>
                  Day {day.dayNumber} Videos
                </h2>
                <p className="text-xs font-body" style={{ color: 'var(--theme-text-muted)' }}>
                  {course?.course_title}
                </p>
              </div>

              {/* Progress Bar */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <span className="font-label text-[10px] uppercase tracking-wider font-bold" style={{ color: 'var(--theme-text-muted)' }}>Progress</span>
                  <span className="font-label text-xs font-bold" style={{ color: '#818cf8' }}>
                    {videos.length > 0 ? Math.round((watchedSet.size / videos.length) * 100) : 0}%
                  </span>
                </div>
                <div className="h-1.5 rounded-full overflow-hidden" style={{ background: 'rgba(99,102,241,0.1)' }}>
                  <motion.div
                    className="h-full rounded-full"
                    style={{ background: 'linear-gradient(90deg, #6366f1, #818cf8)' }}
                    initial={{ width: 0 }}
                    animate={{ width: `${videos.length > 0 ? (watchedSet.size / videos.length) * 100 : 0}%` }}
                    transition={{ duration: 0.6, ease: 'easeOut' }}
                  />
                </div>
              </div>

              {/* Video Playlist */}
              <div className="flex-1 overflow-y-auto custom-scroll pr-2 -mr-2 space-y-2 mb-6">
                {videos.map((video, i) => (
                  <VideoListItem
                    key={video.videoId || i}
                    video={video}
                    index={i}
                    isActive={i === activeVideoIdx}
                    isWatched={watchedSet.has(i)}
                    onClick={(idx) => setActiveVideoIdx(idx)}
                  />
                ))}
              </div>

              {/* Checkpoint Trigger Button */}
              <div className="pt-5" style={{ borderTop: '1px solid var(--theme-border)' }}>
                {dayCompleted ? (
                  <div className="w-full py-4 rounded-2xl flex items-center justify-center gap-2" style={{ background: 'rgba(52,211,153,0.08)', border: '1px solid rgba(52,211,153,0.2)' }}>
                    <span className="material-symbols-outlined text-[20px]" style={{ color: '#34d399' }}>verified</span>
                    <span className="font-label text-sm font-bold uppercase tracking-widest" style={{ color: '#34d399' }}>Day Complete</span>
                  </div>
                ) : allWatched ? (
                  <div onClick={handleStartCheckpoint} className="cursor-pointer group relative">
                    <div className="absolute -inset-1 bg-linear-to-r from-indigo-500/30 to-purple-600/30 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500" />
                    <button
                      disabled={loadingCheckpoint}
                      className="w-full relative py-4 rounded-2xl font-label text-sm font-black uppercase tracking-widest flex items-center justify-center gap-3 text-white transition-all group-hover:scale-[1.02] active:scale-[0.98] disabled:opacity-70"
                      style={{ background: 'linear-gradient(135deg, #312e81, #4c1d95)', boxShadow: '0 0 30px rgba(99,102,241,0.3)' }}>
                      {loadingCheckpoint ? (
                        <><div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin" /> Generating...</>
                      ) : (
                        <><span className="material-symbols-outlined text-[20px]">psychology</span> Take Day Checkpoint</>
                      )}
                    </button>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full py-4 rounded-2xl font-label text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                    style={{ background: 'var(--theme-glass-bg)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}>
                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                    Watch All Videos First
                  </button>
                )}
              </div>

            </div>
          </aside>

        </div>
      </div>

      {/* Floating AI Tutor Button */}
      <button
        onClick={() => setIsTutorOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95 transition-all"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        <span className="material-symbols-outlined text-white text-2xl">smart_toy</span>
        {!usageData || usageData.plan !== 'pro' ? (
           <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-[#06080f]">
             <span className="material-symbols-outlined text-[10px] text-white">lock</span>
           </span>
        ) : null}
      </button>

      {course && (
        <TutorChatPanel
          isOpen={isTutorOpen}
          onClose={() => setIsTutorOpen(false)}
          courseId={courseId}
          moduleIndex={dayIndex}
          subtopicIndex={activeVideoIdx}
          topicTitle={activeVideo?.title}
          isPro={usageData?.plan === 'pro'}
        />
      )}
    </>
  );
}
