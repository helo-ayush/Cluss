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
import MarkdownRenderer from '../components/MarkdownRenderer';
import GuidedPracticeModernLayout from '../components/GuidedPracticeModernLayout';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const normalizePromptText = (value) => {
  if (!value) return '';
  if (typeof value === 'string') return value.trim();
  if (Array.isArray(value)) return value.map(normalizePromptText).filter(Boolean).join('\n\n');
  if (typeof value === 'object') {
    const direct = [
      'question', 'Question', 'QUESTION',
      'prompt', 'Prompt', 'PROMPT',
      'stem', 'Stem',
      'title', 'Title',
      'text', 'Text',
      'content', 'Content',
      'instruction', 'Instruction',
      'instructions', 'Instructions',
      'description', 'Description',
      'problem', 'Problem',
      'query', 'Query',
    ].map(key => value[key]).find(Boolean);

    if (direct) return normalizePromptText(direct);

    const nested = Object.entries(value)
      .filter(([key]) => !['options', 'choices', 'rubric', 'correctAnswer', 'answer'].includes(key))
      .map(([, nestedValue]) => normalizePromptText(nestedValue))
      .find(Boolean);

    return nested || '';
  }
  return String(value).trim();
};

const getQuestionText = (question = {}) => normalizePromptText(
  question.question ||
  question.prompt ||
  question.stem ||
  question.title ||
  question.text ||
  question.content ||
  question.instruction ||
  question.instructions ||
  question.description
);

const getDisplayQuestion = (question = {}, index = 0) => {
  const prompt = getQuestionText(question);
  if (prompt) return prompt;
  if (question.type === 'mcq') return `Question ${index + 1}: choose the best answer from the options below.`;
  if (question.type === 'code') return `Question ${index + 1}: write a code solution for the prompt.`;
  return `Question ${index + 1}: write your answer below.`;
};

