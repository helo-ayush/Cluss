import React, { useState, useEffect, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import SubtopicListItem from '../components/SubtopicListItem';
import { ShimmerButton } from '../components/magicui/ShimmerButton';
import TutorChatPanel from '../components/TutorChatPanel';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ─── Quiz Modal Component ───
// ─── Quiz Modal Component ───
function QuizModal({ questions, initialResults, onSubmit, onClose }) {
  const [answers, setAnswers] = useState(initialResults ? initialResults.results.map(r => r.selectedAnswer || null) : Array(questions.length).fill(null));
  const [submitted, setSubmitted] = useState(!!initialResults);
  const [results, setResults] = useState(initialResults || null);
  const [submitting, setSubmitting] = useState(false);
  
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hintsActive, setHintsActive] = useState({});
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    let timer;
    if (cooldown > 0) {
      timer = setInterval(() => setCooldown(c => c - 1), 1000);
    }
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleSelect = (qIdx, option) => {
    if (submitted) return;
    const newAnswers = [...answers];
    newAnswers[qIdx] = option;
    setAnswers(newAnswers);
  };

  const handleShowHint = () => {
    if (cooldown > 0 || submitted) return;
    setHintsActive(prev => ({ ...prev, [currentIdx]: true }));
    setCooldown(60);
  };

  const handleRetake = () => {
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
    setResults(null);
    setCurrentIdx(0);
    setHintsActive({});
    setCooldown(0);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const data = await onSubmit(answers);
    setResults(data);
    setSubmitted(true);
    setSubmitting(false);
    setCurrentIdx(0); // Go back to first question to review
  };

  const answeredCount = answers.filter(a => a !== null).length;
  const currentQ = questions[currentIdx];
  const currentResult = submitted ? results?.results?.[currentIdx] : null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-0 md:p-6"
      style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={(e) => { if (e.target === e.currentTarget && !submitting) onClose(); }}>

      <div className="relative liquid-glass md:rounded-2xl w-full h-full md:h-auto md:max-h-[85vh] max-w-5xl flex flex-col md:flex-row overflow-hidden"
        style={{ border: '1px solid var(--theme-border-strong)' }}>

        {/* ── Close Button (Absolute) ── */}
        <button onClick={onClose} className="absolute top-3 right-3 md:top-5 md:right-5 z-20 w-8 h-8 rounded-lg flex items-center justify-center cursor-pointer transition-all hover:bg-white/10"
          style={{ background: 'var(--theme-glass-bg)', border: '1px solid var(--theme-border)' }}>
          <span className="material-symbols-outlined text-sm" style={{ color: 'var(--theme-text-muted)' }}>close</span>
        </button>

        {/* ── Left Sidebar (Nav Grid) ── */}
        <div className="shrink-0 flex flex-col md:w-64 lg:w-72 border-b md:border-b-0 md:border-r" style={{ borderColor: 'var(--theme-border)', background: 'rgba(0,0,0,0.3)' }}>
          
          {/* Sidebar Header */}
          <div className="p-4 md:p-6 pb-3" style={{ borderBottom: '1px solid var(--theme-border)' }}>
            <h2 className="font-headline text-lg md:text-xl font-bold italic truncate pr-8" style={{ color: 'var(--theme-text-heading)' }}>
              {submitted ? (results?.passed ? '🎉 Complete!' : '📚 Review') : '🧠 Module Quiz'}
            </h2>
            <div className="mt-2 flex items-center justify-between">
              <span className="text-xs font-label" style={{ color: 'var(--theme-text-muted)' }}>
                {submitted ? 'Review Mode' : `${answeredCount}/${questions.length} Answered`}
              </span>
              {submitted && results && (
                <span className={`font-label text-xs font-bold ${results.passed ? 'text-emerald-400' : 'text-red-400'}`}>
                   Score: {results.score}%
                </span>
              )}
            </div>
          </div>

          {/* Questions Grid */}
          <div className="p-4 md:p-6 flex-1 overflow-x-auto md:overflow-y-auto custom-scroll flex flex-row md:flex-col" style={{ WebkitOverflowScrolling: 'touch' }}>
            <div className="flex flex-row md:grid md:grid-cols-5 gap-2 md:gap-2.5 w-max md:w-full">
              {questions.map((_, i) => {
                const isActive = i === currentIdx;
                const isAnswered = answers[i] !== null;
                let bg = 'var(--theme-glass-bg)';
                let border = 'var(--theme-border)';
                let text = 'var(--theme-text-faint)';

                if (submitted && results) {
                  const res = results.results[i];
                  if (res.correct) { bg = 'rgba(34,197,94,0.15)'; border = 'rgba(34,197,94,0.4)'; text = '#22c55e'; }
                  else { bg = 'rgba(239,68,68,0.15)'; border = 'rgba(239,68,68,0.4)'; text = '#ef4444'; }
                } else if (isAnswered) {
                  bg = 'rgba(139,92,246,0.15)'; border = 'rgba(139,92,246,0.4)'; text = '#8b5cf6';
                }
                
                if (isActive && !submitted) {
                  border = '#8b5cf6';
                } else if (isActive && submitted) {
                  border = 'var(--theme-text-heading)';
                }

                return (
                  <button key={i} onClick={() => setCurrentIdx(i)}
                    className="shrink-0 w-10 h-10 md:w-full md:aspect-square rounded-lg flex items-center justify-center text-xs font-label font-bold transition-all hover:scale-105 cursor-pointer"
                    style={{ background: bg, border: `1.5px solid ${border}`, color: text }}>
                    {i + 1}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Sidebar Footer (Persistent Submit/Retake) */}
          <div className="p-4 md:p-6" style={{ borderTop: '1px solid var(--theme-border)', background: 'var(--theme-glass-bg)' }}>
            {submitted ? (
               <button onClick={handleRetake} className="w-full py-3.5 rounded-xl font-label text-sm font-bold transition-all hover:bg-white/5 cursor-pointer" style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}>
                 Retake Quiz
               </button>
            ) : (
               <button onClick={handleSubmit} disabled={submitting}
                 className="w-full py-3.5 rounded-xl font-label text-sm font-bold transition-all disabled:opacity-50 forge-btn-primary text-on-primary flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                 {submitting ? (<><div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin"></div> Grading...</>) : 'Submit Quiz'}
               </button>
            )}
          </div>
        </div>

        {/* ── Right Panel (Question View) ── */}
        <div className="flex-1 flex flex-col min-w-0 bg-[rgba(0,0,0,0.1)]">
          
          <div className="flex-1 overflow-y-auto p-5 md:p-10 custom-scroll relative">
            <div className="animate-blur-text max-w-3xl mx-auto" key={`q-${currentIdx}`}>
              
              {/* Question Text */}
              <div className="flex flex-col md:flex-row md:items-start gap-4 mb-6 md:mb-8 mt-2 md:mt-0">
                <span className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center font-label text-sm font-bold self-start"
                  style={{
                    background: submitted ? (currentResult?.correct ? 'rgba(34,197,94,0.15)' : 'rgba(239,68,68,0.15)') : 'rgba(139,92,246,0.15)',
                    border: `1px solid ${submitted ? (currentResult?.correct ? 'rgba(34,197,94,0.4)' : 'rgba(239,68,68,0.4)') : 'rgba(139,92,246,0.4)'}`,
                    color: submitted ? (currentResult?.correct ? '#22c55e' : '#ef4444') : '#8b5cf6'
                  }}>
                  {submitted ? (currentResult?.correct ? '✓' : '✗') : currentIdx + 1}
                </span>
                <p className="font-body text-lg md:text-xl font-semibold leading-relaxed pt-1" style={{ color: 'var(--theme-text-heading)' }}>
                  {currentQ.question}
                </p>
              </div>

              {/* Options */}
              <div className="space-y-3 md:ml-13">
                {currentQ.options.map((opt, oIdx) => {
                  const isSelected = answers[currentIdx] === opt;
                  let optBg = 'var(--theme-glass-bg)';
                  let optBorder = 'var(--theme-border)';
                  let optColor = 'var(--theme-text-body)';
                  let optIcon = '';

                  if (submitted && currentResult) {
                    if (opt === currentResult.correctAnswer) { optBg = 'rgba(34,197,94,0.08)'; optBorder = 'rgba(34,197,94,0.4)'; optColor = '#22c55e'; optIcon = 'check_circle'; }
                    else if (isSelected && !currentResult.correct) { optBg = 'rgba(239,68,68,0.08)'; optBorder = 'rgba(239,68,68,0.4)'; optColor = '#ef4444'; optIcon = 'cancel'; }
                  } else if (isSelected) { optBg = 'rgba(139,92,246,0.08)'; optBorder = 'rgba(139,92,246,0.5)'; optColor = '#a78bfa'; }

                  return (
                    <button key={oIdx} onClick={() => handleSelect(currentIdx, opt)} disabled={submitted}
                      className="w-full text-left px-5 py-4 rounded-xl text-sm md:text-base font-body transition-all cursor-pointer disabled:cursor-default flex items-start gap-4 hover:border-indigo-500/30 group"
                      style={{ background: optBg, border: `1px solid ${optBorder}`, color: optColor }}>
                      <div className="shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-xs mt-0.5"
                        style={{ border: `1.5px solid ${isSelected || (submitted && opt === currentResult?.correctAnswer) ? optColor : 'var(--theme-border)'}`, background: isSelected ? optColor : 'transparent', color: isSelected ? 'white' : 'transparent' }}>
                        {isSelected && !submitted && '•'}
                      </div>
                      <span className="flex-1 leading-relaxed">{opt}</span>
                      {optIcon && <span className="material-symbols-outlined text-xl shrink-0 mt-0.5" style={{ color: optColor }}>{optIcon}</span>}
                    </button>
                  );
                })}
              </div>

              {/* Hint / Explanation Section (Bottom) */}
              {!submitted ? (
                <div className="mt-8 md:ml-13">
                  {!hintsActive[currentIdx] ? (
                    <button 
                      onClick={handleShowHint}
                      disabled={cooldown > 0}
                      className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-label font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer w-full md:w-max justify-center md:justify-start"
                      style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)', color: '#818cf8' }}
                    >
                      <span className="material-symbols-outlined text-base">lightbulb</span>
                      {cooldown > 0 ? `Hint Available in ${cooldown}s` : 'Reveal Hint (60s cooldown)'}
                    </button>
                  ) : (
                    <div className="px-5 py-5 rounded-xl text-sm font-body leading-relaxed" 
                      style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.2)', color: 'var(--theme-text-body)' }}>
                      <span className="font-bold flex items-center gap-2 mb-3 text-base" style={{ color: '#818cf8' }}>
                        <span className="material-symbols-outlined text-sm">lightbulb</span>
                        Hint
                      </span>
                      {currentQ.hint || "Review the exact concepts learned in the video for clues."}
                    </div>
                  )}
                </div>
              ) : (
                currentResult && (
                  <div className="mt-8 md:ml-13 px-5 py-5 rounded-xl text-sm font-body leading-relaxed" 
                    style={{ background: 'rgba(139,92,246,0.05)', border: '1px solid rgba(139,92,246,0.2)', color: 'var(--theme-text-body)' }}>
                    <span className="font-bold flex items-center gap-2 mb-3 text-base" style={{ color: '#a78bfa' }}>
                      <span className="material-symbols-outlined text-sm">lightbulb</span>
                      Explanation
                    </span>
                    {currentResult.explanation}
                  </div>
                )
              )}
            </div>
          </div>

          {/* ── Footer Navigation (Next/Back) ── */}
          <div className="shrink-0 p-5 md:p-6 flex items-center justify-between gap-4 border-t" style={{ borderColor: 'var(--theme-border)', background: 'rgba(0,0,0,0.2)' }}>
            <button 
              onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
              disabled={currentIdx === 0}
              className="px-5 md:px-6 py-3 rounded-xl font-label text-sm font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-white/5"
              style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}>
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              <span className="hidden sm:inline">Previous</span>
            </button>
            
            {submitted && currentIdx === questions.length - 1 && (
               <button onClick={onClose} className="px-6 md:px-8 py-3 rounded-xl font-label text-sm font-bold transition-all cursor-pointer forge-btn-primary text-on-primary shadow-[0_0_20px_rgba(34,197,94,0.2)]">
                 {results?.passed ? 'Continue Course →' : 'Close Review'}
               </button>
            )}

            <button 
              onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
              disabled={currentIdx === questions.length - 1}
              className="px-5 md:px-6 py-3 rounded-xl font-label text-sm font-bold transition-all cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed flex items-center gap-2 hover:bg-white/5"
              style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}>
              <span className="hidden sm:inline">Next</span>
              <span className="material-symbols-outlined text-sm">arrow_forward</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
}

