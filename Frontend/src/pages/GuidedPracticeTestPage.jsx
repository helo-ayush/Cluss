import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, ArrowRight, CheckCircle2, XCircle, AlertTriangle,
  Clock, Send, Image as ImageIcon, X, ChevronRight, ChevronLeft,
  Loader2, CheckSquare, Zap, BookOpen, RotateCcw
} from 'lucide-react';
import { useUsage } from '../contexts/UsageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

// ── Image resize to max 768px using canvas ──────────────────────────────────
async function resizeImageToBase64(file, maxPx = 768) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const { width, height } = img;
      const scale = Math.min(1, maxPx / Math.max(width, height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.round(width * scale);
      canvas.height = Math.round(height * scale);
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      const base64 = canvas.toDataURL('image/jpeg', 0.85).split(',')[1];
      resolve(base64);
    };
    img.onerror = reject;
    img.src = url;
  });
}

// ── Flatten bundle into a single questions array ─────────────────────────────
function flattenQuestions(bundle) {
  if (!bundle) return [];
  return [
    ...(bundle.mcqs || []).map((q, i) => ({ ...q, type: 'mcq', _bundleKey: 'mcqs', _bundleIndex: i, imageUpload: false })),
    ...(bundle.written || []).map((q, i) => ({ ...q, type: 'written', question: q.question, _bundleKey: 'written', _bundleIndex: i, imageUpload: q.image_upload !== false })),
    ...(bundle.math || []).map((q, i) => ({ ...q, type: 'math', question: q.question, _bundleKey: 'math', _bundleIndex: i, imageUpload: q.image_upload !== false })),
    ...(bundle.code || []).map((q, i) => ({ ...q, type: 'code', question: q.prompt, _bundleKey: 'code', _bundleIndex: i, imageUpload: false })),
  ];
}

