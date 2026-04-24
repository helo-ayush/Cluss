import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import MarkdownRenderer from '../components/MarkdownRenderer';
import SubtopicListItem from '../components/SubtopicListItem';
import TutorChatPanel from '../components/TutorChatPanel';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function QuizModal({ questions, initialResults, onSubmit, onClose }) {
  const [answers, setAnswers] = useState(
    initialResults ? initialResults.results.map((result) => result.selectedAnswer || null) : Array(questions.length).fill(null)
  );
  const [submitted, setSubmitted] = useState(Boolean(initialResults));
  const [results, setResults] = useState(initialResults || null);
  const [submitting, setSubmitting] = useState(false);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [hintsActive, setHintsActive] = useState({});
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (cooldown <= 0) return undefined;
    const timer = setInterval(() => setCooldown((value) => value - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const currentQuestion = questions[currentIdx] || { question: '', options: [] };
  const currentResult = submitted ? results?.results?.[currentIdx] : null;
  const answeredCount = answers.filter((answer) => answer !== null).length;

  const handleSelect = (questionIndex, option) => {
    if (submitted) return;
    const next = [...answers];
    next[questionIndex] = option;
    setAnswers(next);
  };

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    const data = await onSubmit(answers);
    setResults(data);
    setSubmitted(true);
    setSubmitting(false);
    setCurrentIdx(0);
  };

  const handleRetake = () => {
    setAnswers(Array(questions.length).fill(null));
    setSubmitted(false);
    setResults(null);
    setCurrentIdx(0);
    setHintsActive({});
    setCooldown(0);
  };

  const showHint = () => {
    if (submitted || cooldown > 0) return;
    setHintsActive((prev) => ({ ...prev, [currentIdx]: true }));
    setCooldown(60);
  };

  return (
    <div className="course-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-0 md:p-6" onClick={(event) => {
      if (event.target === event.currentTarget && !submitting) onClose();
    }}>
      <motion.div
        initial={{ opacity: 0, y: 24, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        className="course-modal-panel flex h-screen min-h-0 w-full max-w-6xl flex-col overflow-hidden md:h-[min(90vh,900px)] md:rounded-[2rem]"
      >
        <div className="flex min-h-0 flex-1 flex-col md:flex-row">
          <aside className="course-surface-soft flex min-h-0 shrink-0 flex-col overflow-hidden border-b border-black/5 md:w-[290px] md:border-b-0 md:border-r">
            <div className="px-5 pb-4 pt-5 md:px-6 md:pb-5 md:pt-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(15, 23, 42, 0.44)' }}>
                    Module Quiz
                  </p>
                  <h2 className="mt-2 font-serif text-2xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
                    {submitted ? (results?.passed ? 'Passed' : 'Review Mode') : 'Assessment'}
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-black/10 bg-white/70 transition hover:bg-white"
                >
                  <span className="material-symbols-outlined text-[18px]" style={{ color: 'var(--theme-text-muted)' }}>
                    close
                  </span>
                </button>
              </div>

              <div className="mt-5 grid gap-3">
                <div className="course-surface rounded-[1.4rem] px-4 py-4">
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                    Progress
                  </p>
                  <p className="mt-2 font-headline text-3xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
                    {submitted && results ? `${results.score}%` : `${answeredCount}/${questions.length}`}
                  </p>
                </div>
                <div className="course-surface rounded-[1.4rem] px-4 py-4">
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                    Status
                  </p>
                  <p className="mt-2 font-body text-sm font-semibold" style={{ color: submitted ? (results?.passed ? '#15803d' : '#b91c1c') : 'var(--theme-text-body-strong)' }}>
                    {submitted ? (results?.passed ? 'Quiz cleared' : 'Needs another attempt') : 'Answer every question and submit'}
                  </p>
                </div>
              </div>
            </div>

            <div
              className="modal-scroll min-h-0 flex-1 px-5 pb-5 md:px-6"
            >
              <div className="grid grid-cols-4 gap-2 md:grid-cols-3">
                {questions.map((_, index) => {
                  const active = currentIdx === index;
                  const answered = answers[index] !== null;
                  let background = 'rgba(255,255,255,0.68)';
                  let color = 'rgba(15, 23, 42, 0.42)';
                  let border = 'rgba(15, 23, 42, 0.08)';

                  if (submitted && results) {
                    const questionResult = results.results[index];
                    background = questionResult.correct ? 'rgba(21, 128, 61, 0.12)' : 'rgba(185, 28, 28, 0.12)';
                    color = questionResult.correct ? '#15803d' : '#b91c1c';
                    border = questionResult.correct ? 'rgba(21, 128, 61, 0.18)' : 'rgba(185, 28, 28, 0.18)';
                  } else if (answered) {
                    background = 'rgba(67, 56, 202, 0.12)';
                    color = '#4338ca';
                    border = 'rgba(67, 56, 202, 0.18)';
                  }

                  if (active) {
                    border = submitted ? border : 'rgba(17, 24, 39, 0.24)';
                  }

                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => setCurrentIdx(index)}
                      className="flex aspect-square items-center justify-center rounded-2xl border text-sm font-bold transition hover:-translate-y-[1px]"
                      style={{ background, color, borderColor: border }}
                    >
                      {index + 1}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="border-t border-black/5 px-5 py-5 md:px-6">
              {submitted ? (
                <button type="button" onClick={handleRetake} className="course-outline-button w-full justify-center">
                  <span className="material-symbols-outlined text-[18px]">replay</span>
                  Retake Quiz
                </button>
              ) : (
                <button type="button" onClick={handleSubmit} disabled={submitting} className="course-primary-button w-full justify-center">
                  {submitting ? (
                    <>
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Grading
                    </>
                  ) : (
                    <>
                      <span className="material-symbols-outlined text-[18px]">task_alt</span>
                      Submit Quiz
                    </>
                  )}
                </button>
              )}
            </div>
          </aside>

          <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden">
            <div className="shrink-0 border-b border-black/5 px-5 py-4 md:px-10">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <button
                  type="button"
                  onClick={() => setCurrentIdx((value) => Math.max(0, value - 1))}
                  disabled={currentIdx === 0}
                  className="course-outline-button disabled:opacity-40"
                >
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Back
                </button>

                <div className="course-stat-chip">
                  <span className="material-symbols-outlined text-[18px]" style={{ color: '#4338ca' }}>
                    help
                  </span>
                  Question {currentIdx + 1} / {questions.length}
                </div>

                <button
                  type="button"
                  onClick={() => setCurrentIdx((value) => Math.min(questions.length - 1, value + 1))}
                  disabled={currentIdx === questions.length - 1}
                  className="course-outline-button disabled:opacity-40"
                >
                  Next
                  <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
                </button>
              </div>
            </div>

            <div
              className="modal-scroll min-h-0 flex-1 px-5 py-6 md:px-10 md:py-8"
            >
              <div className="mx-auto max-w-3xl">
                <div className="course-surface rounded-[2rem] p-5 md:p-7">
                  <div className="flex flex-wrap items-start gap-4">
                    <div
                      className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                      style={{
                        background: submitted
                          ? currentResult?.correct
                            ? 'rgba(21, 128, 61, 0.12)'
                            : 'rgba(185, 28, 28, 0.12)'
                          : 'rgba(67, 56, 202, 0.12)',
                        color: submitted
                          ? currentResult?.correct
                            ? '#15803d'
                            : '#b91c1c'
                          : '#4338ca',
                      }}
                    >
                      <span className="font-label text-sm font-bold">
                        {submitted ? (currentResult?.correct ? 'OK' : 'NO') : String(currentIdx + 1).padStart(2, '0')}
                      </span>
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                        Question {currentIdx + 1}
                      </p>
                      <div className="mt-3 font-body text-lg font-semibold leading-8" style={{ color: 'var(--theme-text-heading)' }}>
                        <MarkdownRenderer content={currentQuestion.question} />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 space-y-3">
                  {currentQuestion.options.map((option, optionIndex) => {
                    const selected = answers[currentIdx] === option;
                    let background = 'rgba(255, 255, 255, 0.72)';
                    let border = 'rgba(15, 23, 42, 0.08)';
                    let color = 'var(--theme-text-body-strong)';
                    let icon = 'radio_button_unchecked';

                    if (submitted && currentResult) {
                      if (option === currentResult.correctAnswer) {
                        background = 'rgba(21, 128, 61, 0.1)';
                        border = 'rgba(21, 128, 61, 0.18)';
                        color = '#15803d';
                        icon = 'check_circle';
                      } else if (selected && !currentResult.correct) {
                        background = 'rgba(185, 28, 28, 0.1)';
                        border = 'rgba(185, 28, 28, 0.18)';
                        color = '#b91c1c';
                        icon = 'cancel';
                      }
                    } else if (selected) {
                      background = 'rgba(67, 56, 202, 0.1)';
                      border = 'rgba(67, 56, 202, 0.18)';
                      color = '#4338ca';
                      icon = 'check_circle';
                    }

                    return (
                      <button
                        key={optionIndex}
                        type="button"
                        onClick={() => handleSelect(currentIdx, option)}
                        disabled={submitted}
                        className="course-surface flex w-full items-start gap-4 rounded-[1.5rem] px-5 py-4 text-left transition hover:-translate-y-[1px] disabled:cursor-default"
                        style={{ background, borderColor: border, color }}
                      >
                        <span className="material-symbols-outlined mt-0.5 text-[20px]">{icon}</span>
                        <span className="flex-1 font-body text-sm leading-7 md:text-[15px]">{option}</span>
                      </button>
                    );
                  })}
                </div>

                {!submitted ? (
                  <div className="course-surface-soft mt-6 rounded-[1.6rem] p-5">
                    {!hintsActive[currentIdx] ? (
                      <button type="button" onClick={showHint} disabled={cooldown > 0} className="course-outline-button">
                        <span className="material-symbols-outlined text-[18px]">lightbulb</span>
                        {cooldown > 0 ? `Hint in ${cooldown}s` : 'Reveal Hint'}
                      </button>
                    ) : (
                      <>
                        <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#4338ca' }}>
                          Hint
                        </p>
                        <div className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                          <MarkdownRenderer content={currentQuestion.hint || 'Review the lesson carefully and focus on the exact idea used in the video.'} />
                        </div>
                      </>
                    )}
                  </div>
                ) : currentResult ? (
                  <div className="course-surface-soft mt-6 rounded-[1.6rem] p-5">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: '#4338ca' }}>
                      Explanation
                    </p>
                    <div className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                      <MarkdownRenderer content={currentResult.explanation} />
                    </div>
                  </div>
                ) : null}
              </div>
            </div>

          </section>
        </div>
      </motion.div>
    </div>
  );
}

function ConfirmModal({ onConfirm, onCancel }) {
  return (
    <div className="course-modal-backdrop fixed inset-0 z-[1000] flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.97 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.28, ease: 'easeOut' }}
        className="course-modal-panel w-full max-w-xl rounded-[2rem] p-6 md:p-8"
      >
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#eef2ff] text-[#4338ca]">
          <span className="material-symbols-outlined text-[30px]">psychology_alt</span>
        </div>
        <h3 className="mt-5 text-center font-serif text-3xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
          Jump to the quiz anyway?
        </h3>
        <p className="mt-4 text-center font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
          Some lessons are still unwatched. You can still attempt the quiz, but it will be much
          harder and you may miss key ideas.
        </p>
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <button type="button" onClick={onCancel} className="course-outline-button flex-1 justify-center">
            Go Back
          </button>
          <button type="button" onClick={onConfirm} className="course-primary-button flex-1 justify-center">
            Open Quiz
          </button>
        </div>
      </motion.div>
    </div>
  );
}

function LoadingState() {
  return (
    <div className="course-shell flex min-h-screen items-center justify-center px-6">
      <div className="course-surface flex flex-col items-center gap-4 rounded-[2rem] px-8 py-10 text-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-[#111827] border-t-transparent" />
        <p className="font-body text-sm" style={{ color: 'var(--theme-text-body)' }}>
          Opening your lesson room...
        </p>
      </div>
    </div>
  );
}

export default function LearnHub() {
  const { courseId, moduleIndex: modIdxStr } = useParams();
  const moduleIndex = parseInt(modIdxStr, 10);
  const { user, isLoaded } = useUser();

  const [usageData, setUsageData] = useState(null);
  const [isTutorOpen, setIsTutorOpen] = useState(false);
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSubIdx, setActiveSubIdx] = useState(0);
  const [markingComplete, setMarkingComplete] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [prepStatus, setPrepStatus] = useState(null);

  const prepTriggered = useRef(false);
  const fetchDone = useRef(false);

  const fetchCourse = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/${courseId}`);
      const data = await res.json();
      if (data.success) {
        setCourse(data.course);
        const currentModule = data.course.modules[moduleIndex];
        if (currentModule) {
          const status = currentModule.prepStatus || 'pending';
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
    setActiveSubIdx(0);
  }, [courseId, moduleIndex]);

  useEffect(() => {
    fetchCourse();
  }, [fetchCourse]);

  useEffect(() => {
    if (isLoaded && user) {
      fetch(`${API_BASE}/api/user/${user.id}/usage`)
        .then((res) => res.json())
        .then((data) => data.success && setUsageData(data))
        .catch((err) => console.error(err));
    }
  }, [isLoaded, user]);

  useEffect(() => {
    const modalOpen = showQuiz || showConfirm;
    if (!modalOpen) return undefined;
    if (typeof document === 'undefined') return undefined;

    const prevOverflow = document.body.style.overflow;
    const prevPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = 'hidden';

    // Avoid layout shift when the scrollbar disappears.
    const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }

    return () => {
      document.body.style.overflow = prevOverflow;
      document.body.style.paddingRight = prevPaddingRight;
    };
  }, [showQuiz, showConfirm]);

  useEffect(() => {
    if (!fetchDone.current || prepTriggered.current || prepStatus !== 'pending') return;
    prepTriggered.current = true;

    fetch(`${API_BASE}/api/course/${courseId}/module/${moduleIndex}/prepare`, { method: 'POST' })
      .then((res) => res.json())
      .then((data) => {
        if (data.success) setPrepStatus('preparing');
      })
      .catch((err) => console.error('Failed to trigger preparation:', err));
  }, [prepStatus, courseId, moduleIndex]);

  useEffect(() => {
    if (prepStatus !== 'preparing') return undefined;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/course/${courseId}/module/${moduleIndex}/prep-status`);
        const data = await res.json();
        if (data.success) {
          setPrepStatus(data.prepStatus);
          fetchCourse();
          if (data.prepStatus === 'ready' || data.prepStatus === 'failed') {
            clearInterval(interval);
          }
        }
      } catch (err) {
        console.error(err);
      }
    }, 3000);

    return () => clearInterval(interval);
  }, [prepStatus, courseId, moduleIndex, fetchCourse]);

  const currentModule = course?.modules?.[moduleIndex];
  const subtopics = currentModule?.subtopics || [];

  useEffect(() => {
    if (subtopics.length === 0) return;
    if (activeSubIdx >= subtopics.length) setActiveSubIdx(0);
  }, [activeSubIdx, subtopics.length]);

  const activeSubtopic = subtopics[activeSubIdx];
  const watchedCount = subtopics.filter((subtopic) => subtopic.status === 'completed').length;
  const allWatched = subtopics.length > 0 && watchedCount === subtopics.length;
  const allQuizQuestions = subtopics.flatMap((subtopic) => subtopic.quiz || []);
  const isPreparing = prepStatus === 'preparing' || prepStatus === 'pending';
  const hasTutorAccess = usageData ? usageData.plan === 'pro' || usageData.plan === 'ultra' : false;

  const moduleProgress = useMemo(() => {
    if (subtopics.length === 0) return 0;
    return Math.round((watchedCount / subtopics.length) * 100);
  }, [subtopics.length, watchedCount]);

  const handleMarkWatched = async () => {
    if (markingComplete || !activeSubtopic || activeSubtopic.status === 'completed') return;
    try {
      setMarkingComplete(true);
      await fetch(
        `${API_BASE}/api/course/${courseId}/module/${moduleIndex}/subtopic/${activeSubIdx}/watched`,
        { method: 'POST' }
      );
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
      return;
    }
    setShowConfirm(true);
  };

  const handleQuizSubmit = async (userAnswers) => {
    const res = await fetch(`${API_BASE}/api/course/${courseId}/module/${moduleIndex}/grade-module`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userAnswers }),
    });
    const data = await res.json();
    if (data.passed) {
      setTimeout(() => fetchCourse(), 500);
    }
    return data;
  };

  const handleQuizClose = () => {
    setShowQuiz(false);
    fetchCourse();
  };

  if (loading) {
    return <LoadingState />;
  }

  if (!currentModule) {
    return (
      <div className="course-shell flex min-h-screen items-center justify-center px-6">
        <div className="course-surface max-w-xl rounded-[2rem] px-8 py-10 text-center">
          <h1 className="font-serif text-4xl font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
            Module not found
          </h1>
          <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
            This lesson room does not exist anymore. Return to the course map and open another module.
          </p>
          <Link to={`/course/${courseId}`} className="course-primary-button mt-6">
            Back to Course Map
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="course-shell">
        {showConfirm && (
          <ConfirmModal
            onConfirm={() => {
              setShowConfirm(false);
              setShowQuiz(true);
            }}
            onCancel={() => setShowConfirm(false)}
          />
        )}

        {showQuiz && allQuizQuestions.length > 0 && (
          <QuizModal
            questions={allQuizQuestions}
            initialResults={currentModule.quizReport}
            onSubmit={handleQuizSubmit}
            onClose={handleQuizClose}
          />
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
                <Link to={`/course/${courseId}`} className="course-outline-button">
                  <span className="material-symbols-outlined text-[18px]">arrow_back</span>
                  Course Map
                </Link>
                <span className="course-kicker">
                  <span className="material-symbols-outlined text-[14px]">video_library</span>
                  Module {moduleIndex + 1}
                </span>
              </div>
              <div className="course-stat-chip">
                <span className="material-symbols-outlined text-[18px]" style={{ color: '#4338ca' }}>
                  stack_star
                </span>
                {watchedCount}/{subtopics.length} lessons completed
              </div>
            </div>

            <div className="mt-8 grid min-w-0 gap-8 lg:grid-cols-[1.4fr_0.9fr]">
              <div className="min-w-0">
                <p className="font-label text-[11px] font-bold uppercase tracking-[0.24em]" style={{ color: 'rgba(15, 23, 42, 0.44)' }}>
                  Active Lesson
                </p>
                <h1 className="mt-4 break-words font-serif text-[2.35rem] font-semibold leading-[1.02] sm:text-5xl md:text-6xl" style={{ color: 'var(--theme-text-heading)' }}>
                  {activeSubtopic?.subtopic_title || currentModule.module_title}
                </h1>
                <p className="mt-4 max-w-3xl font-body text-sm leading-7 md:text-[15px]" style={{ color: 'var(--theme-text-body)' }}>
                  Learn through the curated video, mark each lesson complete, then unlock the
                  next module by clearing the assessment at the end.
                </p>
              </div>

              <div className="course-surface-soft min-w-0 rounded-[1.75rem] p-5 md:rounded-[2rem] md:p-6">
                <p className="font-label text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: 'rgba(15, 23, 42, 0.44)' }}>
                  Module Status
                </p>
                <div className="mt-4 grid gap-3">
                  <div className="course-surface rounded-[1.35rem] px-4 py-4">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      Prep
                    </p>
                    <p className="mt-2 font-body text-sm font-semibold" style={{ color: isPreparing ? '#4338ca' : prepStatus === 'failed' ? '#b91c1c' : 'var(--theme-text-heading)' }}>
                      {isPreparing ? 'Curating videos and quizzes' : prepStatus === 'failed' ? 'Preparation failed' : 'Ready to study'}
                    </p>
                  </div>
                  <div className="course-surface rounded-[1.35rem] px-4 py-4">
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.18em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                        Progress
                      </p>
                      <span className="font-label text-xs font-bold" style={{ color: '#4338ca' }}>
                        {moduleProgress}%
                      </span>
                    </div>
                    <div className="mt-3 course-progress-track">
                      <motion.div
                        className="course-progress-fill"
                        initial={{ width: 0 }}
                        animate={{ width: `${moduleProgress}%` }}
                        transition={{ duration: 0.5, ease: 'easeOut' }}
                      />
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
                  {activeSubtopic?.videoId && activeSubtopic.videoId !== 'none' ? (
                    <div className="aspect-video overflow-hidden rounded-[1.2rem] bg-black md:rounded-[1.6rem]">
                      <iframe
                        className="h-full w-full"
                        src={`https://www.youtube.com/embed/${activeSubtopic.videoId}?rel=0&modestbranding=1&autohide=1&showinfo=0`}
                        title={activeSubtopic.subtopic_title}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : isPreparing ? (
                    <div className="flex aspect-video flex-col items-center justify-center rounded-[1.2rem] bg-[#f8fafc] px-5 text-center md:rounded-[1.6rem] md:px-6">
                      <div className="h-12 w-12 animate-spin rounded-full border-4 border-[#4338ca] border-t-transparent" />
                      <h2 className="mt-5 font-serif text-[2rem] font-semibold md:mt-6 md:text-3xl" style={{ color: 'var(--theme-text-heading)' }}>
                        Curating your lesson
                      </h2>
                      <p className="mt-3 max-w-md font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                        We are searching YouTube, checking transcripts, and preparing the quiz for this
                        exact subtopic.
                      </p>
                    </div>
                  ) : (
                    <div className="flex aspect-video flex-col items-center justify-center rounded-[1.2rem] bg-[#f8fafc] px-5 text-center md:rounded-[1.6rem] md:px-6">
                      <span className="material-symbols-outlined text-[56px]" style={{ color: 'rgba(15, 23, 42, 0.28)' }}>
                        videocam_off
                      </span>
                      <p className="mt-4 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                        No video was attached to this lesson.
                      </p>
                    </div>
                  )}
                </div>

                <div className="grid min-w-0 items-start gap-4 md:grid-cols-[1.1fr_0.9fr]">
                  <div className="course-surface min-w-0 rounded-[1.75rem] p-5 md:rounded-[2rem] md:p-6">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      Lesson Source
                    </p>
                    <div className="mt-4 flex items-start gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#eef2ff] text-[#4338ca]">
                        <span className="material-symbols-outlined text-[22px]">smart_display</span>
                      </div>
                      <div className="min-w-0">
                        <p className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
                          {activeSubtopic?.channelTitle || 'YouTube lesson'}
                        </p>
                        <p className="mt-2 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                          Watch the lesson, then mark it complete to keep the module progress moving.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="course-surface min-w-0 rounded-[1.75rem] p-5 md:rounded-[2rem] md:p-6">
                    <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                      Lesson Action
                    </p>
                    <div className="mt-4 flex flex-col gap-4">
                      {activeSubtopic?.status === 'completed' ? (
                        <div className="course-surface-soft flex items-center gap-3 rounded-[1.4rem] px-4 py-4">
                          <span className="material-symbols-outlined text-[22px]" style={{ color: '#15803d' }}>
                            check_circle
                          </span>
                          <div>
                            <p className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text-heading)' }}>
                              Lesson completed
                            </p>
                            <p className="font-body text-xs" style={{ color: 'var(--theme-text-body)' }}>
                              This lesson is already marked as watched.
                            </p>
                          </div>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={handleMarkWatched}
                          disabled={markingComplete || !activeSubtopic?.videoId || activeSubtopic.videoId === 'none'}
                          className="course-primary-button w-full justify-center disabled:opacity-40"
                        >
                          {markingComplete ? (
                            <>
                              <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                              Saving
                            </>
                          ) : (
                            <>
                              <span className="material-symbols-outlined text-[18px]">task_alt</span>
                              Mark as Watched
                            </>
                          )}
                        </button>
                      )}

                      <p className="font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                        Module quiz unlocks when the lessons are done, but you can still attempt it early.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside className="min-w-0 lg:col-span-4">
              <div className="space-y-6 lg:sticky lg:top-28">
                <div
                  id="learn-module-quiz"
                  className="course-surface min-w-0 scroll-mt-32 rounded-[1.75rem] p-5 md:rounded-[2.2rem] md:p-6"
                >
                  <div className="flex min-w-0 items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                        Lesson Rail
                      </p>
                      <h2 className="mt-2 break-words font-serif text-[1.8rem] font-semibold leading-tight md:text-2xl" style={{ color: 'var(--theme-text-heading)' }}>
                        {currentModule.module_title}
                      </h2>
                    </div>
                    <div className="shrink-0 rounded-full bg-[#eef2ff] px-3 py-2 text-[#4338ca]">
                      <span className="font-label text-[11px] font-bold uppercase tracking-[0.18em]">
                        {watchedCount}/{subtopics.length}
                      </span>
                    </div>
                  </div>

                  {isPreparing && (
                    <div className="course-surface-soft mt-5 flex items-center gap-3 rounded-[1.4rem] px-4 py-4">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-[#4338ca] border-t-transparent" />
                      <p className="font-body text-sm" style={{ color: '#4338ca' }}>
                        AI is still preparing some content for this module.
                      </p>
                    </div>
                  )}

                  <div className="mt-5 space-y-2.5">
                    {subtopics.map((subtopic, index) => (
                      <SubtopicListItem
                        key={subtopic._id || index}
                        subtopic={subtopic}
                        index={index}
                        isActive={index === activeSubIdx}
                        status={subtopic.status}
                        onClick={(clickedIndex) => setActiveSubIdx(clickedIndex)}
                      />
                    ))}
                  </div>
                </div>

                <div className="course-surface min-w-0 rounded-[1.75rem] p-5 md:rounded-[2.2rem] md:p-6">
                  <p className="font-label text-[10px] font-bold uppercase tracking-[0.22em]" style={{ color: 'rgba(15, 23, 42, 0.42)' }}>
                    Module Quiz
                  </p>
                  <h2 className="mt-2 font-serif text-[1.8rem] font-semibold leading-tight md:text-2xl" style={{ color: 'var(--theme-text-heading)' }}>
                    Finish strong
                  </h2>
                  <p className="mt-3 font-body text-sm leading-7" style={{ color: 'var(--theme-text-body)' }}>
                    Review what you learned in this module and pass the quiz to unlock the next one.
                  </p>

                  <div className="mt-5 course-progress-track">
                    <motion.div
                      className="course-progress-fill"
                      initial={{ width: 0 }}
                      animate={{ width: `${moduleProgress}%` }}
                      transition={{ duration: 0.5, ease: 'easeOut' }}
                    />
                  </div>
                  <p className="mt-3 font-label text-xs font-bold" style={{ color: '#4338ca' }}>
                    {moduleProgress}% lesson completion
                  </p>

                  <div className="mt-6">
                    {!isPreparing && allQuizQuestions.length > 0 ? (
                      <button type="button" onClick={handleQuizClick} className="course-primary-button w-full justify-center">
                        <span className="material-symbols-outlined text-[18px]">psychology</span>
                        {currentModule.quizReport ? 'Review Quiz Report' : 'Take Module Quiz'}
                      </button>
                    ) : (
                      <button type="button" disabled className="course-outline-button w-full justify-center opacity-50">
                        <span className="material-symbols-outlined text-[18px]">lock</span>
                        Quiz Unavailable
                      </button>
                    )}
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

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
      </div>

      <TutorChatPanel
        isOpen={isTutorOpen}
        onClose={() => setIsTutorOpen(false)}
        courseId={courseId}
        moduleIndex={moduleIndex}
        subtopicIndex={activeSubIdx}
        topicTitle={activeSubtopic?.subtopic_title}
        hasTutorAccess={hasTutorAccess}
      />
    </>
  );
}