// ─── Confirmation Modal ───
function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(8px)' }}>
      <div className="relative group max-w-md w-full">
        {/* Glow effect */}
        <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/20 to-purple-600/20 rounded-3xl blur opacity-75 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
        <div className="relative liquid-glass rounded-2xl p-8 w-full text-center" style={{ border: '1px solid rgba(99,102,241,0.2)' }}>
          <div className="w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(99,102,241,0.2)]" style={{ background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.3)' }}>
            <span className="material-symbols-outlined text-4xl" style={{ color: '#818cf8' }}>psychology_alt</span>
          </div>
          <h3 className="font-headline text-2xl font-bold italic mb-3" style={{ color: 'var(--theme-text-heading)' }}>
            Incomplete Module
          </h3>
          <p className="text-sm md:text-base leading-relaxed mb-8" style={{ color: 'var(--theme-text-body)' }}>
            You haven't completed all the video lectures in this module. Forging ahead now will be significantly harder. Are you sure you want to proceed to the quiz?
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <button onClick={onCancel}
              className="flex-1 py-3.5 rounded-xl font-label text-sm font-bold cursor-pointer transition-all hover:bg-white/5"
              style={{ background: 'var(--theme-glass-bg)', border: '1px solid var(--theme-border)', color: 'var(--theme-text-body)' }}
            >Go Back</button>
            <button onClick={onConfirm}
              className="flex-1 py-3.5 rounded-xl font-label text-sm font-bold cursor-pointer transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] hover:scale-[1.02] forge-btn-primary text-on-primary"
            >Take Quiz Anyway</button>
          </div>
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
  const { user, isLoaded } = useUser();

  const [usageData, setUsageData] = useState(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);

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

  useEffect(() => {
    if (isLoaded && user) {
      fetch(`${API_BASE}/api/user/${user.id}/usage`)
        .then(res => res.json())
        .then(data => data.success && setUsageData(data))
        .catch(err => console.error(err));
    }
  }, [isLoaded, user]);

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
          initialResults={currentModule?.quizReport}
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
                  <div onClick={handleQuizClick} className="cursor-pointer group relative">
                    <div className="absolute -inset-1 bg-gradient-to-r from-indigo-500/30 to-purple-600/30 rounded-2xl blur opacity-50 group-hover:opacity-100 transition duration-500"></div>
                    <ShimmerButton
                      background="linear-gradient(135deg, #312e81, #4c1d95)"
                      shimmerColor="rgba(255,255,255,0.4)"
                      shimmerSize="2.5em"
                      borderRadius="16px"
                      className="w-full relative py-4 font-label text-sm font-black uppercase tracking-widest flex items-center justify-center transition-all group-hover:scale-[1.02] active:scale-[0.98]"
                    >
                      <div className="flex items-center gap-3 text-white">
                        <span className="material-symbols-outlined text-[20px] shadow-sm">psychology</span>
                        {currentModule?.quizReport ? 'Review Quiz Report' : 'Take Module Quiz'}
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

      {/* Floating AI Tutor Button */}
      <button
        onClick={() => setIsTutorOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 rounded-full flex items-center justify-center shadow-[0_8px_32px_rgba(99,102,241,0.4)] hover:scale-110 active:scale-95 transition-all"
        style={{ background: 'linear-gradient(135deg, #4f46e5, #6366f1)', border: '1px solid rgba(255,255,255,0.2)' }}
      >
        <span className="material-symbols-outlined text-white text-2xl">smart_toy</span>
        {!usageData || usageData.plan !== 'pro' ? (
           <span className="absolute -top-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center border-2 border-background">
             <span className="material-symbols-outlined text-[10px] text-white">lock</span>
           </span>
        ) : null}
      </button>

      <TutorChatPanel
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        courseId={courseId}
        moduleIndex={moduleIndex}
        subtopicIndex={activeSubIdx}
        topicTitle={activeSubtopic?.subtopic_title}
        isPro={usageData?.plan === 'pro'}
      />
    </>
  );
}