// ── Timer display ─────────────────────────────────────────────────────────────
function formatTime(seconds) {
  if (seconds <= 0) return '0:00';
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

// ── Question number grid ──────────────────────────────────────────────────────
function QuestionGrid({ questions, currentIndex, markedAnswers, visitedSet, onSelect }) {
  return (
    <div className="flex flex-wrap gap-2 p-4">
      {questions.map((_, i) => {
        const isActive = i === currentIndex;
        const isMarked = markedAnswers[i] !== undefined;
        const isVisited = visitedSet.has(i);
        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`relative h-10 w-10 rounded-xl text-xs font-bold transition-all duration-200 ${
              isActive
                ? 'ring-2 ring-[#efff55] ring-offset-1 ring-offset-[#0f0f0f] bg-[#efff55] text-black scale-105'
                : isMarked
                ? 'bg-emerald-500/20 border border-emerald-500/40 text-emerald-400'
                : isVisited
                ? 'bg-white/[0.06] border border-white/[0.10] text-zinc-400'
                : 'bg-white/[0.02] border border-white/[0.06] text-zinc-600 hover:border-white/20 hover:text-zinc-400'
            }`}
          >
            {i + 1}
            {isMarked && !isActive && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-emerald-400 border border-[#0f0f0f]" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── MCQ question ──────────────────────────────────────────────────────────────
function MCQQuestion({ question, value, onChange }) {
  return (
    <div className="space-y-3">
      {(question.options || []).map((opt, i) => {
        const letter = ['A', 'B', 'C', 'D'][i];
        const isSelected = value === opt;
        return (
          <button
            key={i}
            onClick={() => onChange(opt)}
            className={`w-full flex items-start gap-3 rounded-[1.2rem] border px-5 py-4 text-left text-sm font-medium transition-all duration-200 ${
              isSelected
                ? 'border-[#efff55]/50 bg-[#efff55]/10 text-white'
                : 'border-white/[0.06] bg-white/[0.02] text-zinc-300 hover:border-white/20 hover:bg-white/[0.04] hover:text-white'
            }`}
          >
            <span className={`flex-shrink-0 flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold transition-all ${
              isSelected ? 'bg-[#efff55] text-black' : 'bg-white/[0.06] text-zinc-500'
            }`}>{letter}</span>
            <span className="flex-1 leading-relaxed">{opt}</span>
          </button>
        );
      })}
    </div>
  );
}

// ── Written / Math question ───────────────────────────────────────────────────
function WrittenQuestion({ question, value, onChange, imageFile, onImageUpload, canUploadImage, isPro, isDev }) {
  const fileRef = useRef(null);
  const allowedToUpload = isPro || isDev;
  return (
    <div className="space-y-4">
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder="Type your answer here... or upload a handwritten image below."
        rows={6}
        className="w-full resize-none rounded-[1.2rem] border border-white/[0.06] bg-white/[0.01] px-5 py-4 text-sm text-white placeholder:text-white/20 outline-none focus:border-[#efff55]/30 focus:bg-white/[0.03] transition duration-300 leading-relaxed shadow-inner"
      />
      {canUploadImage && (
        <div className="relative">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onImageUpload(e.target.files[0])} />
          {imageFile ? (
            <div className="flex items-center gap-3 rounded-[1rem] border border-emerald-500/25 bg-emerald-500/5 px-4 py-3.5 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300 flex-1 truncate font-medium">{imageFile.name}</span>
              <button onClick={() => onImageUpload(null)} className="text-zinc-500 hover:text-white transition-colors"><X className="h-3.5 w-3.5" /></button>
            </div>
          ) : allowedToUpload ? (
            <button onClick={() => fileRef.current?.click()}
              className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-3.5 text-xs font-bold text-zinc-400 hover:border-[#efff55]/40 hover:text-[#efff55] hover:bg-[#efff55]/5 transition duration-300">
              <ImageIcon className="h-4 w-4 text-zinc-500" />
              Upload handwritten answer (recommended: solve on a single clean page) {isDev && !isPro && <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ml-2">Dev Unlocked</span>}
            </button>
          ) : (
            <div className="flex w-full items-center justify-center gap-2.5 rounded-[1rem] border border-dashed border-white/[0.06] bg-white/[0.01] px-4 py-4 text-xs font-bold text-zinc-500">
              <ImageIcon className="h-4 w-4 text-zinc-600" />
              Handwritten image upload <span className="rounded-full bg-[#efff55]/10 border border-[#efff55]/20 px-2 py-0.5 text-[9px] font-extrabold uppercase tracking-wider text-[#efff55]">PRO ONLY</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Code question ─────────────────────────────────────────────────────────────
function CodeQuestion({ question, value, onChange }) {
  return (
    <div className="space-y-3">
      {question.starterCode && (
        <div className="rounded-[1rem] border border-white/[0.06] bg-[#0d0d0d] p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Starter Code</p>
          <pre className="text-xs text-zinc-300 font-mono leading-relaxed whitespace-pre-wrap">{question.starterCode}</pre>
        </div>
      )}
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        placeholder={`Write your ${question.language || 'code'} solution here...`}
        rows={10}
        spellCheck={false}
        className="w-full resize-none rounded-[1.2rem] border border-white/[0.06] bg-[#0d0d0d] px-5 py-4 font-mono text-sm text-emerald-300 placeholder:text-white/20 outline-none focus:border-[#efff55]/30 transition leading-relaxed"
      />
    </div>
  );
}

// ── Result card per question ──────────────────────────────────────────────────
function ResultQuestionCard({ question, index, markedAnswer, explanation, imageEvalResult }) {
  const [open, setOpen] = useState(index < 3);
  const isCorrect = question.type === 'mcq'
    ? markedAnswer?.value === question.correctAnswer
    : explanation?.correct;

  return (
    <div className={`rounded-[1.4rem] border transition-all ${
      isCorrect ? 'border-emerald-500/20 bg-emerald-500/5' : 'border-rose-500/20 bg-rose-500/5'
    }`}>
      <button
        className="flex w-full items-start gap-3 px-5 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isCorrect ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'
        }`}>
          {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[10px] font-bold uppercase tracking-widest ${
              isCorrect ? 'text-emerald-500' : 'text-rose-500'
            }`}>Q{index + 1} · {question.type.toUpperCase()}</span>
          </div>
          <p className="text-sm text-white font-medium leading-snug line-clamp-2">{question.question}</p>
        </div>
        <ChevronRight className={`h-4 w-4 text-zinc-500 shrink-0 transition-transform ${open ? 'rotate-90' : ''}`} />
      </button>

      {open && (
        <div className="border-t border-white/[0.05] px-5 pb-5 pt-4 space-y-4">
          {/* Your answer */}
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5">Your Answer</p>
            <p className="text-sm text-zinc-300 leading-relaxed">
              {markedAnswer?.value || <span className="italic text-zinc-600">Not answered</span>}
            </p>
            {imageEvalResult && (
              <div className={`mt-2 rounded-xl border px-3 py-2 text-xs ${
                imageEvalResult.isReadable ? 'border-blue-500/20 bg-blue-500/10 text-blue-300' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'
              }`}>
                {imageEvalResult.isReadable
                  ? `📷 Image read: "${imageEvalResult.extractedText?.slice(0, 120)}..."`
                  : `⚠️ ${imageEvalResult.evaluationNote || 'Image could not be read.'}`}
              </div>
            )}
          </div>

          {/* Correct answer for MCQ */}
          {question.type === 'mcq' && (
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5">Correct Answer</p>
              <p className="text-sm text-emerald-300 font-medium">{question.correctAnswer}</p>
            </div>
          )}

          {/* AI explanation */}
          {explanation && (
            <div className="space-y-2.5">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-widest text-zinc-600 mb-1.5">Explanation</p>
                <p className="text-sm text-zinc-300 leading-relaxed">{explanation.explanation}</p>
              </div>
              {explanation.whatWentWell && (
                <div className="flex gap-2 rounded-xl bg-emerald-500/10 border border-emerald-500/20 px-3 py-2">
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
                  <p className="text-xs text-emerald-300">{explanation.whatWentWell}</p>
                </div>
              )}
              {explanation.improvementTip && (
                <div className="flex gap-2 rounded-xl bg-[#efff55]/10 border border-[#efff55]/20 px-3 py-2">
                  <Zap className="h-3.5 w-3.5 text-[#efff55] shrink-0 mt-0.5" />
                  <p className="text-xs text-[#efff55]/90">{explanation.improvementTip}</p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────
export default function GuidedPracticeTestPage() {
  const { courseId, moduleIndex = 0, subtopicIndex = 0 } = useParams();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useUser();

  const practiceIndex = parseInt(searchParams.get('pi') || '0', 10);
  const timeLimitMins = parseInt(searchParams.get('tl') || '15', 10);
  const initialSeconds = timeLimitMins > 0 ? timeLimitMins * 60 : null; // null = no limit

  // Data
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Test state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [markedAnswers, setMarkedAnswers] = useState({}); // { [qIndex]: { value, imageBase64 } }
  const [liveAnswers, setLiveAnswers] = useState({}); // unstaged answers
  const [liveImages, setLiveImages] = useState({}); // { [qIndex]: File }
  const [visitedSet, setVisitedSet] = useState(new Set([0]));
  const [timeRemaining, setTimeRemaining] = useState(initialSeconds);
  const [timerActive, setTimerActive] = useState(true);

  // Modals
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);

  // Submit/result
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [results, setResults] = useState(null); // { feedback, perQuestionFeedback, imageEvalResults }

  const { usageData } = useUsage();
  const plan = usageData?.plan || 'free';
  const isPro = plan !== 'free';
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';

  // Fetch the course + practice bundle
  useEffect(() => {
    if (!user?.id) return;
    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/study-plans/${courseId}?clerkId=${user.id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Could not load course.');
        setCourse(data.course);
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, user?.id]);

  const module = course?.modules?.[Number(moduleIndex)];
  const subtopic = module?.subtopics?.[Number(subtopicIndex)];
  const practice = subtopic?.practices?.[practiceIndex];
  const questions = useMemo(() => flattenQuestions(practice?.bundle), [practice]);
  const subtopicRef = `${moduleIndex}:${subtopicIndex}`;

  // ── Timer ──
  useEffect(() => {
    if (initialSeconds === null || !timerActive || submitted) return;
    if (timeRemaining <= 0) {
      handleSubmit(true); // auto-submit
      return;
    }
    const id = setInterval(() => setTimeRemaining(t => t - 1), 1000);
    return () => clearInterval(id);
  }, [timeRemaining, timerActive, submitted, initialSeconds]);

  // ── Navigate to question ──
  const goTo = useCallback((i) => {
    setCurrentIndex(i);
    setVisitedSet(prev => new Set([...prev, i]));
  }, []);

  const goNext = () => currentIndex < questions.length - 1 && goTo(currentIndex + 1);
  const goPrev = () => currentIndex > 0 && goTo(currentIndex - 1);

  // ── Mark answer ──
  const markAnswer = useCallback(async () => {
    const liveVal = liveAnswers[currentIndex];
    const liveImg = liveImages[currentIndex];
    let imageBase64 = null;
    if (liveImg) {
      try { imageBase64 = await resizeImageToBase64(liveImg); } catch (_) {}
    }
    setMarkedAnswers(prev => ({
      ...prev,
      [currentIndex]: { value: liveVal || '', imageBase64 }
    }));
  }, [currentIndex, liveAnswers, liveImages]);

  // ── Submit ──
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    setSubmitting(true);
    setSubmitError('');
    setTimerActive(false);
    setShowSubmitModal(false);

    try {
      // Build submission object
      const mcqAnswers = {};
      const writtenAnswers = {};
      const codeAnswers = {};
      const imageAnswers = {};

      questions.forEach((q, i) => {
        const ans = markedAnswers[i];
        if (!ans) return;
        if (q.type === 'mcq') mcqAnswers[i] = ans.value;
        else if (q.type === 'written' || q.type === 'math') writtenAnswers[i] = ans.value;
        else if (q.type === 'code') codeAnswers[i] = ans.value;
        if (ans.imageBase64) imageAnswers[i] = ans.imageBase64;
      });

      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${subtopicRef}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          submission: { mcqAnswers, writtenAnswers, codeAnswers },
          imageAnswers,
          practiceIndex,
          confidence: 'auto',
          studentNotes: ''
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Submission failed.');

      setResults({
        feedback: data.feedback,
        perQuestionFeedback: data.perQuestionFeedback || [],
        imageEvalResults: data.imageEvalResults || {}
      });
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message);
      setTimerActive(true);
    } finally {
      setSubmitting(false);
    }
  }, [courseId, subtopicRef, practiceIndex, questions, markedAnswers]);

  const attemptedCount = Object.keys(markedAnswers).length;
  const isTimeLow = initialSeconds !== null && timeRemaining !== null && timeRemaining <= 60;
  const isCurrentMarked = markedAnswers[currentIndex] !== undefined;
  const currentQ = questions[currentIndex];

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0f0f0f]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-[#efff55]" />
          <p className="text-sm text-zinc-500">Loading your test...</p>
        </div>
      </div>
    );
  }

  if (loadError || !practice || questions.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-4 bg-[#0f0f0f] px-4 text-center">
        <AlertTriangle className="h-10 w-10 text-rose-400" />
        <p className="text-white font-semibold">{loadError || 'Practice test not found.'}</p>
        <button onClick={() => navigate(-1)} className="rounded-full border border-white/[0.06] bg-white/[0.04] px-6 py-2.5 text-sm text-zinc-300 hover:text-white transition">
          Go Back
        </button>
      </div>
    );
  }

  // ── RESULTS VIEW ──
  if (submitted && results) {
    const { feedback, perQuestionFeedback, imageEvalResults } = results;
    const score = feedback?.score ?? 0;
    const passed = feedback?.passed;
    const scoreColor = score >= 70 ? '#4ade80' : score >= 50 ? '#fbbf24' : '#f87171';

    return (
      <div className="min-h-screen bg-[#0f0f0f]" style={{ fontFamily: "'Inter', sans-serif" }}>
        {/* Results nav */}
        <header className="sticky top-0 z-50 flex h-16 items-center justify-between border-b border-white/[0.06] bg-[#0f0f0f]/95 px-6 backdrop-blur">
          <div className="flex items-center gap-3">
            <div className={`h-2.5 w-2.5 rounded-full`} style={{ background: scoreColor }} />
            <span className="text-sm font-semibold text-white">Test Results</span>
          </div>
          <button
            onClick={() => navigate(`/dashboard/guided/study-plan/${courseId}/learn/${moduleIndex}/${subtopicIndex}`)}
            className="flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white transition"
          >
            <BookOpen className="h-3.5 w-3.5" />
            Back to Lesson
          </button>
        </header>

        <div className="mx-auto max-w-3xl px-4 py-10">
          {/* Score banner */}
          <div className="mb-8 rounded-[2rem] border border-white/[0.06] bg-[#141414] p-8 text-center">
            <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-zinc-500 mb-3">Your Score</p>
            <div className="text-7xl font-black mb-2" style={{ color: scoreColor }}>{score}<span className="text-3xl text-zinc-500">/100</span></div>
            <p className={`text-lg font-bold mb-2 ${passed ? 'text-emerald-400' : 'text-rose-400'}`}>
              {passed ? '🎉 Passed!' : '📚 Keep going!'}
            </p>
            <p className="text-sm text-zinc-500 max-w-md mx-auto leading-relaxed">{feedback?.summary}</p>
            <div className="mt-4 flex items-center justify-center gap-4 text-xs text-zinc-600">
              <span>{attemptedCount}/{questions.length} answered</span>
              <span>·</span>
              <span>{timeLimitMins > 0 ? `${timeLimitMins} min test` : 'Untimed'}</span>
            </div>
          </div>

          {/* Overall coaching */}
          {feedback?.coaching && (
            <div className="mb-6 rounded-[1.4rem] border border-[#efff55]/20 bg-[#efff55]/5 p-5">
              <p className="text-[10px] font-bold uppercase tracking-widest text-[#efff55] mb-2">Overall Coaching</p>
              <div className="text-sm text-zinc-300 leading-relaxed">
                <MarkdownRenderer content={feedback.coaching} />
              </div>
            </div>
          )}

          {/* Per-question breakdown */}
          <div className="space-y-3">
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-600 mb-3">Question Breakdown</p>
            {questions.map((q, i) => (
              <ResultQuestionCard
                key={i}
                question={q}
                index={i}
                markedAnswer={markedAnswers[i]}
                explanation={perQuestionFeedback.find(e => e.questionIndex === i)}
                imageEvalResult={imageEvalResults[i]}
              />
            ))}
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => navigate(`/dashboard/guided/study-plan/${courseId}/learn/${moduleIndex}/${subtopicIndex}`)}
              className="flex items-center gap-2 rounded-full bg-[#efff55] px-8 py-3.5 text-sm font-bold text-black hover:bg-[#efff55]/90 transition"
            >
              <BookOpen className="h-4 w-4" />
              Back to Lesson
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ── TEST VIEW ──
  return (
    <div className="relative flex h-screen flex-col overflow-hidden bg-[#0a0a0a]" style={{ fontFamily: "'Inter', sans-serif" }}>
      {/* Background gradients */}
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.015),transparent_40%),radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-zinc-900/40 via-[#0a0a0a] to-[#0a0a0a] z-0 pointer-events-none" />

      {/* ── Top navigation bar ── */}
      <header className="relative z-10 flex h-16 shrink-0 items-center gap-4 border-b border-white/[0.05] bg-[#0c0c0c]/80 px-4 sm:px-6 backdrop-blur-md">
        {/* Exit */}
        <button
          onClick={() => setShowExitModal(true)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.06] hover:border-white/20 transition active:scale-95"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Title */}
        <div className="flex-1 min-w-0">
          <p className="truncate text-xs font-bold uppercase tracking-wider text-zinc-400">{subtopic?.subtopic_title}</p>
        </div>

        {/* Timer */}
        {initialSeconds !== null && (
          <div className={`flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-bold tabular-nums transition-all duration-300 ${
            isTimeLow
              ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.15)]'
              : 'border-white/[0.06] bg-white/[0.02] text-white shadow-[0_0_15px_rgba(239,255,85,0.02)]'
          }`}>
            <Clock className={`h-4 w-4 ${isTimeLow ? 'text-rose-400' : 'text-[#efff55]'}`} />
            {formatTime(timeRemaining)}
          </div>
        )}

        {/* Stats */}
        <div className="hidden sm:flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-bold text-zinc-400">
          <CheckSquare className="h-3.5 w-3.5 text-zinc-500" />
          <span>{attemptedCount} / {questions.length} Attempted</span>
        </div>

        {/* Submit */}
        <button
          onClick={() => setShowSubmitModal(true)}
          disabled={submitting}
          className="flex items-center gap-2 rounded-full bg-[#efff55] px-5 py-2 text-xs font-extrabold text-black hover:bg-[#efff55]/90 hover:shadow-[0_0_20px_rgba(239,255,85,0.2)] active:scale-95 transition disabled:opacity-60"
        >
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
          Submit Test
        </button>
      </header>

      {/* ── Body: Left panel + Main area ── */}
      <div className="relative z-10 flex min-h-0 flex-1 overflow-hidden">

        {/* Left: Question navigator */}
        <aside className="hidden w-64 shrink-0 flex-col border-r border-white/[0.05] bg-[#0c0c0c]/80 backdrop-blur-md md:flex">
          <div className="border-b border-white/[0.05] px-5 py-4">
            <p className="text-[10px] font-extrabold uppercase tracking-widest text-zinc-500">Exam Navigator</p>
          </div>
          <div className="flex-1 overflow-y-auto no-scrollbar">
            <QuestionGrid
              questions={questions}
              currentIndex={currentIndex}
              markedAnswers={markedAnswers}
              visitedSet={visitedSet}
              onSelect={goTo}
            />
          </div>
          {/* Legend */}
          <div className="border-t border-white/[0.05] px-5 py-4 space-y-2">
            {[
              { color: 'bg-[#efff55]', label: 'Current Question' },
              { color: 'bg-emerald-500/20 border border-emerald-500/40', label: 'Marked Answer' },
              { color: 'bg-white/[0.06]', label: 'Visited/Read' },
              { color: 'bg-white/[0.02]', label: 'Not Visited' },
            ].map(({ color, label }) => (
              <div key={label} className="flex items-center gap-2.5">
                <span className={`h-2.5 w-2.5 rounded-sm shrink-0 ${color}`} />
                <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">{label}</span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main: Question area */}
        <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-[#0a0a0a]/50">
          <div className="flex-1 overflow-y-auto px-4 py-8 sm:px-8 max-w-4xl w-full mx-auto">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2, ease: 'easeOut' }}
                className="rounded-[2rem] border border-white/[0.06] bg-[#121212]/90 p-6 md:p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] backdrop-blur-sm"
              >
                {/* Question header */}
                <div className="mb-6 flex flex-wrap items-center gap-3">
                  <span className={`rounded-full px-3 py-1 text-[10px] font-extrabold uppercase tracking-widest ${
                    currentQ?.type === 'mcq' ? 'bg-blue-500/15 text-blue-400 border border-blue-500/20'
                    : currentQ?.type === 'written' ? 'bg-violet-500/15 text-violet-400 border border-violet-500/20'
                    : currentQ?.type === 'math' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20'
                    : 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20'
                  }`}>
                    Q{currentIndex + 1} · {currentQ?.type}
                  </span>
                  {currentQ?.type === 'math' && (
                    <span className="text-[10px] font-bold text-amber-400/80 bg-amber-400/5 px-2.5 py-0.5 rounded-full border border-amber-400/10">📷 Image upload supported</span>
                  )}
                </div>

                {/* Question text */}
                <h3 className="mb-6 text-xl font-bold leading-relaxed text-white">
                  {currentQ?.question}
                </h3>

                {/* Question input area */}
                {currentQ?.type === 'mcq' && (
                  <MCQQuestion
                    question={currentQ}
                    value={liveAnswers[currentIndex]}
                    onChange={val => setLiveAnswers(prev => ({ ...prev, [currentIndex]: val }))}
                  />
                )}
                {(currentQ?.type === 'written' || currentQ?.type === 'math') && (
                  <WrittenQuestion
                    question={currentQ}
                    value={liveAnswers[currentIndex]}
                    onChange={val => setLiveAnswers(prev => ({ ...prev, [currentIndex]: val }))}
                    imageFile={liveImages[currentIndex]}
                    onImageUpload={file => setLiveImages(prev => ({ ...prev, [currentIndex]: file }))}
                    canUploadImage={!!currentQ?.imageUpload}
                    isPro={isPro}
                    isDev={isDev}
                  />
                )}
                {currentQ?.type === 'code' && (
                  <CodeQuestion
                    question={currentQ}
                    value={liveAnswers[currentIndex]}
                    onChange={val => setLiveAnswers(prev => ({ ...prev, [currentIndex]: val }))}
                  />
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Bottom nav ── */}
          <div className="shrink-0 border-t border-white/[0.06] bg-[#0a0a0a] px-4 py-3 flex items-center gap-3">
            <button onClick={goPrev} disabled={currentIndex === 0}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition">
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>

            {/* Mobile question counter */}
            <div className="flex-1 text-center text-xs text-zinc-600 md:hidden">
              {currentIndex + 1} / {questions.length}
            </div>

            {/* Mark Answer */}
            <button
              onClick={async () => { await markAnswer(); if (currentIndex < questions.length - 1) goTo(currentIndex + 1); }}
              className={`flex items-center gap-1.5 rounded-full px-5 py-2 text-xs font-bold transition ml-auto ${
                isCurrentMarked
                  ? 'bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-[#efff55] text-black hover:bg-[#efff55]/90'
              }`}
            >
              <CheckCircle2 className="h-3.5 w-3.5" />
              {isCurrentMarked ? 'Update Answer' : 'Mark Answer'}
            </button>

            <button onClick={goNext} disabled={currentIndex === questions.length - 1}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] px-4 py-2 text-xs font-semibold text-zinc-400 hover:text-white hover:border-white/20 disabled:opacity-30 transition">
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </main>
      </div>

      {/* ── Error toast ── */}
      {submitError && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 rounded-full border border-rose-500/30 bg-rose-500/10 px-5 py-3 text-sm text-rose-300 shadow-lg backdrop-blur">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          {submitError}
          <button onClick={() => setSubmitError('')}><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ── Exit modal ── */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-[1.8rem] border border-white/[0.08] bg-[#141414] p-7 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/15">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Exit test?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                This test <strong className="text-rose-400">cannot be retaken</strong>. Exiting will permanently consume your test slot without saving your answers.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitModal(false)}
                  className="flex-1 rounded-full border border-white/[0.06] bg-white/[0.02] py-2.5 text-sm font-semibold text-zinc-300 hover:text-white transition">
                  Keep Going
                </button>
                <button
                  onClick={() => navigate(`/dashboard/guided/study-plan/${courseId}/learn/${moduleIndex}/${subtopicIndex}`)}
                  className="flex-[1.5] rounded-full bg-rose-500 py-2.5 text-sm font-bold text-white hover:bg-rose-600 transition">
                  Exit Anyway
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submit confirmation modal ── */}
      <AnimatePresence>
        {showSubmitModal && (
          <motion.div
            className="fixed inset-0 z-[1300] flex items-center justify-center p-4"
            style={{ background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(8px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-[1.8rem] border border-white/[0.08] bg-[#141414] p-7 shadow-2xl"
              initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
              transition={{ type: 'spring', stiffness: 220, damping: 24 }}
            >
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-[#efff55]/15">
                <Send className="h-6 w-6 text-[#efff55]" />
              </div>
              <h3 className="text-xl font-bold text-white mb-2">Submit your test?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-3">
                You answered <strong className="text-white">{attemptedCount}</strong> of <strong className="text-white">{questions.length}</strong> questions.
                {attemptedCount < questions.length && (
                  <span className="text-amber-400"> {questions.length - attemptedCount} unanswered.</span>
                )}
              </p>
              <p className="text-xs text-zinc-600 mb-6">You cannot change answers after submitting.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitModal(false)}
                  className="flex-1 rounded-full border border-white/[0.06] bg-white/[0.02] py-2.5 text-sm font-semibold text-zinc-300 hover:text-white transition">
                  Review More
                </button>
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                  className="flex-[1.5] flex items-center justify-center gap-2 rounded-full bg-[#efff55] py-2.5 text-sm font-bold text-black hover:bg-[#efff55]/90 transition disabled:opacity-60">
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                  Submit Now
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submitting overlay ── */}
      <AnimatePresence>
        {submitting && (
          <motion.div
            className="fixed inset-0 z-[1400] flex flex-col items-center justify-center gap-4"
            style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(16px)' }}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Loader2 className="h-10 w-10 animate-spin text-[#efff55]" />
            <p className="text-white font-semibold text-lg">Grading your test...</p>
            <p className="text-zinc-500 text-sm">AI is reviewing each answer and preparing feedback</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
