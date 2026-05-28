import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  BookOpen,
  CheckCircle2,
  CheckSquare,
  ChevronLeft,
  ChevronRight,
  Clock,
  Code2,
  FileText,
  Image as ImageIcon,
  Loader2,
  PenLine,
  Send,
  Sparkles,
  Timer,
  X,
} from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const answerLetters = ['A', 'B', 'C', 'D', 'E', 'F'];

function getQuestionFeedback(results, index) {
  const feedback = results?.perQuestionFeedback || [];
  const exact = feedback.find(item => Number(item.questionIndex) === index);
  if (exact) return exact;

  const hasZeroBased = feedback.some(item => Number(item.questionIndex) === 0);
  if (!hasZeroBased) {
    return feedback.find(item => Number(item.questionIndex) === index + 1);
  }

  return null;
}

function ModernQuestionRail({ questions, currentIndex, answers, flaggedQuestions, visitedSet, submitted, results, onSelect }) {
  return (
    <aside className="hidden w-[128px] shrink-0 border-r border-white/[0.08] bg-[#151515]/88 px-4 backdrop-blur-xl lg:flex lg:flex-col">
      <div className="min-h-0 flex-1 snap-y snap-mandatory space-y-3 overflow-y-auto py-5 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {questions.map((q, index) => {
          const isActive = index === currentIndex;
          const isAnswered = !!(answers[index]?.value || answers[index]?.imageBase64);
          const isFlagged = flaggedQuestions.has(index);
          const isVisited = visitedSet.has(index);
          const itemFeedback = getQuestionFeedback(results, index);
          const isCorrect = submitted
            ? q.type === 'mcq'
              ? answers[index]?.value === q.correctAnswer
              : itemFeedback?.correct
            : null;
          const statusLabel = submitted
            ? isCorrect
              ? 'Correct'
              : isAnswered
                ? 'Wrong'
                : 'Blank'
            : isFlagged
              ? 'Marked'
              : isAnswered
                ? 'Done'
                : isVisited
                  ? 'Seen'
                  : 'Blank';

          const stateClass = isActive
            ? 'border-[#d8ef7a]/70 bg-[#d8ef7a]/12 text-white'
            : submitted
              ? isCorrect
              ? 'border-emerald-300/20 bg-emerald-400/[0.08] text-emerald-100'
              : isAnswered
                ? 'border-rose-300/20 bg-rose-400/[0.08] text-rose-100'
                : 'border-white/[0.08] bg-white/[0.03] text-white/35'
              : isFlagged
                ? 'border-[#efff55]/35 bg-[#efff55]/10 text-[#efff55]'
                : isAnswered
                  ? 'border-white/[0.16] bg-white/[0.07] text-white/85'
                  : isVisited
                    ? 'border-white/[0.10] bg-white/[0.04] text-white/55'
                    : 'border-white/[0.06] bg-[#1b1b1b] text-white/30';

          return (
            <motion.button
              key={index}
              onClick={() => onSelect(index)}
              whileHover={{ y: -2, scale: 1.02 }}
              whileTap={{ scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 420, damping: 28 }}
              className={`relative flex h-[74px] w-full snap-start flex-col items-center justify-center gap-1 rounded-[1.15rem] border text-sm font-black transition duration-200 hover:border-[#d8ef7a]/60 hover:text-white ${stateClass}`}
              aria-label={`Open question ${index + 1}`}
            >
              {index + 1}
              <span className="text-[8px] font-black uppercase tracking-[0.12em] opacity-55">{statusLabel}</span>
              <span className={`h-1.5 w-7 rounded-full ${
                submitted
                  ? isCorrect
                    ? 'bg-emerald-300/70'
                    : isAnswered
                      ? 'bg-rose-300/65'
                      : 'bg-white/18'
                  : isFlagged
                    ? 'bg-[#efff55]'
                    : isAnswered
                      ? 'bg-white/60'
                      : 'bg-white/18'
              }`} />
            </motion.button>
          );
        })}
      </div>
    </aside>
  );
}

