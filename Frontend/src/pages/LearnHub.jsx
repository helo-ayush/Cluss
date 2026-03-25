import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import SubtopicListItem from '../components/SubtopicListItem';
import { ShimmerButton } from '../components/magicui/ShimmerButton';

const API_BASE = 'http://localhost:3000';

// ─── Quiz Modal Component ───
function QuizModal({ questions, onSubmit, onClose }) {
  const [answers, setAnswers] = useState(Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(false);
  const [results, setResults] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = option;
    setAnswers(newAnswers);
  };

  const handleSubmit = async () => {
    if (answers.some(a => a === null) || submitting) return;
    setSubmitting(true);
    const data = await onSubmit(answers);
    setResults(data);
    setSubmitted(true);
    setSubmitting(false);
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const allAnswered = answeredCount === questions.length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 md:p-6"
      style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>

      <div className="liquid-glass rounded-2xl w-full max-w-2xl flex flex-col"
        style={{ maxHeight: 'calc(100vh - 48px)', border: '1px solid var(--theme-border-strong)' }}>

        {/* ── Sticky Header ── */}
        <div className="shrink-0 p-6 pb-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-headline text-2xl font-bold italic" style={{ color: 'var(--theme-text-heading)' }}>
              {submitted ? (results?.passed ? '🎉 Module Complete!' : '📚 Keep Learning') : '🧠 Module Quiz'}
            </h2>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:scale-110"
              style={{ background: 'var(--theme-glass-bg)', border: '1px solid var(--theme-border)' }}>
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--theme-text-muted)' }}>close</span>
            </button>
          </div>

          {submitted && results ? (
            <div className="p-3 rounded-xl" style={{ background: results.passed ? 'rgba(34,197,94,0.08)' : 'rgba(239,68,68,0.08)', border: `1px solid ${results.passed ? 'rgba(34,197,94,0.25)' : 'rgba(239,68,68,0.25)'}` }}>
              <div className="flex items-center justify-between mb-1">
                <span className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>{results.message}</span>
                <span className={`font-label text-lg font-bold ${results.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                  {results.score}%
                </span>
              </div>
              <p className="font-label text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                {results.correctCount} / {results.totalQuestions} correct
              </p>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 flex-wrap">
              {questions.map((_, i) => (
                <div key={i} className="w-7 h-7 rounded-lg flex items-center justify-center text-xs font-label font-bold transition-all"
                  style={{
                    background: answers[i] !== null ? 'rgba(139,92,246,0.15)' : 'var(--theme-glass-bg)',
                    border: `1px solid ${answers[i] !== null ? 'rgba(139,92,246,0.4)' : 'var(--theme-border)'}`,
                    color: answers[i] !== null ? '#8b5cf6' : 'var(--theme-text-faint)'
                  }}>
                  {i + 1}
                </div>
              ))}
              <span className="ml-2 text-xs font-label" style={{ color: 'var(--theme-text-muted)' }}>
                {answeredCount}/{questions.length} answered
              </span>
            </div>
          )}
        </div>

        {/* ── Scrollable Questions ── */}
        <div className="flex-1 overflow-y-auto p-6 space-y-5" style={{ minHeight: 0 }}>
          {questions.map((q, qIdx) => {
            const result = submitted ? results?.results?.[qIdx] : null;
            return (
              <div key={qIdx} className="p-5 rounded-xl" style={{ background: 'var(--theme-glass-bg)', border: '1px solid var(--theme-border)' }}>
                <div className="flex items-start gap-3 mb-4">
                  <span className="shrink-0 w-7 h-7 rounded-lg flex items-center justify-center font-label text-xs font-bold"
                    style={{
                      background: submitted ? (result?.correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : (answers[qIdx] !== null ? 'rgba(139,92,246,0.15)' : 'var(--theme-glass-bg)'),
                      border: `1px solid ${submitted ? (result?.correct ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : (answers[qIdx] !== null ? 'rgba(139,92,246,0.4)' : 'var(--theme-border)')}`,
                      color: submitted ? (result?.correct ? '#22c55e' : '#ef4444') : (answers[qIdx] !== null ? '#8b5cf6' : 'var(--theme-text-faint)')
                    }}>
                    {submitted ? (result?.correct ? '✓' : '✗') : qIdx + 1}
                  </span>
                  <p className="font-body text-sm font-semibold leading-relaxed" style={{ color: 'var(--theme-text-heading)' }}>
                    {q.question}
                  </p>
                </div>
                <div className="space-y-2 ml-10">
                  {q.options.map((opt, oIdx) => {
                    const isSelected = answers[qIdx] === opt;
                    let optBg = 'transparent';
                    let optBorder = 'var(--theme-border)';
                    let optColor = 'var(--theme-text-body)';
                    let optIcon = '';

                    if (submitted && result) {
                      if (opt === result.correctAnswer) { optBg = 'rgba(34,197,94,0.08)'; optBorder = 'rgba(34,197,94,0.4)'; optColor = '#22c55e'; optIcon = 'check_circle'; }
                      else if (isSelected && !result.correct) { optBg = 'rgba(239,68,68,0.08)'; optBorder = 'rgba(239,68,68,0.4)'; optColor = '#ef4444'; optIcon = 'cancel'; }
                    } else if (isSelected) { optBg = 'rgba(139,92,246,0.08)'; optBorder = 'rgba(139,92,246,0.4)'; optColor = '#8b5cf6'; }

                    return (
                      <button key={oIdx} onClick={() => handleSelect(qIdx, opt)} disabled={submitted}
                        className="w-full text-left px-4 py-3 rounded-xl text-sm font-body transition-all cursor-pointer disabled:cursor-default flex items-center gap-3"
                        style={{ background: optBg, border: `1px solid ${optBorder}`, color: optColor }}>
                        <span className="shrink-0 w-5 h-5 rounded-full flex items-center justify-center text-xs"
                          style={{ border: `1.5px solid ${isSelected || (submitted && opt === result?.correctAnswer) ? optColor : 'var(--theme-border)'}`, background: isSelected ? optColor : 'transparent', color: isSelected ? 'white' : 'transparent' }}>
                          {isSelected && !submitted && '•'}
                        </span>
                        <span className="flex-1">{opt}</span>
                        {optIcon && <span className="material-symbols-outlined text-base" style={{ color: optColor }}>{optIcon}</span>}
                      </button>
                    );
                  })}
                </div>
                {submitted && result && (
                  <div className="mt-3 ml-10 px-3 py-2 rounded-lg text-xs font-body" style={{ background: 'rgba(139,92,246,0.06)', border: '1px solid rgba(139,92,246,0.15)', color: 'var(--theme-text-muted)' }}>
                    💡 {result.explanation}
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* ── Sticky Footer ── */}
        <div className="shrink-0 p-6 pt-4 flex gap-3" style={{ borderTop: '1px solid var(--theme-border)' }}>
          {!submitted ? (
            <>
              <button onClick={onClose} className="flex-1 py-3.5 rounded-xl font-label text-sm font-bold transition-all cursor-pointer hover:opacity-80"
                style={{ background: 'var(--theme-glass-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}>Cancel</button>
              <button onClick={handleSubmit} disabled={!allAnswered || submitting}
                className="flex-1 py-3.5 rounded-xl font-label text-sm font-bold transition-all cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed forge-btn-primary text-on-primary flex items-center justify-center gap-2">
                {submitting ? (<><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div> Grading...</>) : (<>Submit ({answeredCount}/{questions.length})</>)}
              </button>
            </>
          ) : (
            <button onClick={onClose} className="w-full py-3.5 rounded-xl font-label text-sm font-bold transition-all cursor-pointer forge-btn-primary text-on-primary">
              {results?.passed ? 'Continue to Next Module →' : 'Close & Review'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Confirmation Modal ───
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(6px)' }}>
      <div className="liquid-glass rounded-2xl p-8 max-w-md w-full text-center">
        <span className="material-symbols-outlined text-5xl mb-4 block" style={{ color: '#f59e0b' }}>warning</span>
        <h3 className="font-headline text-xl font-bold italic mb-2" style={{ color: 'var(--theme-text-heading)' }}>
          Not all lectures watched
        </h3>
        <p className="text-sm mb-6" style={{ color: 'var(--theme-text-body)' }}>
          You haven't completed all the video lectures in this module. Taking the quiz now may be harder. Do you still want to proceed?
        </p>
        <div className="flex gap-3">
          <button onClick={onCancel}
            className="flex-1 py-3 rounded-xl font-label text-sm font-bold cursor-pointer transition-all"
            style={{ background: 'var(--theme-glass-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}
          >Go Back</button>
          <button onClick={onConfirm}
            className="flex-1 py-3 rounded-xl font-label text-sm font-bold cursor-pointer transition-all forge-btn-primary text-on-primary"
          >Take Quiz Anyway</button>
        </div>
      </div>
    </div>
  );
}

// ─── Main Page ───
export default function LearnHub() {
  const { courseId, moduleIndex: modIdxStr } = useParams();
  const moduleIndex = parseInt(modIdxStr, 10);
  const navigate = useNavigate();

  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [prepStatus, setPrepStatus] = useState(null); // null = unknown until first fetch
  const prepTriggered = React.useRef(false);
  const fetchDone = React.useRef(false);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        const mod = data.course.modules[moduleIndex];
        if (mod) {
          const status = mod.prepStatus || 'pending';
          setPrepStatus(status);
          if (status === 'ready' || status === 'preparing' || status === 'failed') {
            prepTriggered.current = true;
          }
        }
      }
    } catch (err) {
      console.error('Failed to fetch course:', err);
    } finally {
      setLoading(false);
      fetchDone.current = true;
    }
  }, [courseId, moduleIndex]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  // Auto-trigger preparation ONLY after initial fetch confirms it's pending (once only)
  useEffect(() => {
    if (!fetchDone.current) return; // Wait for fetch to complete first
    if (prepTriggered.current) return;
    if (prepStatus !== 'pending') return;
    prepTriggered.current = true;

    fetch(`${API_BASE}/api/course/${courseId}/module/${moduleIndex}/prepare`, { method: 'POST' })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setPrepStatus('preparing');
          console.log('Triggered module preparation');
        }
      })
      .catch(err => console.error('Failed to trigger preparation:', err));
  }, [prepStatus, courseId, moduleIndex]);

  // Poll prep status while preparing
  useEffect(() => {
    if (prepStatus !== 'preparing') return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/course/${courseId}/module/${moduleIndex}/prep-status`);
        const data = await res.json();
        if (data.success) {
          setPrepStatus(data.prepStatus);
          if (data.prepStatus === 'ready' || data.prepStatus === 'failed') {
            clearInterval(interval);
            fetchCourse(); // Refresh full data
          }
        }
      } catch (e) { /* ignore */ }
    }, 3000);
    return () => clearInterval(interval);
  }, [prepStatus, courseId, moduleIndex, fetchCourse]);

  const currentModule = course?.modules?.[moduleIndex];
  const subtopics = currentModule?.subtopics || [];
  const activeSubtopic = subtopics[activeSubIdx];
  const watchedCount = subtopics.filter(s => s.status === 'completed').length;
  const allWatched = watchedCount === subtopics.length;

  // Collect all quiz questions from the module
  const allQuizQuestions = subtopics.flatMap(s => s.quiz || []);

  const handleMarkWatched = async () => {
    if (markingComplete || !activeSubtopic || activeSubtopic.status === 'completed') return;
    try {
      setMarkingComplete(true);
      await fetch(`${API_BASE}/api/course/${courseId}/module/${moduleIndex}/subtopic/${activeSubIdx}/watched`, { method: 'POST' });
      await fetchCourse();
    } catch (err) {
      console.error('Mark watched failed:', err);
    } finally {
      setMarkingComplete(false);
    }
  };

  const handleQuizClick = () => {
    if (allWatched) {
      setShowQuiz(true);
    } else {
      setShowConfirm(true);
    }
  };

  const handleQuizSubmit = async (userAnswers) => {
    const res = await fetch(`${API_BASE}/api/course/${courseId}/module/${moduleIndex}/grade-module`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAnswers })
    });
    const data = await res.json();
    if (data.passed) {
      // Refresh course so UI updates
      setTimeout(() => fetchCourse(), 500);
    }
    return data;
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    fetchCourse();
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }}></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: '#8b5cf6', borderTopColor: 'transparent' }}></div>
        </div>
      </>
    );
  }

  if (!currentModule) {
    return (
      <>
        <Navbar />
        <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }}></div>
        <div className="relative z-10 min-h-screen flex items-center justify-center">
          <p className="font-body" style={{ color: 'var(--theme-text-body)' }}>Module not found.</p>
        </div>
      </>
    );
  }

  const isPreparing = prepStatus === 'preparing' || prepStatus === 'pending';

  return (
    <>
      <Navbar />
      <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }}></div>

      {/* Modals */}
      {showConfirm && (
        <ConfirmModal
          onConfirm={() => { setShowConfirm(false); setShowQuiz(true); }}
          onCancel={() => setShowConfirm(false)}
        />
      )}
      {showQuiz && allQuizQuestions.length > 0 && (
        <QuizModal
          questions={allQuizQuestions}
          onSubmit={handleQuizSubmit}
          onClose={handleQuizClose}
        />
      )}

      <div className="relative z-10 min-h-screen pt-28 pb-20 px-4 md:px-6 lg:px-8 max-w-[1400px] mx-auto font-body">

        {/* ─── Breadcrumb & Header ─── */}
        <div className="mb-8 animate-blur-text" style={{ animationDelay: '0.1s' }}>
          <Link to={`/course/${courseId}`}
            className="inline-flex items-center gap-1.5 text-[11px] font-label uppercase tracking-[0.15em] mb-4 transition-colors hover:scale-[1.02]"
            style={{ color: 'var(--theme-text-muted)' }}>
            <span className="material-symbols-outlined text-[14px]">arrow_back</span>
            Back to Course Map
          </Link>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="w-2.5 h-2.5 rounded-full bg-indigo-500 shadow-[0_0_12px_rgba(99,102,241,0.6)] animate-pulse"></div>
                <span className="font-label text-xs uppercase tracking-widest font-bold" style={{ color: 'var(--theme-text-muted)' }}>
                  Module {moduleIndex + 1}
                </span>
                <span className="text-xs" style={{ color: 'var(--theme-text-faint)' }}>•</span>
                <span className="font-label text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                  {watchedCount}/{subtopics.length} Watched
                </span>
              </div>
              <h1 className="font-serif text-3xl md:text-5xl lg:text-5xl font-bold italic leading-tight" style={{ color: 'var(--theme-text-heading)' }}>
                {activeSubtopic?.subtopic_title || currentModule.module_title}
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
              {activeSubtopic?.videoId && activeSubtopic.videoId !== 'none' ? (
                <div className="video-glow aspect-video w-full rounded-2xl overflow-hidden shadow-2xl relative" style={{ background: '#000' }}>
                  <iframe
                    className="absolute inset-0 w-full h-full"
                    src={`https://www.youtube.com/embed/${activeSubtopic.videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0`}
                    title={activeSubtopic?.subtopic_title}
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                  ></iframe>
                </div>
              ) : isPreparing ? (
                <div className="video-glow aspect-video w-full rounded-2xl overflow-hidden relative flex flex-col items-center justify-center p-8 text-center glass-pill">
                  <div className="w-14 h-14 rounded-full border-4 border-indigo-500 border-t-transparent animate-spin mb-6"></div>
                  <h3 className="font-serif text-2xl italic mb-3" style={{ color: 'var(--theme-text-heading)' }}>
                    Forging the perfect video lesson...
                  </h3>
                  <p className="text-sm max-w-md" style={{ color: 'var(--theme-text-body)' }}>
                    Our AI is currently scouring YouTube, reading transcripts, and curating the absolute best tutorial for this exact topic.
                  </p>
                </div>
              ) : (
                <div className="video-glow aspect-video w-full rounded-2xl overflow-hidden relative flex flex-col items-center justify-center p-8 text-center glass-pill">
                  <span className="material-symbols-outlined text-6xl mb-4" style={{ color: 'var(--theme-text-faint)' }}>videocam_off</span>
                  <p className="font-label text-sm uppercase tracking-wide" style={{ color: 'var(--theme-text-muted)' }}>No video found for this subtopic.</p>
                </div>
              )}
            </div>

            {/* Video Controls & Info Bar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-blur-text" style={{ animationDelay: '0.3s' }}>
              
              {/* Channel Meta */}
              <div className="flex-1 min-w-0 flex items-center gap-3 px-5 py-3.5 rounded-2xl" style={{ background: 'var(--dash-card-bg)', border: '1px solid var(--theme-border-strong)', backdropFilter: 'blur(20px)' }}>
                {activeSubtopic?.videoId && activeSubtopic.videoId !== 'none' ? (
                  <>
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: 'rgba(99,102,241,0.1)' }}>
                      <span className="material-symbols-outlined text-lg" style={{ color: '#6366f1' }}>smart_display</span>
                    </div>
                    <div className="truncate">
                      <p className="font-label text-[10px] uppercase tracking-widest font-bold mb-0.5" style={{ color: 'var(--theme-text-muted)' }}>Source</p>
                      <p className="font-body text-xs font-semibold truncate" style={{ color: 'var(--theme-text-heading)' }}>{activeSubtopic.channelTitle || 'YouTube Tutorial'}</p>
                    </div>
                  </>
                ) : (
                   <span className="text-xs" style={{ color: 'var(--theme-text-muted)' }}>Waiting for video source...</span>
                )}
              </div>

              {/* Mark Button */}
              {activeSubtopic?.status !== 'completed' && activeSubtopic?.videoId && activeSubtopic.videoId !== 'none' && (
                <button
                  onClick={handleMarkWatched}
                  disabled={markingComplete}
                  className="relative shrink-0 px-8 py-3.5 rounded-2xl font-label text-sm font-bold flex items-center justify-center gap-2.5 transition-all duration-300 active:scale-[0.98] cursor-pointer disabled:opacity-50 group overflow-hidden"
                  style={{
                    background: 'var(--theme-glass-bg)',
                    border: '1px solid var(--theme-border-strong)',
                    color: 'var(--theme-text-heading)'
                  }}
                >
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(99,102,241,0.1) 0%, transparent 100%)' }}></div>
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" style={{ boxShadow: 'inset 0 0 12px rgba(99,102,241,0.2)' }}></div>
                  
                  {markingComplete ? (
                    <><div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin relative z-10 block"></div><span className="relative z-10">Saving...</span></>
                  ) : (
                    <><span className="material-symbols-outlined text-[18px] text-indigo-400 relative z-10 group-hover:scale-110 transition-transform duration-300">task_alt</span><span className="relative z-10">Mark as Watched</span></>
                  )}
                </button>
              )}
              {activeSubtopic?.status === 'completed' && (
                <div className="shrink-0 px-8 py-3.5 rounded-2xl flex items-center justify-center gap-2" style={{ background: 'var(--theme-glass-bg)', border: '1px solid rgba(99,102,241,0.3)' }}>
                  <span className="material-symbols-outlined text-[18px]" style={{ color: '#818cf8' }}>check_circle</span>
                  <span className="font-label text-sm font-bold" style={{ color: '#818cf8' }}>Completed</span>
                </div>
              )}
            </div>
          </div>

          {/* ═══ RIGHT: CURRICULUM SIDEBAR (4 Cols) ═══ */}
          <aside className="lg:col-span-4 xl:col-span-4 animate-blur-text" style={{ animationDelay: '0.4s' }}>
            <div className="panel-card p-6 h-full flex flex-col" style={{ maxHeight: 'calc(100vh - 140px)', position: 'sticky', top: '112px' }}>
              
              <div className="mb-5">
                <h2 className="font-headline text-lg font-bold mb-1" style={{ color: 'var(--theme-text-heading)' }}>
                  Module Curriculum
                </h2>
                <p className="text-xs font-body" style={{ color: 'var(--theme-text-muted)' }}>
                  {currentModule.module_title}
                </p>
              </div>

              {/* Prep Loading Banner */}
              {isPreparing && (
                <div className="flex items-center gap-3 text-xs font-label mb-5 px-4 py-3 rounded-xl" style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.2)' }}>
                  <div className="w-4 h-4 rounded-full border-2 border-indigo-400 border-t-transparent animate-spin shrink-0"></div>
                  <span style={{ color: '#818cf8', lineHeight: 1.4 }}>AI is structuring content...</span>
                </div>
              )}

              {/* Subtopic Playlist */}
              <div className="flex-1 overflow-y-auto custom-scroll pr-2 -mr-2 space-y-2 mb-6">
                {subtopics.map((sub, i) => (
                  <SubtopicListItem
                    key={sub._id || i}
                    subtopic={sub}
                    index={i}
                    isActive={i === activeSubIdx}
                    status={sub.status}
                    onClick={(idx) => setActiveSubIdx(idx)}
                  />
                ))}
              </div>

              {/* Quiz Trigger Container at Bottom */}
              <div className="pt-5" style={{ borderTop: '1px solid var(--theme-border)' }}>
                {!isPreparing && allQuizQuestions.length > 0 ? (
                  <div onClick={handleQuizClick} className="cursor-pointer">
                    <ShimmerButton
                      background="#312e81"
                      shimmerColor="rgba(255,255,255,0.4)"
                      shimmerSize="2em"
                      borderRadius="16px"
                      className="w-full py-4 font-label text-sm font-black uppercase tracking-widest flex items-center justify-center transition-all hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-2.5 text-white">
                        <span className="material-symbols-outlined text-[20px]">psychology</span>
                        Take Module Quiz
                      </div>
                    </ShimmerButton>
                  </div>
                ) : (
                  <button
                    disabled
                    className="w-full py-4 rounded-2xl font-label text-sm font-bold uppercase tracking-widest flex items-center justify-center gap-2 opacity-40 cursor-not-allowed"
                    style={{ background: 'var(--theme-glass-bg)', color: 'var(--theme-text-muted)', border: '1px solid var(--theme-border)' }}
                  >
                    <span className="material-symbols-outlined text-[20px]">psychology</span>
                    Quiz Unavailable
                  </button>
                )}
              </div>
              
            </div>
          </aside>

        </div>
      </div>
    </>
  );
}