// ── Image resize to max 768px using canvas ──────────────────────────────────
async function resizeImageToBase64(file, maxPx = 640, quality = 0.72) {
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
      const base64 = canvas.toDataURL('image/jpeg', quality).split(',')[1];
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
    ...(bundle.mcqs || []).map((q, i) => ({ ...q, type: 'mcq', question: getQuestionText(q), _bundleKey: 'mcqs', _bundleIndex: i, imageUpload: false })),
    ...(bundle.written || []).map((q, i) => ({ ...q, type: 'written', question: getQuestionText(q), _bundleKey: 'written', _bundleIndex: i, imageUpload: q.image_upload !== false })),
    ...(bundle.math || []).map((q, i) => ({ ...q, type: 'math', question: getQuestionText(q), _bundleKey: 'math', _bundleIndex: i, imageUpload: q.image_upload !== false })),
    ...(bundle.code || []).map((q, i) => ({ ...q, type: 'code', question: getQuestionText(q), _bundleKey: 'code', _bundleIndex: i, imageUpload: false })),
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
function QuestionGrid({ questions, currentIndex, answers, flaggedQuestions, visitedSet, onSelect, results }) {
  const perQuestionFeedback = results?.perQuestionFeedback || [];
  return (
    <div className="grid grid-cols-5 gap-2.5 p-3 sm:grid-cols-6 md:grid-cols-4">
      {questions.map((q, i) => {
        const isActive = i === currentIndex;
        const isFlagged = flaggedQuestions.has(i);
        const isAttempted = answers[i] && (answers[i].value !== undefined && answers[i].value !== '' || answers[i].imageBase64);
        const isVisited = visitedSet.has(i);

        let isCorrect = null;
        if (results) {
          const explanation = perQuestionFeedback.find(e => e.questionIndex === i);
          isCorrect = q.type === 'mcq'
            ? answers[i]?.value === q.correctAnswer
            : explanation?.correct;
        }

        // Configure border, bg, text style based on active / correct status
        let btnStyle = '';
        if (results) {
          if (isActive) {
            btnStyle = 'border-[#efff55] bg-[#efff55] text-black scale-105 shadow-[0_0_18px_rgba(239,255,85,0.22)] font-black';
          } else {
            btnStyle = isCorrect
              ? 'border-[#efff55]/25 bg-[#efff55]/5 text-slate-200 hover:border-[#efff55]/40'
              : 'border-indigo-300/[0.08] bg-indigo-400/[0.02] text-slate-500 hover:border-indigo-300/20';
          }
        } else {
          if (isActive) {
            btnStyle = 'border-[#efff55] bg-[#efff55] text-black scale-105 shadow-[0_0_18px_rgba(239,255,85,0.22)] font-black';
          } else if (isFlagged) {
            btnStyle = 'border-[#efff55]/35 bg-[#efff55]/5 text-[#efff55] hover:border-[#efff55]/55';
          } else if (isAttempted) {
            btnStyle = 'border-indigo-300/20 bg-indigo-400/[0.06] text-slate-200';
          } else if (isVisited) {
            btnStyle = 'border-indigo-300/[0.10] bg-indigo-400/[0.03] text-slate-400 hover:border-indigo-300/25 hover:text-white';
          } else {
            btnStyle = 'border-indigo-300/[0.06] bg-[#0a0e1a] text-slate-600 hover:border-indigo-300/18 hover:text-slate-400';
          }
        }

        return (
          <button
            key={i}
            onClick={() => onSelect(i)}
            className={`relative aspect-square min-h-11 rounded-xl text-sm font-black transition-all duration-200 border flex items-center justify-center ${btnStyle}`}
            aria-label={`Go to question ${i + 1}`}
          >
            {i + 1}
            {isFlagged && !isActive && !results && (
              <span className="absolute -top-1 -right-1 h-2.5 w-2.5 rounded-full bg-amber-500 shadow-[0_0_6px_rgba(245,158,11,0.6)] border border-[#1b1b1b]" />
            )}
            {results && (
              isCorrect ? (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-[#efff55] shadow-[0_0_8px_rgba(239,255,85,0.7)] border border-black flex items-center justify-center text-[8px] font-black text-black">✓</span>
              ) : (
                <span className="absolute -top-1 -right-1 h-3.5 w-3.5 rounded-full bg-zinc-700 border border-black flex items-center justify-center text-[8px] font-black text-white">✗</span>
              )
            )}
          </button>
        );
      })}
    </div>
  );
}

// ── MCQ question ──────────────────────────────────────────────────────────────
function MCQQuestion({ question, value, onChange, disabled }) {
  return (
    <div className="space-y-3">
      {(question.options || []).map((opt, i) => {
        const letter = ['A', 'B', 'C', 'D'][i];
        const isSelected = value === opt;
        
        let containerStyle = '';
        let letterStyle = '';
        let badge = null;

        if (disabled) {
          // Review mode
          const isCorrectAnswer = opt === question.correctAnswer;
          if (isSelected) {
            if (isCorrectAnswer) {
              // Student selected correct answer
              containerStyle = 'border-[#efff55]/40 bg-[#efff55]/[0.02] text-white shadow-[0_0_15px_rgba(239,255,85,0.05)]';
              letterStyle = 'bg-[#efff55] text-black font-extrabold';
              badge = <span className="text-[10px] font-black uppercase tracking-wider text-[#efff55] ml-auto">✓ Correct</span>;
            } else {
              // Student selected wrong answer
              containerStyle = 'border-rose-500/30 bg-rose-500/[0.02] text-zinc-300';
              letterStyle = 'bg-rose-500 text-white font-extrabold';
              badge = <span className="text-[10px] font-black uppercase tracking-wider text-rose-400 ml-auto">✗ Your Choice</span>;
            }
          } else if (isCorrectAnswer) {
            // Correct answer but student didn't select it
            containerStyle = 'border-white/20 bg-white/[0.02] text-white';
            letterStyle = 'bg-white text-black font-extrabold';
            badge = <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 ml-auto">Correct Answer</span>;
          } else {
            // Unselected incorrect answers
            containerStyle = 'border-white/[0.03] bg-black/20 text-zinc-500 opacity-60';
            letterStyle = 'bg-white/[0.03] text-zinc-600';
          }
        } else {
          // Active test-taking mode
          if (isSelected) {
            containerStyle = 'border-[#efff55]/70 bg-[#efff55]/10 text-white font-extrabold shadow-[0_0_18px_rgba(239,255,85,0.08)]';
            letterStyle = 'bg-[#efff55] text-black';
          } else {
            containerStyle = 'border-white/[0.10] bg-[#1b1b1b] text-white/82 hover:border-[#efff55]/35 hover:bg-[#242424] hover:text-white';
            letterStyle = 'bg-white/[0.08] text-white/55';
          }
        }

        return (
          <button
            key={i}
            onClick={() => !disabled && onChange(opt)}
            disabled={disabled}
            className={`w-full flex items-start gap-3 rounded-2xl border px-4 py-4 text-left text-sm font-semibold transition-all duration-200 sm:px-5 ${
              disabled ? 'cursor-default' : 'active:scale-[0.99]'
            } ${containerStyle}`}
          >
            <span className={`mt-0.5 flex-shrink-0 flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold transition-all ${letterStyle}`}>
              {letter}
            </span>
            <span className="min-w-0 flex-1 leading-relaxed break-words">{opt}</span>
            {badge}
          </button>
        );
      })}
    </div>
  );
}

// ── Written / Math question ───────────────────────────────────────────────────
function WrittenQuestion({ question, value, onChange, imageFile, onImageUpload, canUploadImage, isPro, isDev, onFilePickerTrigger, disabled }) {
  const fileRef = useRef(null);
  const allowedToUpload = isPro || isDev;
  return (
    <div className="space-y-4">
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "No answer submitted." : "Type your answer here... or upload a handwritten image below."}
        rows={6}
        className="w-full resize-none rounded-2xl border border-white/[0.10] bg-[#1b1b1b] px-5 py-4 text-sm text-white placeholder:text-white/30 outline-none focus:border-[#efff55]/45 focus:bg-[#242424] transition duration-300 leading-relaxed shadow-inner disabled:text-white/60 disabled:bg-white/[0.03]"
      />
      {canUploadImage && (
        <div className="relative">
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={e => onImageUpload(e.target.files[0])} />
          {imageFile ? (
            <div className="flex items-center gap-3 rounded-[1rem] border border-emerald-500/25 bg-emerald-500/5 px-4 py-3.5 shadow-sm">
              <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
              <span className="text-xs text-emerald-300 flex-1 truncate font-medium">{imageFile.name}</span>
              {!disabled && (
                <button onClick={() => onImageUpload(null)} className="text-zinc-500 hover:text-white transition-colors"><X className="h-3.5 w-3.5" /></button>
              )}
            </div>
          ) : allowedToUpload && !disabled ? (
            <button onClick={() => {
              onFilePickerTrigger?.();
              fileRef.current?.click();
            }}
              className="flex w-full items-center justify-center gap-2 rounded-[1rem] border border-dashed border-white/[0.08] bg-white/[0.01] px-4 py-3.5 text-xs font-bold text-zinc-400 hover:border-white/20 hover:text-white hover:bg-white/[0.02] transition duration-300">
              <ImageIcon className="h-4 w-4 text-zinc-500" />
              Upload handwritten answer (recommended: solve on a single clean page) {isDev && !isPro && <span className="text-[9px] bg-amber-500/20 border border-amber-500/30 text-amber-400 px-1.5 py-0.5 rounded-full uppercase tracking-wider font-extrabold ml-2">Dev Unlocked</span>}
            </button>
          ) : !disabled ? (
            <div className="flex w-full items-center justify-center gap-2.5 rounded-[1rem] border border-dashed border-white/[0.06] bg-white/[0.01] px-4 py-4 text-xs font-bold text-zinc-500">
              <ImageIcon className="h-4 w-4 text-zinc-600" />
              Handwritten image upload <span className="rounded-full bg-white/[0.06] border border-white/[0.08] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-zinc-500">PRO ONLY</span>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

// ── Code question ─────────────────────────────────────────────────────────────
function CodeQuestion({ question, value, onChange, disabled }) {
  return (
    <div className="space-y-3">
      {question.starterCode && (
        <div className="rounded-2xl border border-white/[0.10] bg-[#1b1b1b] p-4">
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-600">Starter Code</p>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs text-zinc-200 font-mono leading-relaxed">{question.starterCode}</pre>
        </div>
      )}
      <textarea
        value={value || ''}
        onChange={e => onChange(e.target.value)}
        disabled={disabled}
        placeholder={disabled ? "No answer submitted." : "Write your code solution here..."}
        rows={10}
        spellCheck={false}
        className="w-full resize-none rounded-2xl border border-white/[0.10] bg-[#1b1b1b] px-5 py-4 font-mono text-sm text-zinc-100 placeholder:text-white/30 outline-none focus:border-[#efff55]/45 focus:bg-[#242424] transition leading-relaxed disabled:opacity-80"
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
    <div className="rounded-[1.4rem] border border-white/[0.04] bg-[#121212]/80 overflow-hidden relative transition-all duration-300 shadow-sm hover:border-white/[0.08] backdrop-blur-sm">
      {/* Accent indicator bar on the left */}
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
        isCorrect ? 'bg-emerald-500/65 shadow-[0_0_8px_rgba(16,185,129,0.35)]' : 'bg-rose-500/65 shadow-[0_0_8px_rgba(244,63,94,0.35)]'
      }`} />
      <button
        className="flex w-full items-start gap-3 pl-6 pr-5 py-4 text-left"
        onClick={() => setOpen(o => !o)}
      >
        <div className={`mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${
          isCorrect ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
        }`}>
          {isCorrect ? <CheckCircle2 className="h-3.5 w-3.5" /> : <XCircle className="h-3.5 w-3.5" />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <span className={`text-[9px] font-bold uppercase tracking-widest ${
              isCorrect ? 'text-emerald-400' : 'text-rose-400'
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
  const { isLoaded, isSignedIn, user } = useUser();

  const practiceIndex = parseInt(searchParams.get('pi') || '0', 10);
  const timeLimitMins = parseInt(searchParams.get('tl') || '15', 10);
  const initialSeconds = timeLimitMins > 0 ? timeLimitMins * 60 : null; // null = no limit

  // Data
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  // Test state
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { [qIndex]: { value: '', imageFile: null, imageBase64: '' } }
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set()); // Set of flagged qIndexes
  const [visitedSet, setVisitedSet] = useState(new Set([0]));
  const [timeRemaining, setTimeRemaining] = useState(null);
  const [timerActive, setTimerActive] = useState(true);

  // Modals/Session
  const [showExitModal, setShowExitModal] = useState(false);
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [showMobileNav, setShowMobileNav] = useState(false);
  const [warnings, setWarnings] = useState(0);
  const [lockoutSubmit, setLockoutSubmit] = useState(false);
  const lastFocusLossTimeRef = useRef(0);
  const submissionInProgressRef = useRef(false);
  const isFilePickerActiveRef = useRef(false);

  // Submit/result
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [results, setResults] = useState(null); // { feedback, perQuestionFeedback, imageEvalResults }

  const { usageData } = useUsage();
  const plan = usageData?.plan || 'free';
  const isPro = plan !== 'free';
  const isDev = import.meta.env.DEV || process.env.NODE_ENV === 'development';

  const subtopicRef = `${moduleIndex}:${subtopicIndex}`;
  const storageKey = `test_end_${courseId}_${moduleIndex}_${subtopicIndex}_${practiceIndex}`;

  const module = course?.modules?.[Number(moduleIndex)];
  const subtopic = module?.subtopics?.[Number(subtopicIndex)];
  const practice = subtopic?.practices?.[practiceIndex];
  const questions = useMemo(() => flattenQuestions(practice?.bundle), [practice]);

  // ── Autosave Actions ──
  const updateAnswer = useCallback((qIndex, field, val) => {
    setAnswers(prev => ({
      ...prev,
      [qIndex]: {
        ...prev[qIndex],
        [field]: val
      }
    }));
  }, []);

  const handleImageUpload = useCallback(async (qIndex, file) => {
    if (!file) {
      setAnswers(prev => {
        const next = { ...prev };
        if (next[qIndex]) {
          next[qIndex] = { ...next[qIndex], imageFile: null, imageBase64: null };
        }
        return next;
      });
      return;
    }
    setAnswers(prev => ({
      ...prev,
      [qIndex]: {
        ...prev[qIndex],
        imageFile: file,
        imageBase64: null
      }
    }));
    try {
      const base64 = await resizeImageToBase64(file);
      setAnswers(prev => ({
        ...prev,
        [qIndex]: {
          ...prev[qIndex],
          imageFile: file,
          imageBase64: base64
        }
      }));
    } catch (err) {
      console.error("Failed to convert image to base64:", err);
    }
  }, []);

  const toggleFlagged = useCallback((qIndex) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev);
      if (next.has(qIndex)) {
        next.delete(qIndex);
      } else {
        next.add(qIndex);
      }
      return next;
    });
  }, []);

  // ── Submit ──
  const handleSubmit = useCallback(async (autoSubmit = false) => {
    if (submissionInProgressRef.current || submitted) return;
    submissionInProgressRef.current = true;
    setSubmitting(true);
    setSubmitError('');
    setTimerActive(false);
    setShowSubmitModal(false);
    setShowWarningModal(false);

    try {
      const mcqAnswers = {};
      const writtenAnswers = {};
      const codeAnswers = {};
      const imageAnswers = {};

      questions.forEach((q, i) => {
        const ans = answers[i];
        if (!ans) return;
        if (q.type === 'mcq') {
          if (ans.value) mcqAnswers[i] = ans.value;
        } else if (q.type === 'written' || q.type === 'math') {
          if (ans.value) writtenAnswers[i] = ans.value;
        } else if (q.type === 'code') {
          if (ans.value) codeAnswers[i] = ans.value;
        }
        if (ans.imageBase64) {
          imageAnswers[i] = ans.imageBase64;
        }
      });

      const imagePayloadBytes = Object.values(imageAnswers).reduce((total, value) => total + (value?.length || 0), 0);
      if (imagePayloadBytes > 8_000_000) {
        throw new Error('The uploaded image is still too large. Please upload a clearer cropped photo of only your written work.');
      }

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 60000);

      const res = await fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${subtopicRef}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: controller.signal,
        body: JSON.stringify({
          submission: { mcqAnswers, writtenAnswers, codeAnswers },
          imageAnswers,
          practiceIndex,
          confidence: autoSubmit ? 'auto-submitted' : 'high',
          studentNotes: ''
        }),
      });
      clearTimeout(timeoutId);
      const data = await res.json();
      if (!data.success) throw new Error(data.error || data.message || 'Submission failed.');

      localStorage.removeItem(storageKey);

      setResults({
        feedback: data.feedback,
        perQuestionFeedback: data.perQuestionFeedback || [],
        imageEvalResults: data.imageEvalResults || {}
      });
      setSubmitted(true);
      setLockoutSubmit(false);
    } catch (err) {
      setSubmitError(err.name === 'AbortError' ? 'Submission timed out. Please try submitting again.' : err.message);
      submissionInProgressRef.current = false;
      setLockoutSubmit(false);
      setTimerActive(true);
    } finally {
      setSubmitting(false);
    }
  }, [courseId, subtopicRef, practiceIndex, questions, answers, storageKey, submitted]);

  const handleExitPractice = useCallback(async () => {
    try {
      localStorage.removeItem(storageKey);
      await fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${subtopicRef}/practice/clear`, {
        method: 'POST',
      });
    } catch (err) {
      console.error("Failed to clear practice:", err);
    }
    navigate(`/dashboard/guided/study-plan/${courseId}/learn/${moduleIndex}/${subtopicIndex}`);
  }, [courseId, subtopicRef, moduleIndex, subtopicIndex, storageKey, navigate]);

  // ── Fetch course data & ownership/expiration checks ──
  useEffect(() => {
    if (!submitted || !courseId || !subtopicRef) return;

    const clearCompletedPractice = () => {
      localStorage.removeItem(storageKey);
      const url = `${API_BASE}/api/study-plans/${courseId}/subtopics/${subtopicRef}/practice/clear`;
      if (navigator.sendBeacon) {
        navigator.sendBeacon(url);
        return;
      }
      fetch(url, { method: 'POST', keepalive: true }).catch(() => {});
    };

    window.addEventListener('pagehide', clearCompletedPractice);
    return () => {
      window.removeEventListener('pagehide', clearCompletedPractice);
    };
  }, [submitted, courseId, subtopicRef, storageKey]);

  useEffect(() => {
    if (!isLoaded) return;
    if (!isSignedIn || !user?.id) {
      setLoadError("Access denied: Please sign in to view this test.");
      setLoading(false);
      return;
    }

    const load = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/study-plans/${courseId}?clerkId=${user.id}`);
        const data = await res.json();
        if (!data.success) throw new Error(data.message || 'Could not load course.');

        // Verify practice test slot exists
        const mod = data.course?.modules?.[Number(moduleIndex)];
        const sub = mod?.subtopics?.[Number(subtopicIndex)];
        const prac = sub?.practices?.[practiceIndex];
        if (!prac) {
          throw new Error("This practice test has been completed or deleted.");
        }

        // Verify expiration
        const startMs = new Date(prac.generatedAt).getTime();
        const timeLimitMins = prac.config?.timeLimit || 15;
        const endTimestamp = startMs + timeLimitMins * 60 * 1000;
        if (Date.now() > endTimestamp && prac.state.attemptsUsed === 0) {
          // Self-cleanup expired practice session in background
          fetch(`${API_BASE}/api/study-plans/${courseId}/subtopics/${subtopicRef}/practice/clear`, { method: 'POST' }).catch(console.error);
          throw new Error("This practice test has expired.");
        }

        setCourse(data.course);

        // Restore historical evaluation details if session has already been graded
        if (prac.state.attemptsUsed > 0) {
          setAnswers(prac.state.lastSubmission || {});
          setResults({
            feedback: prac.state.feedback,
            perQuestionFeedback: prac.state.perQuestionFeedback || [],
            imageEvalResults: prac.state.imageEvalResults || {}
          });
          setSubmitted(true);
          setTimerActive(false);
        }
      } catch (err) {
        setLoadError(err.message);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [courseId, user, isLoaded, isSignedIn, moduleIndex, subtopicIndex, practiceIndex, subtopicRef]);

  // ── Server-Synced Timer Effect ──
  useEffect(() => {
    if (!practice?.generatedAt || !timerActive || submitted) return;

    const startMs = new Date(practice.generatedAt).getTime();
    const timeLimitMins = practice.config?.timeLimit || 15;
    const endTimestamp = startMs + timeLimitMins * 60 * 1000;

    const diff = Math.max(0, Math.floor((endTimestamp - Date.now()) / 1000));
    setTimeRemaining(diff);

    if (diff <= 0) {
      handleSubmit(true);
      return;
    }

    const id = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((endTimestamp - now) / 1000));
      setTimeRemaining(remaining);
      if (remaining <= 0) {
        clearInterval(id);
        handleSubmit(true);
      }
    }, 1000);

    return () => clearInterval(id);
  }, [practice, timerActive, submitted, handleSubmit]);

  // ── Anti-cheating focus listener ──
  useEffect(() => {
    if (submitted || submitting || !timerActive || lockoutSubmit) return;

    const handleFocusLoss = () => {
      if (isFilePickerActiveRef.current) return;
      const now = Date.now();
      if (now - lastFocusLossTimeRef.current < 2500) return;
      lastFocusLossTimeRef.current = now;

      setWarnings(prev => {
        const next = prev + 1;
        if (next >= 2) {
          setLockoutSubmit(true);
          handleSubmit(true);
        } else {
          setShowWarningModal(true);
        }
        return next;
      });
    };

    const handleWindowFocus = () => {
      if (isFilePickerActiveRef.current) {
        setTimeout(() => {
          isFilePickerActiveRef.current = false;
        }, 300);
      }
    };

    window.addEventListener('blur', handleFocusLoss);
    window.addEventListener('focus', handleWindowFocus);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        handleFocusLoss();
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      window.removeEventListener('blur', handleFocusLoss);
      window.removeEventListener('focus', handleWindowFocus);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [submitted, submitting, timerActive, handleSubmit, lockoutSubmit]);

  // ── Navigate to question ──
  const goTo = useCallback((i) => {
    setCurrentIndex(i);
    setVisitedSet(prev => new Set([...prev, i]));
  }, []);

  const goNext = () => currentIndex < questions.length - 1 && goTo(currentIndex + 1);
  const goPrev = () => currentIndex > 0 && goTo(currentIndex - 1);

  const attemptedCount = Object.keys(answers).filter(k => answers[k]?.value?.trim() || answers[k]?.imageBase64).length;
  const isTimeLow = initialSeconds !== null && timeRemaining !== null && timeRemaining <= 60;
  const currentQ = questions[currentIndex];
  const displayQuestion = getDisplayQuestion(currentQ, currentIndex);

  // ── Loading ──
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#0a0a0a]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-white" />
          <p className="text-sm font-semibold tracking-wider text-zinc-500 uppercase">Loading Practice Session...</p>
        </div>
      </div>
    );
  }

  if (loadError || !practice || questions.length === 0) {
    return (
      <div className="flex h-screen flex-col items-center justify-center gap-5 bg-[#0a0a0a] px-4 text-center">
        <AlertTriangle className="h-12 w-12 text-rose-500" />
        <h2 className="text-xl font-bold text-white">Oops! Something went wrong</h2>
        <p className="text-zinc-400 max-w-sm text-sm leading-relaxed">{loadError || 'The practice test session could not be found.'}</p>
        <button onClick={() => navigate(-1)} className="rounded-full border border-white/[0.08] bg-white/[0.02] px-8 py-3 text-xs font-bold text-zinc-300 hover:text-white hover:border-white/20 transition duration-300">
          Go Back
        </button>
      </div>
    );
  }

  // ── TEST VIEW ──
  return (
    <GuidedPracticeModernLayout
      questions={questions}
      currentIndex={currentIndex}
      currentQ={currentQ}
      displayQuestion={displayQuestion}
      answers={answers}
      flaggedQuestions={flaggedQuestions}
      visitedSet={visitedSet}
      attemptedCount={attemptedCount}
      submitted={submitted}
      results={results}
      subtopic={subtopic}
      submitting={submitting}
      submitError={submitError}
      showExitModal={showExitModal}
      showSubmitModal={showSubmitModal}
      showWarningModal={showWarningModal}
      lockoutSubmit={lockoutSubmit}
      showMobileNav={showMobileNav}
      initialSeconds={initialSeconds}
      timeRemaining={timeRemaining}
      isTimeLow={isTimeLow}
      isPro={isPro}
      isDev={isDev}
      updateAnswer={updateAnswer}
      handleImageUpload={handleImageUpload}
      toggleFlagged={toggleFlagged}
      goTo={goTo}
      goPrev={goPrev}
      goNext={goNext}
      setShowExitModal={setShowExitModal}
      setShowSubmitModal={setShowSubmitModal}
      setShowWarningModal={setShowWarningModal}
      setShowMobileNav={setShowMobileNav}
      setSubmitError={setSubmitError}
      handleSubmit={handleSubmit}
      handleExitPractice={handleExitPractice}
      onFilePickerTrigger={() => { isFilePickerActiveRef.current = true; }}
      formatTime={formatTime}
    />
  );

  return (
    <div className="relative flex h-dvh overflow-hidden bg-[#1b1b1b] text-white" style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
      <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_30%_0%,rgba(239,255,85,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.035),transparent_36%)]" />

      {/* ── Left Sidebar (Desktop) ── */}
      <aside className="hidden w-72 shrink-0 flex-col border-r border-white/[0.08] bg-[#161616]/95 z-20 md:flex xl:w-80">
        {/* Sidebar Header or Scorecard */}
        {submitted && results ? (
          <div className="border-b border-white/[0.04] p-5 shrink-0 bg-white/[0.01]">
            <div className="flex items-center justify-between mb-3">
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Overall Score</span>
              <span className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider ${
                results.feedback?.passed
                  ? 'bg-zinc-800 border border-zinc-700 text-zinc-200 shadow-[0_0_8px_rgba(255,255,255,0.05)]'
                  : 'bg-zinc-900 border border-zinc-800 text-zinc-400'
              }`}>
                {results.feedback?.passed ? 'Mastered' : 'Needs Review'}
              </span>
            </div>
            <div className="text-4xl font-black tracking-tight text-white mb-2">
              {results.feedback?.score ?? 0}
              <span className="text-sm font-bold text-zinc-500 ml-1">/ 100</span>
            </div>
            <p className="text-[11px] text-zinc-400 leading-normal line-clamp-3">
              {results.feedback?.summary}
            </p>
          </div>
        ) : (
          <div className="flex h-16 items-center justify-between border-b border-white/[0.08] px-6 shrink-0">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-white/60">Navigator</span>
            <span className="rounded-full border border-white/[0.10] bg-white/[0.05] px-2.5 py-1 text-[10px] font-extrabold text-white/80">
              {attemptedCount}/{questions.length}
            </span>
          </div>
        )}
        
        {/* Grid Area */}
        <div className="flex-1 overflow-y-auto no-scrollbar p-3">
          <QuestionGrid
            questions={questions}
            currentIndex={currentIndex}
            answers={answers}
            flaggedQuestions={flaggedQuestions}
            visitedSet={visitedSet}
            onSelect={goTo}
            results={results}
          />
        </div>
      </aside>

      {/* ── Right Panel: Header + Content ── */}
      <div className="flex flex-1 flex-col min-w-0 bg-[#1b1b1b]/95 relative z-10">
        {/* ── Top navbar ── */}
        <header className="flex min-h-16 shrink-0 items-center justify-between gap-3 border-b border-white/[0.08] bg-[#1b1b1b]/90 px-3 py-3 backdrop-blur-md sm:px-6">
          {/* Close button + Title */}
          <div className="flex items-center gap-4 min-w-0">
            <button
              onClick={submitted ? handleExitPractice : () => setShowExitModal(true)}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/[0.06] bg-white/[0.02] text-zinc-400 hover:text-white hover:bg-white/[0.05] hover:border-white/12 transition active:scale-95 duration-200"
            >
              <X className="h-4 w-4" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-sm font-extrabold tracking-[0.02em] text-white">
                {subtopic?.subtopic_title || 'Guided Practice'}
              </p>
              {submitted && (
                <span className="text-[9px] font-black uppercase tracking-widest text-[#efff55] block mt-0.5">
                  Review Mode
                </span>
              )}
            </div>
          </div>

          {/* Right Metrics & Submit */}
          <div className="flex shrink-0 items-center gap-2 sm:gap-3">
            {submitted ? (
              <button
                onClick={handleExitPractice}
                className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-black hover:bg-zinc-200 active:scale-95 transition duration-200 sm:px-6"
              >
                <BookOpen className="h-3.5 w-3.5" />
                Done Review
              </button>
            ) : (
              <>
                {/* Timer */}
                {initialSeconds !== null && timeRemaining !== null && (
                  <div className={`flex items-center gap-2 rounded-full border px-3 py-2 text-xs font-bold tracking-wider tabular-nums transition-all duration-300 sm:px-4 ${
                    isTimeLow
                      ? 'border-rose-500/40 bg-rose-500/10 text-rose-400 animate-pulse shadow-[0_0_15px_rgba(239,68,68,0.15)]'
                      : 'border-white/[0.06] bg-white/[0.02] text-white shadow-[0_0_15px_rgba(255,255,255,0.02)]'
                  }`}>
                    <Clock className={`h-3.5 w-3.5 ${isTimeLow ? 'text-rose-400' : 'text-white'}`} />
                    {formatTime(timeRemaining)}
                  </div>
                )}

                {/* Stats (Desktop) */}
                <div className="hidden md:flex items-center gap-2 rounded-full border border-white/[0.06] bg-white/[0.02] px-4 py-2 text-xs font-bold text-zinc-400">
                  <CheckSquare className="h-3.5 w-3.5 text-zinc-500" />
                  <span>{attemptedCount} / {questions.length} Attempted</span>
                </div>

                {/* Mobile Navigator toggle */}
                <button
                  onClick={() => setShowMobileNav(true)}
                  className="md:hidden flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3.5 py-2 text-xs font-bold text-zinc-400 hover:text-white hover:bg-white/[0.04]"
                >
                  <CheckSquare className="h-3.5 w-3.5 text-zinc-400" />
                  <span>{attemptedCount} / {questions.length}</span>
                </button>

                {/* Submit */}
                <button
                  onClick={() => setShowSubmitModal(true)}
                  disabled={submitting}
                  className="flex items-center gap-2 rounded-full bg-white px-3.5 py-2.5 text-xs font-black text-black hover:bg-zinc-200 active:scale-95 transition disabled:opacity-60 duration-200 sm:px-5"
                >
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                  <span className="hidden sm:inline">Submit Test</span>
                  <span className="sm:hidden">Submit</span>
                </button>
              </>
            )}
          </div>
        </header>

        {/* ── Main content scroll area ── */}
        <main className="flex-1 overflow-hidden flex flex-col justify-between">
          <div className="flex-1 overflow-y-auto px-4 py-5 sm:px-6 md:px-10 lg:px-12 w-full max-w-6xl mx-auto flex flex-col justify-start">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIndex}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.18, ease: 'easeOut' }}
                className="w-full flex-1 flex flex-col min-h-0"
              >
                {/* ── QUESTION CARD ── */}
                <div className="rounded-[1.75rem] border border-white/[0.10] bg-[#202020] p-5 shadow-[0_24px_70px_rgba(0,0,0,0.38)] relative overflow-hidden mb-5 sm:p-7 md:p-8">
                  {/* Subtle top monochrome highlight border */}
                  <div className="absolute top-0 left-0 right-0 h-[4px] bg-gradient-to-r from-[#efff55] via-white/70 to-[#efff55]/40 opacity-90" />
                  
                  {/* Top metadata row */}
                  <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
                    <span className="rounded-full bg-white/[0.06] border border-white/[0.12] px-3 py-2 text-[10px] font-black uppercase tracking-widest text-white/70 sm:px-4">
                      Question {currentIndex + 1} of {questions.length} · {currentQ?.type?.toUpperCase()}
                    </span>
                    
                    {submitted ? (
                      <span className={`rounded-full px-4 py-2 text-[10px] font-black uppercase tracking-widest transition duration-300 ${
                        (currentQ?.type === 'mcq' ? answers[currentIndex]?.value === currentQ?.correctAnswer : results?.perQuestionFeedback?.find(e => e.questionIndex === currentIndex)?.correct)
                          ? 'bg-[#efff55]/10 border border-[#efff55]/20 text-[#efff55] shadow-[0_0_12px_rgba(239,255,85,0.1)]'
                          : 'bg-zinc-800/40 border border-zinc-700/60 text-zinc-400'
                      }`}>
                        {(currentQ?.type === 'mcq' ? answers[currentIndex]?.value === currentQ?.correctAnswer : results?.perQuestionFeedback?.find(e => e.questionIndex === currentIndex)?.correct)
                          ? '✓ Fully Correct'
                          : '✗ Review Required'}
                      </span>
                    ) : (
                      <button
                        onClick={() => toggleFlagged(currentIndex)}
                        className={`flex items-center gap-1.5 rounded-full px-3 py-2 text-[10px] font-black uppercase tracking-widest border transition duration-200 sm:px-4 ${
                          flaggedQuestions.has(currentIndex)
                            ? 'border-[#efff55] bg-[#efff55] text-black'
                            : 'border-white/[0.12] bg-white/[0.04] text-white/65 hover:text-white hover:border-[#efff55]/50'
                        }`}
                      >
                        <Zap className={`h-3.5 w-3.5 ${flaggedQuestions.has(currentIndex) ? 'fill-black text-black' : 'text-[#efff55]/70'}`} />
                        <span>{flaggedQuestions.has(currentIndex) ? 'Flagged' : 'Flag for Review'}</span>
                      </button>
                    )}
                  </div>

                  <div className="rounded-3xl border border-white/[0.12] bg-[#1b1b1b] px-5 py-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.04)] sm:px-6 md:px-7">
                    <div className="mb-4 flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#efff55] shadow-[0_0_18px_rgba(239,255,85,0.8)]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Question Prompt</span>
                    </div>
                    <MarkdownRenderer
                      content={displayQuestion}
                      className="text-[1.35rem] font-black leading-snug text-white sm:text-[1.55rem] [&_p]:!mb-0 [&_p]:!text-white [&_p]:!leading-snug [&_h1]:!text-2xl [&_h1]:!mt-0 [&_h2]:!text-xl [&_h2]:!mt-0 [&_code]:!rounded-md [&_code]:!bg-white/[0.08] [&_code]:!px-1.5 [&_code]:!py-0.5 [&_code]:!text-[#efff55]"
                    />
                  </div>
                </div>

                {/* ── BEAUTIFUL DIVISION SEPARATOR ── */}
                <div className="flex items-center gap-4 my-3 sm:my-4">
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/[0.10]" />
                  <span className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40 shrink-0 select-none">
                    Answer Workspace
                  </span>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-white/[0.10] to-transparent" />
                </div>

                {/* ── ANSWER COCKPIT CARD ── */}
                <div className="rounded-[1.75rem] border border-white/[0.10] bg-[#202020] p-5 backdrop-blur-md shadow-inner mb-8 sm:p-7 md:p-8">
                  <div className="flex items-center gap-2 mb-5 text-white/60">
                    <div className="h-2 w-2 rounded-full bg-[#efff55]" />
                    <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-white/55 select-none">
                      Your Response
                    </span>
                  </div>
                  
                  <div className="w-full select-text">
                    {currentQ?.type === 'mcq' && (
                      <MCQQuestion
                        question={currentQ}
                        value={answers[currentIndex]?.value || ''}
                        onChange={val => updateAnswer(currentIndex, 'value', val)}
                        disabled={submitted}
                      />
                    )}
                    {(currentQ?.type === 'written' || currentQ?.type === 'math') && (
                      <WrittenQuestion
                        question={currentQ}
                        value={answers[currentIndex]?.value || ''}
                        onChange={val => updateAnswer(currentIndex, 'value', val)}
                        imageFile={answers[currentIndex]?.imageFile}
                        onImageUpload={file => handleImageUpload(currentIndex, file)}
                        canUploadImage={!!currentQ?.imageUpload}
                        isPro={isPro}
                        isDev={isDev}
                        onFilePickerTrigger={() => { isFilePickerActiveRef.current = true; }}
                        disabled={submitted}
                      />
                    )}
                    {currentQ?.type === 'code' && (
                      <CodeQuestion
                        question={currentQ}
                        value={answers[currentIndex]?.value || ''}
                        onChange={val => updateAnswer(currentIndex, 'value', val)}
                        disabled={submitted}
                      />
                    )}
                  </div>
                </div>

                {/* ── AI COACH REVIEW PANEL ── */}
                {submitted && results && (
                  <motion.div
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1, duration: 0.25 }}
                    className="rounded-2xl border border-white/[0.05] bg-[#0c0c0c]/85 p-6 md:p-8 backdrop-blur-md shadow-lg space-y-6 overflow-hidden relative"
                  >
                    {/* Top slim gradient highlight */}
                    <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-zinc-800 via-zinc-500 to-zinc-800 opacity-20" />

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/[0.04] pb-5">
                      <div className="flex items-center gap-3">
                        <div className="h-6 w-6 rounded-full bg-white/[0.05] flex items-center justify-center border border-white/[0.1]">
                          <Zap className="h-3 w-3 text-white fill-white" />
                        </div>
                        <div>
                          <h4 className="text-sm font-black uppercase tracking-wider text-white">AI Coach Review</h4>
                          <p className="text-[9px] text-zinc-500 uppercase tracking-widest mt-0.5">Instance Grading System v2</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-end">
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500">Grading Status</span>
                          <span className="text-xs font-black text-white mt-0.5 uppercase tracking-wide">
                            {currentQ?.type === 'mcq' ? 'Auto-Graded' : 'AI-Evaluated'}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Content breakdown */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      {/* Left: Performance details & transcribed image OCR status */}
                      <div className="space-y-5">
                        {/* 1. Evaluation verdict */}
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Evaluation Verdict</span>
                          {(() => {
                            const explanation = results?.perQuestionFeedback?.find(e => e.questionIndex === currentIndex);
                            const isCorrect = currentQ?.type === 'mcq'
                              ? answers[currentIndex]?.value === currentQ?.correctAnswer
                              : explanation?.correct;

                            if (isCorrect) {
                              return (
                                <div className="rounded-xl border border-zinc-700 bg-zinc-900/40 p-4">
                                  <span className="text-sm font-black text-white flex items-center gap-2">
                                    <span className="text-[#efff55]">✓</span> Fully Correct
                                  </span>
                                  <p className="text-xs text-zinc-400 leading-relaxed mt-1.5">
                                    Excellent work! Your answer matches the required rubrics and logical constraints perfectly.
                                  </p>
                                </div>
                              );
                            } else {
                              return (
                                <div className="rounded-xl border border-zinc-800 bg-black/25 p-4">
                                  <span className="text-sm font-black text-zinc-300 flex items-center gap-2">
                                    <span className="text-zinc-600">✗</span> Needs Review
                                  </span>
                                  <p className="text-xs text-zinc-500 leading-relaxed mt-1.5">
                                    The submitted answer is either incorrect, incomplete, or did not meet the grading criteria. Review the AI coach notes.
                                  </p>
                                </div>
                              );
                            }
                          })()}
                        </div>

                        {/* 2. Handwriting OCR validation check & warnings */}
                        {results.imageEvalResults?.[currentIndex] && (() => {
                          const evalResult = results.imageEvalResults[currentIndex];
                          if (!evalResult.isReadable) {
                            return (
                              <div className="rounded-xl border border-rose-500/20 bg-rose-500/[0.02] p-4 text-xs">
                                <div className="font-black text-rose-300 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                  ⚠️ LEGIBILITY / IMAGE WARNING
                                </div>
                                <p className="text-rose-400/90 leading-relaxed">
                                  The AI grading engine rejected the uploaded image. The content is blurry, illegible, or unrelated (such as scenery/mountain photos). Please ensure you solve on a clean white page with good lighting.
                                </p>
                              </div>
                            );
                          } else {
                            return (
                              <div className="rounded-xl border border-white/[0.06] bg-white/[0.01] p-4 text-xs text-zinc-400">
                                <div className="font-extrabold text-zinc-300 mb-1 flex items-center gap-1.5 uppercase tracking-wider text-[10px]">
                                  📷 HANDWRITTEN OCR EXTRACTED
                                </div>
                                <p className="leading-relaxed font-mono text-[11px] bg-black/20 p-2 rounded-lg mt-2 overflow-x-auto">
                                  "{evalResult.extractedText}"
                                </p>
                              </div>
                            );
                          }
                        })()}

                        {/* 3. Submitted answer review */}
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1.5">Submitted Answer</span>
                          <div className="text-sm font-mono text-zinc-300 bg-black/45 p-4 rounded-xl border border-white/[0.03] leading-relaxed max-h-48 overflow-y-auto no-scrollbar">
                            {answers[currentIndex]?.value || <span className="italic text-zinc-600">No text answer submitted.</span>}
                          </div>
                        </div>
                      </div>

                      {/* Right: AI Coach Explanation & solution details */}
                      <div className="space-y-5">
                        {/* AI coach insights */}
                        <div>
                          <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-3">AI COACH INSIGHTS & EXPLANATION</span>
                          
                          {(() => {
                            const feedback = results.perQuestionFeedback?.find(e => e.questionIndex === currentIndex);
                            if (!feedback) {
                              return (
                                <p className="text-xs italic text-zinc-600 p-4 bg-white/[0.01] border border-white/[0.03] rounded-xl">
                                  No coach insights available for this question.
                                </p>
                              );
                            }

                            const isCorrect = currentQ?.type === 'mcq'
                              ? answers[currentIndex]?.value === currentQ?.correctAnswer
                              : feedback.correct;

                            return (
                              <div className="space-y-5">
                                {/* Elegant Banner based on correctness */}
                                {isCorrect ? (
                                  <div className="rounded-2xl border border-[#efff55]/20 bg-[#efff55]/[0.02] p-5 shadow-[0_4px_20px_rgba(239,255,85,0.02)]">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="h-5 w-5 rounded-full bg-[#efff55]/10 border border-[#efff55]/20 flex items-center justify-center">
                                        <span className="text-xs font-black text-[#efff55]">✓</span>
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-[#efff55]">
                                        Tutor Commendation
                                      </span>
                                    </div>
                                    <h5 className="text-xs font-extrabold text-white mb-1 uppercase tracking-wide">Excellent Job!</h5>
                                    <p className="text-xs text-zinc-300 leading-relaxed">
                                      {feedback.whatWentWell || "Your response was completely correct, well-structured, and addressed all required evaluation rubric points perfectly."}
                                    </p>
                                  </div>
                                ) : (
                                  <div className="rounded-2xl border border-rose-500/20 bg-rose-500/[0.02] p-5 shadow-[0_4px_20px_rgba(239,68,68,0.02)]">
                                    <div className="flex items-center gap-2 mb-2">
                                      <div className="h-5 w-5 rounded-full bg-rose-500/10 border border-rose-500/20 flex items-center justify-center">
                                        <span className="text-xs font-black text-rose-400">✗</span>
                                      </div>
                                      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
                                        Correction & Guidance
                                      </span>
                                    </div>
                                    <h5 className="text-xs font-extrabold text-white mb-1 uppercase tracking-wide">Concept Correction</h5>
                                    <p className="text-xs text-rose-300/90 leading-relaxed mb-3">
                                      {feedback.improvementTip || "Your response did not fully align with the expected solution or criteria. Check the detailed correction analysis below."}
                                    </p>
                                    <div className="text-[10px] text-zinc-500 font-bold uppercase tracking-wider border-t border-rose-500/10 pt-2.5">
                                      Tip to Improve:
                                      <p className="text-xs font-normal text-zinc-400 leading-relaxed mt-1 normal-case tracking-normal">
                                        Focus on addressing all rubric details precisely. Clear step-by-step reasoning helps ensure accuracy.
                                      </p>
                                    </div>
                                  </div>
                                )}

                                {/* Main Tutor Analysis & Long Explanation */}
                                <div className="rounded-2xl border border-white/[0.04] bg-[#0c0c0c]/90 p-6 space-y-4">
                                  <div className="space-y-2">
                                    <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block">Tutor Analysis & Explanation</span>
                                    <p className="text-sm text-zinc-200 leading-relaxed select-text font-normal">{feedback.explanation}</p>
                                  </div>

                                  {/* Additional guidance/notes if wrong but made attempt */}
                                  {!isCorrect && feedback.whatWentWell && (
                                    <div className="pt-4 border-t border-white/[0.04] space-y-2">
                                      <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block">What You Did Well</span>
                                      <p className="text-xs text-zinc-400 leading-relaxed">{feedback.whatWentWell}</p>
                                    </div>
                                  )}
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* If MCQ, show correct choice comparison */}
                        {currentQ?.type === 'mcq' && (
                          <div className="rounded-xl bg-zinc-900/30 border border-zinc-800 p-4">
                            <span className="text-[9px] font-bold uppercase tracking-widest text-zinc-500 block mb-1">Correct Answer</span>
                            <span className="text-sm font-extrabold text-[#efff55]">{currentQ.correctAnswer}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* ── Bottom sleeker navigator controls ── */}
          <div className="shrink-0 border-t border-white/[0.08] bg-[#0d1117]/95 px-3 py-3 flex items-center justify-between gap-3 sm:px-6 sm:py-4">
            <button
              onClick={goPrev}
              disabled={currentIndex === 0}
              className="flex min-w-0 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-xs font-bold text-zinc-300 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/[0.08] transition duration-200 sm:gap-2 sm:px-5"
            >
              <ChevronLeft className="h-4 w-4" />
              <span className="hidden sm:inline">Previous</span>
              <span className="sm:hidden">Prev</span>
            </button>

            {/* Indicator */}
            <span className="shrink-0 rounded-full border border-white/[0.08] bg-black/20 px-3 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-300">
              Q{currentIndex + 1} / {questions.length}
            </span>

            <button
              onClick={goNext}
              disabled={currentIndex === questions.length - 1}
              className="flex min-w-0 items-center gap-1.5 rounded-xl border border-white/[0.08] bg-white/[0.03] px-3 py-3 text-xs font-bold text-zinc-300 hover:text-white hover:border-white/20 disabled:opacity-30 disabled:hover:border-white/[0.08] transition duration-200 sm:gap-2 sm:px-5"
            >
              Next
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </main>
      </div>

      {/* ── Mobile navigator drawer ── */}
      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            className="fixed inset-0 z-[1100] bg-black/80 backdrop-blur-sm md:hidden"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setShowMobileNav(false)}
          >
            <motion.div
              className="absolute left-0 top-0 bottom-0 w-72 bg-[#0c0c0c] border-r border-white/[0.06] p-5 flex flex-col shadow-2xl"
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 280, damping: 28 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4 border-b border-white/[0.05] pb-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-zinc-400">Exam Navigator</span>
                <button onClick={() => setShowMobileNav(false)} className="text-zinc-400 hover:text-white p-1 rounded-full"><X className="h-4 w-4" /></button>
              </div>
              <div className="flex-1 overflow-y-auto no-scrollbar">
                <QuestionGrid
                  questions={questions}
                  currentIndex={currentIndex}
                  answers={answers}
                  flaggedQuestions={flaggedQuestions}
                  visitedSet={visitedSet}
                  onSelect={(i) => { goTo(i); setShowMobileNav(false); }}
                  results={results}
                />
              </div>
              
              {results ? (
                <div className="border-t border-white/[0.05] pt-4 space-y-2 mt-4 bg-black/10 p-3 rounded-xl">
                  {[
                    { color: 'border border-[#efff55]/40 bg-[#efff55]/5 text-[#efff55] relative', label: 'Correct Answer', check: true },
                    { color: 'border border-white/[0.08] bg-white/[0.01] text-zinc-500 relative', label: 'Incorrect Answer', cross: true },
                  ].map(({ color, label, check, cross }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`h-6 w-6 rounded-lg shrink-0 flex items-center justify-center text-[8px] font-black ${color}`}>
                        {check ? '✓' : cross ? '✗' : ''}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="border-t border-white/[0.05] pt-4 space-y-2 mt-4 bg-black/10 p-3 rounded-xl">
                  {[
                    { color: 'bg-[#efff55]', label: 'Current Question' },
                    { color: 'border border-white/20 bg-white/[0.03] relative', label: 'Flagged for Review' },
                    { color: 'border border-[#efff55]/20 bg-[#efff55]/5 text-[#efff55]', label: 'Attempted' },
                    { color: 'border border-white/[0.08] bg-white/[0.02] text-zinc-400', label: 'Visited/Read' },
                  ].map(({ color, label }) => (
                    <div key={label} className="flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-sm shrink-0 ${color}`}>
                        {label === 'Flagged for Review' && (
                          <span className="absolute inset-0 m-auto h-1 w-1 rounded-full bg-[#efff55] shadow-[0_0_4px_#efff55]" />
                        )}
                      </span>
                      <span className="text-[9px] font-bold text-zinc-500 uppercase tracking-wider">{label}</span>
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Error toast ── */}
      {submitError && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[1400] flex items-center gap-3 rounded-full border border-rose-500/30 bg-rose-500/10 px-5 py-3.5 text-xs font-bold text-rose-300 shadow-xl backdrop-blur-md uppercase tracking-wider">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-400" />
          <span>{submitError}</span>
          <button onClick={() => setSubmitError('')} className="p-1 hover:text-white transition"><X className="h-3.5 w-3.5" /></button>
        </div>
      )}

      {/* ── Exit modal ── */}
      <AnimatePresence>
        {showExitModal && (
          <motion.div
            className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-[2rem] border border-white/[0.08] bg-[#141414] p-8 shadow-2xl"
              initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 15 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-6 w-6 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Exit Session?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                This test <strong className="text-rose-400 font-extrabold">cannot be resumed or retaken</strong>. Exiting will immediately terminate and abandon your practice slot without saving.
              </p>
              <div className="flex gap-3">
                <button onClick={() => setShowExitModal(false)}
                  className="flex-1 rounded-full border border-white/[0.06] bg-white/[0.02] py-3 text-xs font-bold text-zinc-400 hover:text-white transition duration-200 uppercase tracking-wider">
                  Resume
                </button>
                <button
                  onClick={handleExitPractice}
                  className="flex-[1.4] rounded-full bg-rose-500 py-3 text-xs font-extrabold text-white hover:bg-rose-600 transition duration-200 uppercase tracking-wider shadow-lg">
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
            className="fixed inset-0 z-[1300] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-[2rem] border border-white/[0.08] bg-[#141414] p-8 shadow-2xl"
              initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 15 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            >
              <div className="mb-5 flex h-12 w-12 items-center justify-center rounded-full bg-white/10 border border-white/20">
                <Send className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Finish Test?</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-2">
                You attempted <strong className="text-white font-extrabold">{attemptedCount}</strong> of <strong className="text-white font-extrabold">{questions.length}</strong> questions.
              </p>
              {attemptedCount < questions.length && (
                <p className="text-xs text-amber-400 font-medium mb-4 flex items-center gap-1.5">
                  <AlertTriangle className="h-3.5 w-3.5 text-amber-400 shrink-0" />
                  Warning: {questions.length - attemptedCount} questions remain blank.
                </p>
              )}
              <p className="text-xs text-zinc-600 mb-6 leading-relaxed">Your answers will be locked and graded by the AI grading engine instantly.</p>
              <div className="flex gap-3">
                <button onClick={() => setShowSubmitModal(false)}
                  className="flex-1 rounded-full border border-white/[0.06] bg-white/[0.02] py-3 text-xs font-bold text-zinc-400 hover:text-white transition duration-200 uppercase tracking-wider">
                  Review
                </button>
                <button onClick={() => handleSubmit(false)} disabled={submitting}
                  className="flex-[1.4] flex items-center justify-center gap-2 rounded-full bg-white py-3 text-xs font-extrabold text-black hover:bg-zinc-200 active:scale-95 transition duration-200 uppercase tracking-wider shadow-lg">
                  {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                  Grade Answers
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Focus loss warning modal ── */}
      <AnimatePresence>
        {showWarningModal && (
          <motion.div
            className="fixed inset-0 z-[1500] flex items-center justify-center p-4 bg-black/85 backdrop-blur-md"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <motion.div
              className="w-full max-w-sm rounded-[2rem] border border-rose-500/20 bg-[#121212] p-8 shadow-2xl text-center"
              initial={{ scale: 0.92, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.92, y: 15 }}
              transition={{ type: 'spring', stiffness: 240, damping: 24 }}
            >
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-rose-500/10 border border-rose-500/20">
                <AlertTriangle className="h-7 w-7 text-rose-400" />
              </div>
              <h3 className="text-lg font-bold text-white mb-2 uppercase tracking-wide">Security Alert</h3>
              <p className="text-sm text-zinc-400 leading-relaxed mb-6">
                Switching tabs or minimizing the test page is strictly prohibited. Leaving the window <span className="text-rose-400 font-extrabold">one more time</span> will result in automatic submission.
              </p>
              <button
                onClick={() => setShowWarningModal(false)}
                className="w-full rounded-full bg-rose-500 py-3 text-xs font-extrabold text-white hover:bg-rose-600 transition duration-300 uppercase tracking-wider"
              >
                Return to Test
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Lockout submitting overlay ── */}
      <AnimatePresence>
        {lockoutSubmit && (
          <motion.div
            className="fixed inset-0 z-[1600] flex flex-col items-center justify-center gap-4 bg-black/95 backdrop-blur-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          >
            <AlertTriangle className="h-12 w-12 text-rose-500 animate-bounce" />
            <h2 className="text-2xl font-black text-white uppercase tracking-wider">Test Terminated</h2>
            <p className="text-zinc-400 text-sm max-w-md text-center px-6 leading-relaxed">
              You violated the tab-switching security policy. The session is closed and your answers are auto-submitting.
            </p>
            <Loader2 className="h-6 w-6 animate-spin text-white mt-3" />
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Submitting overlay ── */}
      <AnimatePresence>
        {submitting && !lockoutSubmit && (
          <motion.div
            className="fixed inset-0 z-[1400] flex flex-col items-center justify-center gap-4 bg-black/90 backdrop-blur-xl"
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          >
            <Loader2 className="h-10 w-10 animate-spin text-white" />
            <p className="text-white font-extrabold text-lg uppercase tracking-wider">Grading Practice Sheet...</p>
            <p className="text-zinc-500 text-sm">AI Coach is reviewing your responses and compiling feedback</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