function ModernMCQ({ question, value, onChange, submitted }) {
  return (
    <div className="grid gap-3">
      {(question.options || []).map((option, index) => {
        const isSelected = value === option;
        const isCorrect = submitted && option === question.correctAnswer;
        const isWrongSelection = submitted && isSelected && !isCorrect;

        const style = submitted
          ? isCorrect
            ? 'border-[#efff55]/65 bg-[#efff55]/10 text-white shadow-[0_0_24px_rgba(239,255,85,0.08)]'
            : isWrongSelection
              ? 'border-rose-400/40 bg-rose-500/10 text-rose-100'
              : 'border-white/[0.06] bg-[#1b1b1b] text-white/32'
          : isSelected
            ? 'border-[#efff55]/70 bg-[#efff55]/12 text-white shadow-[0_0_24px_rgba(239,255,85,0.10)]'
            : 'border-white/[0.09] bg-[#1b1b1b] text-white/78 hover:border-[#efff55]/35 hover:bg-[#242424]';

        return (
          <motion.button
            key={`${option}-${index}`}
            type="button"
            disabled={submitted}
            onClick={() => onChange(option)}
            whileHover={submitted ? undefined : { y: -2, scale: 1.006 }}
            whileTap={submitted ? undefined : { scale: 0.99 }}
            transition={{ type: 'spring', stiffness: 360, damping: 26 }}
            className={`group flex min-h-[68px] w-full items-center gap-4 rounded-[1.25rem] border px-4 py-4 text-left text-sm font-extrabold transition duration-200 ${style}`}
          >
            <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${
              isSelected || isCorrect ? 'bg-[#efff55] text-black' : 'bg-white/[0.07] text-white/55 group-hover:text-white'
            }`}>
              {answerLetters[index] || index + 1}
            </span>
            <span className="min-w-0 flex-1 break-words leading-relaxed">{option}</span>
            {submitted && isCorrect && (
              <span className="rounded-full bg-white/[0.07] px-3 py-1 text-[10px] font-black uppercase tracking-[0.14em] text-[#efff55]">
                Correct
              </span>
            )}
          </motion.button>
        );
      })}
    </div>
  );
}

function ModernWritten({ value, onChange, imageFile, imageEvalResult, onImageUpload, canUploadImage, isPro, isDev, onFilePickerTrigger, submitted }) {
  const fileRef = useRef(null);
  const canUseUpload = canUploadImage && isPro;
  const rejectedImage = submitted && imageEvalResult && imageEvalResult.isReadable === false;
  const acceptedImage = submitted && imageEvalResult?.isReadable;
  const displayValue = rejectedImage && String(value || '').startsWith('[Image upload rejected') ? '' : value;

  return (
    <div className="space-y-4">
      <textarea
        value={displayValue || ''}
        onChange={event => onChange(event.target.value)}
        disabled={submitted}
        rows={9}
        placeholder={submitted ? 'No written answer was submitted.' : 'Write a clear answer here. Use steps, definitions, or reasoning where needed.'}
        className="min-h-[260px] w-full resize-none rounded-[1.35rem] border border-white/[0.10] bg-[#1b1b1b] px-5 py-5 text-sm font-semibold leading-relaxed text-white outline-none transition placeholder:text-white/28 focus:border-[#efff55]/45 focus:bg-[#242424]"
      />

      {rejectedImage && (
        <div className="rounded-[1.2rem] border border-rose-400/30 bg-rose-500/12 px-4 py-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-rose-200">
            <AlertTriangle className="h-4 w-4" />
            Image Rejected
          </div>
          <p className="text-sm font-semibold leading-relaxed text-rose-100/85">
            {imageEvalResult.evaluationNote || imageEvalResult.feedback || 'The uploaded image did not contain a readable answer, so this question was marked wrong.'}
          </p>
          <p className="mt-2 text-xs font-semibold text-white/45">
            Upload a clear photo of handwritten work or type the answer directly.
          </p>
        </div>
      )}

      {acceptedImage && (
        <div className="rounded-[1.2rem] border border-[#efff55]/25 bg-[#efff55]/10 px-4 py-4">
          <div className="mb-2 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-[#efff55]">
            <CheckCircle2 className="h-4 w-4" />
            Image Read
          </div>
          <p className="text-xs font-mono leading-relaxed text-white/68">
            {imageEvalResult.extractedText || 'The handwritten answer was read and graded.'}
          </p>
        </div>
      )}

      {canUseUpload && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={event => onImageUpload(event.target.files?.[0])}
          />
          {imageFile ? (
            <div className="flex items-center gap-3 rounded-[1.15rem] border border-[#efff55]/25 bg-[#efff55]/10 px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-[#efff55]" />
              <span className="min-w-0 flex-1 truncate text-xs font-extrabold text-white/80">{imageFile.name}</span>
              {!submitted && (
                <button onClick={() => onImageUpload(null)} className="rounded-full p-1 text-white/45 transition hover:bg-white/[0.06] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
          ) : !submitted ? (
            <motion.button
              type="button"
              onClick={() => {
                onFilePickerTrigger?.();
                fileRef.current?.click();
              }}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex w-full items-center justify-center gap-2 rounded-[1.15rem] border border-dashed border-white/[0.14] bg-[#1b1b1b] px-4 py-4 text-xs font-black text-white/55 transition hover:border-[#efff55]/45 hover:text-white"
            >
              <ImageIcon className="h-4 w-4" />
              Upload handwritten work
              {isDev && !isPro && (
                <span className="rounded-full border border-[#efff55]/30 bg-[#efff55]/10 px-2 py-0.5 text-[9px] text-[#efff55]">
                  Dev
                </span>
              )}
            </motion.button>
          ) : null}
        </div>
      )}
    </div>
  );
}

function ModernCode({ question, value, onChange, submitted }) {
  return (
    <div className="space-y-4">
      {question.starterCode && (
        <div className="rounded-[1.2rem] border border-white/[0.10] bg-[#1b1b1b] p-4">
          <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/42">
            <Code2 className="h-3.5 w-3.5" />
            Starter Code
          </div>
          <pre className="overflow-x-auto whitespace-pre-wrap break-words text-xs leading-relaxed text-white/70">{question.starterCode}</pre>
        </div>
      )}
      <textarea
        value={value || ''}
        onChange={event => onChange(event.target.value)}
        disabled={submitted}
        rows={14}
        spellCheck={false}
        placeholder={submitted ? 'No code answer was submitted.' : 'Write your solution here.'}
        className="min-h-[320px] w-full resize-none rounded-[1.35rem] border border-white/[0.10] bg-[#1b1b1b] px-5 py-5 font-mono text-sm leading-relaxed text-white outline-none transition placeholder:text-white/28 focus:border-[#efff55]/45 focus:bg-[#242424]"
      />
    </div>
  );
}

function ModernModal({ type, questions, attemptedCount, submitting, onClose, onConfirm }) {
  const isExit = type === 'exit';
  return (
    <motion.div
      className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/78 p-4 backdrop-blur-xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <motion.div
        className="w-full max-w-md rounded-[1.75rem] border border-white/[0.10] bg-[#202020] p-7 shadow-2xl"
        initial={{ y: 16, scale: 0.96 }}
        animate={{ y: 0, scale: 1 }}
        exit={{ y: 16, scale: 0.96 }}
      >
        <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-2xl ${
          isExit ? 'bg-rose-500/12 text-rose-300' : 'bg-[#efff55]/12 text-[#efff55]'
        }`}>
          {isExit ? <AlertTriangle className="h-6 w-6" /> : <Send className="h-5 w-5" />}
        </div>
        <h3 className="mb-2 text-xl font-black text-white">{isExit ? 'Exit practice?' : 'Submit test?'}</h3>
        <p className="mb-6 text-sm font-semibold leading-relaxed text-white/52">
          {isExit
            ? 'Leaving will clear this practice slot and your current answers will not be saved.'
            : `You attempted ${attemptedCount} of ${questions.length} questions. Your answers will be locked for review.`}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-full border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-white/70 transition hover:bg-white/[0.08] hover:text-white"
          >
            {isExit ? 'Stay' : 'Review'}
          </button>
          <button
            onClick={onConfirm}
            disabled={submitting}
            className={`flex-[1.3] rounded-full px-4 py-3 text-xs font-black uppercase tracking-[0.12em] transition ${
              isExit ? 'bg-rose-500 text-white hover:bg-rose-400' : 'bg-[#efff55] text-black hover:bg-white'
            } disabled:opacity-60`}
          >
            {submitting ? 'Working...' : isExit ? 'Exit' : 'Submit'}
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function GuidedPracticeModernLayout({
  questions,
  currentIndex,
  currentQ,
  displayQuestion,
  answers,
  flaggedQuestions,
  visitedSet,
  attemptedCount,
  submitted,
  results,
  subtopic,
  submitting,
  submitError,
  showExitModal,
  showSubmitModal,
  showWarningModal,
  lockoutSubmit,
  showMobileNav,
  initialSeconds,
  timeRemaining,
  isTimeLow,
  isPro,
  isDev,
  updateAnswer,
  handleImageUpload,
  goTo,
  goPrev,
  goNext,
  setShowExitModal,
  setShowSubmitModal,
  setShowWarningModal,
  setShowMobileNav,
  setSubmitError,
  handleSubmit,
  handleExitPractice,
  onFilePickerTrigger,
  formatTime,
}) {
  const questionTypeIcon = currentQ?.type === 'code'
    ? <Code2 className="h-4 w-4" />
    : currentQ?.type === 'written' || currentQ?.type === 'math'
      ? <PenLine className="h-4 w-4" />
      : <CheckSquare className="h-4 w-4" />;

  const score = results?.feedback?.score ?? 0;
  const summary = results?.feedback?.summary;
  const submitSteps = ['Reading your answers', 'Checking uploaded work', 'Calculating score', 'Preparing coach review'];
  const [submitStepIndex, setSubmitStepIndex] = useState(0);

  useEffect(() => {
    if (!submitting || submitted) {
      setSubmitStepIndex(0);
      return undefined;
    }

    const intervalId = window.setInterval(() => {
      setSubmitStepIndex(previous => (previous + 1) % submitSteps.length);
    }, 1500);

    return () => window.clearInterval(intervalId);
  }, [submitting, submitted, submitSteps.length]);

  return (
    <div className="relative flex h-dvh overflow-hidden bg-[#202020] text-white" style={{ fontFamily: "'Nunito', system-ui, sans-serif" }}>
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_32%_0%,rgba(239,255,85,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.04),transparent_36%)]" />

      <ModernQuestionRail
        questions={questions}
        currentIndex={currentIndex}
        answers={answers}
        flaggedQuestions={flaggedQuestions}
        visitedSet={visitedSet}
        submitted={submitted}
        results={results}
        onSelect={goTo}
      />

      <div className="relative z-10 flex min-w-0 flex-1 flex-col">
        <header className="absolute inset-x-0 top-0 z-40 flex min-h-20 shrink-0 items-center justify-between gap-4 border-b border-white/[0.08] bg-[#202020]/50 px-4 py-3 shadow-[0_18px_42px_rgba(0,0,0,0.20)] backdrop-blur-2xl sm:px-6">
          <div className="flex min-w-0 items-center gap-3">
            <motion.button
              onClick={submitted ? handleExitPractice : () => setShowExitModal(true)}
              whileHover={{ scale: 1.06, rotate: 3 }}
              whileTap={{ scale: 0.94 }}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-white/[0.10] bg-white/[0.04] text-white/55 transition hover:bg-white/[0.08] hover:text-white"
              aria-label="Close practice"
            >
              <X className="h-4.5 w-4.5" />
            </motion.button>
            <div className="min-w-0">
              <p className="truncate text-base font-black text-white sm:text-lg">{subtopic?.subtopic_title || 'Guided Practice'}</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            {!submitted && initialSeconds !== null && timeRemaining !== null && (
              <div className={`hidden items-center gap-2 rounded-full border px-4 py-2 text-xs font-black tabular-nums sm:flex ${
                isTimeLow ? 'border-rose-400/40 bg-rose-500/10 text-rose-200' : 'border-white/[0.10] bg-white/[0.04] text-white/75'
              }`}>
                <Clock className="h-4 w-4" />
                {formatTime(timeRemaining)}
              </div>
            )}
            {!submitted && (
              <motion.button
                onClick={() => setShowMobileNav(true)}
                whileHover={{ y: -1 }}
                whileTap={{ scale: 0.96 }}
                className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.04] px-3 py-2 text-xs font-black text-white/65 transition hover:text-white lg:hidden"
              >
                <CheckSquare className="h-4 w-4" />
                {attemptedCount}/{questions.length}
              </motion.button>
            )}
            <motion.button
              onClick={submitted ? handleExitPractice : () => setShowSubmitModal(true)}
              disabled={submitting}
              whileHover={submitting ? undefined : { y: -2, scale: 1.02 }}
              whileTap={submitting ? undefined : { scale: 0.97 }}
              className="flex items-center gap-2 rounded-full bg-white px-4 py-2.5 text-xs font-black text-black transition hover:bg-[#efff55] disabled:opacity-60 sm:px-6"
            >
              {submitted ? <BookOpen className="h-4 w-4" /> : submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="hidden sm:inline">{submitted ? 'Done Review' : 'Submit Test'}</span>
              <span className="sm:hidden">{submitted ? 'Done' : 'Submit'}</span>
            </motion.button>
          </div>
        </header>

        <main className="min-h-0 flex-1 overflow-hidden bg-[#202020] px-4 py-5 sm:px-6 lg:px-8 xl:px-10">
          <div className="mx-auto grid h-full max-w-[1440px] gap-5 xl:grid-cols-[minmax(0,1fr)_360px]">
            <div className="min-h-0 overflow-y-auto pb-24 pt-24 pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <motion.section
                className="overflow-hidden rounded-[2rem] border border-white/[0.10] bg-[#202020] shadow-[0_16px_42px_rgba(0,0,0,0.18)]"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.28, ease: 'easeOut' }}
              >
              <div className="p-5 sm:p-7 lg:p-8">
                <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
                  <div className="flex items-center gap-2 rounded-full border border-white/[0.10] bg-white/[0.05] px-3.5 py-2 text-[10px] font-black uppercase tracking-[0.18em] text-white/60">
                    {questionTypeIcon}
                    Question {currentIndex + 1} of {questions.length} · {currentQ?.type?.toUpperCase()}
                  </div>
                </div>

                <motion.div
                  key={currentIndex}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.22 }}
                  className="mb-5 rounded-[1.6rem] border border-white/[0.12] bg-[#1b1b1b] p-5 sm:p-6 lg:p-7"
                >
                  <div className="mb-4 flex items-center gap-2">
                    <span className="h-2.5 w-2.5 rounded-full bg-[#efff55] shadow-[0_0_18px_rgba(239,255,85,0.8)]" />
                    <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/42">Question Prompt</span>
                  </div>
                  <MarkdownRenderer
                    content={displayQuestion}
                    className="text-[1.35rem] font-black leading-snug text-white sm:text-[1.6rem] [&_p]:!mb-0 [&_p]:!text-white [&_p]:!leading-snug [&_h1]:!mt-0 [&_h1]:!text-2xl [&_h2]:!mt-0 [&_h2]:!text-xl [&_code]:!rounded-md [&_code]:!bg-white/[0.08] [&_code]:!px-1.5 [&_code]:!py-0.5 [&_code]:!text-[#efff55]"
                  />
                </motion.div>

                <motion.div
                  key={`answer-${currentIndex}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: 0.03 }}
                  className="rounded-[1.6rem] border border-white/[0.08] bg-[#191919] p-4 sm:p-5 lg:p-6"
                >
                  <div className="mb-5 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-[#efff55]" />
                      <span className="text-[10px] font-black uppercase tracking-[0.24em] text-white/45">Answer</span>
                    </div>
                    <span className="rounded-full bg-white/[0.05] px-3 py-1.5 text-[10px] font-black text-white/40">
                      {answers[currentIndex]?.value || answers[currentIndex]?.imageBase64 ? 'In progress' : 'Blank'}
                    </span>
                  </div>

                  {currentQ?.type === 'mcq' && (
                    <ModernMCQ
                      question={currentQ}
                      value={answers[currentIndex]?.value || ''}
                      onChange={value => updateAnswer(currentIndex, 'value', value)}
                      submitted={submitted}
                    />
                  )}
                  {(currentQ?.type === 'written' || currentQ?.type === 'math') && (
                    <ModernWritten
                      value={answers[currentIndex]?.value || ''}
                      onChange={value => updateAnswer(currentIndex, 'value', value)}
                      imageFile={answers[currentIndex]?.imageFile}
                      imageEvalResult={results?.imageEvalResults?.[currentIndex] || results?.imageEvalResults?.[String(currentIndex)]}
                      onImageUpload={file => handleImageUpload(currentIndex, file)}
                      canUploadImage={!!currentQ?.imageUpload && isPro}
                      isPro={isPro}
                      isDev={isDev}
                      onFilePickerTrigger={onFilePickerTrigger}
                      submitted={submitted}
                    />
                  )}
                  {currentQ?.type === 'code' && (
                    <ModernCode
                      question={currentQ}
                      value={answers[currentIndex]?.value || ''}
                      onChange={value => updateAnswer(currentIndex, 'value', value)}
                      submitted={submitted}
                    />
                  )}
                </motion.div>

                {submitted && getQuestionFeedback(results, currentIndex) && (
                  <div className="mt-5 rounded-[1.6rem] border border-white/[0.10] bg-[#1b1b1b] p-5">
                    <div className="mb-3 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.20em] text-[#efff55]">
                      <Sparkles className="h-4 w-4" />
                      Coach Review
                    </div>
                    <p className="text-sm font-semibold leading-relaxed text-white/72">
                      {getQuestionFeedback(results, currentIndex)?.explanation}
                    </p>
                  </div>
                )}
              </div>
            </motion.section>
            </div>

            <aside className="hidden h-full space-y-5 overflow-y-auto pb-24 pt-24 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden xl:block">
              <div className="rounded-[1.75rem] border border-white/[0.10] bg-[#202020] p-5 shadow-[0_14px_34px_rgba(0,0,0,0.16)]">
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.20em] text-white/42">
                  <Timer className="h-4 w-4" />
                  Session
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-white/[0.06] bg-[#242424] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">Attempted</p>
                    <p className="mt-2 text-2xl font-black text-white">{attemptedCount}<span className="text-sm text-white/34">/{questions.length}</span></p>
                  </div>
                  <div className="rounded-2xl border border-white/[0.06] bg-[#242424] p-4">
                    <p className="text-[10px] font-black uppercase tracking-[0.16em] text-white/34">{submitted ? 'Score' : 'Time'}</p>
                    <p className={`mt-2 text-2xl font-black ${isTimeLow && !submitted ? 'text-rose-200' : 'text-white'}`}>
                      {submitted ? score : initialSeconds !== null && timeRemaining !== null ? formatTime(timeRemaining) : '∞'}
                    </p>
                  </div>
                </div>
                {summary && <p className="mt-4 text-xs font-semibold leading-relaxed text-white/50">{summary}</p>}
              </div>

              <div className="hidden rounded-[1.75rem] border border-white/[0.10] bg-[#202020] p-5 lg:block">
                <div className="mb-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.20em] text-white/42">
                  <FileText className="h-4 w-4" />
                  Questions
                </div>
                <div className="grid grid-cols-5 gap-2 xl:grid-cols-6">
                  {questions.map((question, index) => {
                    const active = currentIndex === index;
                    const answered = !!(answers[index]?.value || answers[index]?.imageBase64);
                    return (
                      <button
                        key={`mini-${index}`}
                        onClick={() => goTo(index)}
                        className={`aspect-square rounded-xl border text-xs font-black transition ${
                          active
                            ? 'border-[#efff55] bg-[#efff55] text-black'
                            : answered
                              ? 'border-white/[0.16] bg-[#282828] text-white/80'
                              : 'border-white/[0.08] bg-[#242424] text-white/45 hover:border-[#efff55]/40 hover:bg-[#282828]'
                        }`}
                      >
                        {index + 1}
                      </button>
                    );
                  })}
                </div>
              </div>
            </aside>
          </div>
        </main>

        <footer className="absolute inset-x-0 bottom-0 z-40 flex shrink-0 items-center justify-between gap-3 border-t border-white/[0.08] bg-[#202020]/78 px-4 py-3 backdrop-blur-2xl sm:px-6">
          <motion.button
            onClick={goPrev}
            disabled={currentIndex === 0}
            whileHover={currentIndex === 0 ? undefined : { x: -2 }}
            whileTap={currentIndex === 0 ? undefined : { scale: 0.97 }}
            className="flex items-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-xs font-black text-white/65 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-35"
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </motion.button>
          <span className="rounded-full border border-white/[0.10] bg-[#1b1b1b] px-4 py-2 text-xs font-black text-white/65">
            Q{currentIndex + 1} / {questions.length}
          </span>
          <motion.button
            onClick={goNext}
            disabled={currentIndex === questions.length - 1}
            whileHover={currentIndex === questions.length - 1 ? undefined : { x: 2 }}
            whileTap={currentIndex === questions.length - 1 ? undefined : { scale: 0.97 }}
            className="flex items-center gap-2 rounded-2xl border border-white/[0.10] bg-white/[0.04] px-4 py-3 text-xs font-black text-white/65 transition hover:bg-white/[0.08] hover:text-white disabled:opacity-35"
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </motion.button>
        </footer>
      </div>

      <AnimatePresence>
        {showMobileNav && (
          <motion.div
            className="fixed inset-0 z-[1200] bg-black/78 backdrop-blur-xl lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMobileNav(false)}
          >
            <motion.div
              className="absolute bottom-0 left-0 right-0 rounded-t-[2rem] border-t border-white/[0.10] bg-[#202020] p-5"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              onClick={event => event.stopPropagation()}
            >
              <div className="mb-4 flex items-center justify-between">
                <span className="text-xs font-black uppercase tracking-[0.20em] text-white/55">Questions</span>
                <button onClick={() => setShowMobileNav(false)} className="rounded-full p-2 text-white/45 hover:bg-white/[0.06] hover:text-white">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-6 gap-2">
                {questions.map((_, index) => (
                  <button
                    key={`mobile-${index}`}
                    onClick={() => {
                      goTo(index);
                      setShowMobileNav(false);
                    }}
                    className={`aspect-square rounded-xl border text-sm font-black ${
                      currentIndex === index ? 'border-[#efff55] bg-[#efff55] text-black' : 'border-white/[0.10] bg-[#1b1b1b] text-white/55'
                    }`}
                  >
                    {index + 1}
                  </button>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {submitError && (
        <div className="fixed bottom-24 left-1/2 z-[1400] flex max-w-[90vw] -translate-x-1/2 items-center gap-3 rounded-full border border-rose-400/30 bg-rose-500/12 px-5 py-3 text-xs font-black text-rose-100 backdrop-blur-xl">
          <AlertTriangle className="h-4 w-4" />
          <span className="truncate">{submitError}</span>
          <button onClick={() => setSubmitError('')} className="rounded-full p-1 hover:bg-white/[0.08]">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <AnimatePresence>
        {showExitModal && (
          <ModernModal
            type="exit"
            questions={questions}
            attemptedCount={attemptedCount}
            submitting={submitting}
            onClose={() => setShowExitModal(false)}
            onConfirm={handleExitPractice}
          />
        )}
        {showSubmitModal && (
          <ModernModal
            type="submit"
            questions={questions}
            attemptedCount={attemptedCount}
            submitting={submitting}
            onClose={() => setShowSubmitModal(false)}
            onConfirm={() => handleSubmit(false)}
          />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWarningModal && (
          <motion.div className="fixed inset-0 z-[1500] flex items-center justify-center bg-[#1b1b1b]/46 p-6 text-center backdrop-blur-md" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
            <motion.div
              className="w-full max-w-md rounded-[2rem] border border-white/[0.12] bg-[#202020]/92 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#efff55] text-black shadow-[0_0_34px_rgba(239,255,85,0.24)]">
                <AlertTriangle className="h-7 w-7" />
              </div>
              <h3 className="mb-2 text-xl font-black text-white">Security alert</h3>
              <p className="mb-6 text-sm font-semibold leading-relaxed text-white/52">Leaving this test window again will submit the test automatically.</p>
              <button onClick={() => setShowWarningModal(false)} className="w-full rounded-full bg-[#efff55] px-4 py-3 text-xs font-black uppercase tracking-[0.12em] text-black transition hover:bg-white">
                Return to test
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {submitting && !submitted && (
          <motion.div
            className="pointer-events-none fixed inset-0 z-[1600] flex items-center justify-center bg-[#1b1b1b]/46 p-6 text-center backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div
              className="pointer-events-auto w-full max-w-md rounded-[2rem] border border-white/[0.12] bg-[#202020]/92 p-7 shadow-[0_30px_90px_rgba(0,0,0,0.55)]"
              initial={{ scale: 0.96, y: 12 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 12 }}
            >
              <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-full bg-[#efff55] text-black shadow-[0_0_34px_rgba(239,255,85,0.24)]">
                {lockoutSubmit ? <AlertTriangle className="h-7 w-7" /> : <Loader2 className="h-7 w-7 animate-spin" />}
              </div>
              <h2 className="text-xl font-black text-white">{lockoutSubmit ? 'Auto-submitting test' : 'Submitting test'}</h2>
              <p className="mt-2 text-sm font-semibold leading-relaxed text-white/52">
                {lockoutSubmit
                  ? 'The tab-switch policy was triggered. Your visible answers are still being reviewed.'
                  : 'Keep this page open while we finish the review.'}
              </p>
              <div className="mt-6 overflow-hidden rounded-2xl border border-white/[0.08] bg-[#1b1b1b] px-4 py-4 text-left">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={submitStepIndex}
                    className="flex items-center gap-3 text-xs font-black text-white/72"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.22 }}
                  >
                    <span className="h-2 w-2 rounded-full bg-[#efff55] shadow-[0_0_16px_rgba(239,255,85,0.85)]" />
                    {submitSteps[submitStepIndex]}
                  </motion.div>
                </AnimatePresence>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

