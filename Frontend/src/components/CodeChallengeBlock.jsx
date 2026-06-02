import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Lightbulb, CheckCircle2, XCircle, ChevronRight, Check, HelpCircle, RotateCcw } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const CodeChallengeBlock = ({ challenge }) => {
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [showHint, setShowHint] = useState(false);
  
  // MCQ specific state
  const [selectedOption, setSelectedOption] = useState(null);

  if (!challenge) return null;

  const isMcq = challenge.type === 'mcq';

  if (isMcq) {
    const options = challenge.options || [];
    const expected = (challenge.expectedAnswer || '').trim();
    const isAnswered = selectedOption !== null;

    const handleOptionSelect = (option) => {
      if (isAnswered) return;
      setSelectedOption(option);
      if (option.trim() === expected) {
        setStatus('success');
      } else {
        setStatus('error');
      }
    };

    const handleReset = () => {
      setSelectedOption(null);
      setStatus('idle');
      setShowHint(false);
    };

    return (
      <div className="my-6 overflow-hidden rounded-3xl border border-white/10 bg-[#141414] shadow-[0_20px_50px_rgba(0,0,0,0.35)] pdf-no-break">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02] px-5 py-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#efff55]/10 text-[#efff55]">
              <HelpCircle className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-400">
              Concept Checkpoint
            </span>
          </div>
          {challenge.hint && (
            <button
              onClick={() => setShowHint(!showHint)}
              className="flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.02] px-3 py-1.5 text-[11px] font-bold text-zinc-400 hover:border-white/20 hover:text-white transition duration-200"
            >
              <Lightbulb className="h-3.5 w-3.5" />
              {showHint ? 'Hide Hint' : 'Hint'}
            </button>
          )}
        </div>

        {/* Body */}
        <div className="p-5 md:p-6">
          {/* Question */}
          <h3 className="text-lg font-black text-white leading-snug">
            <MarkdownRenderer content={challenge.question || ''} />
          </h3>

          {/* Hint */}
          <AnimatePresence>
            {showHint && challenge.hint && (
              <motion.div
                initial={{ height: 0, opacity: 0, marginTop: 0 }}
                animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
                exit={{ height: 0, opacity: 0, marginTop: 0 }}
                className="overflow-hidden rounded-2xl border border-[#FF9F1C]/20 bg-[#FF9F1C]/5 px-4 py-3 text-xs leading-relaxed text-[#ffd08a]"
              >
                <div className="flex items-start gap-2.5">
                  <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-[#FF9F1C]" />
                  <p className="font-semibold">{challenge.hint}</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Options Grid */}
          <div className="mt-6 grid gap-3">
            {options.map((option, idx) => {
              const isSelected = selectedOption === option;
              const isCorrectOption = option.trim() === expected;
              
              let optionStyle = 'border-white/10 bg-white/[0.02] text-zinc-300 hover:bg-white/[0.05] hover:border-white/20 hover:text-white';
              let icon = null;

              if (isAnswered) {
                if (isSelected) {
                  if (isCorrectOption) {
                    optionStyle = 'border-emerald-500/40 bg-emerald-500/10 text-emerald-300 shadow-[0_0_20px_rgba(16,185,129,0.05)]';
                    icon = <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-400" />;
                  } else {
                    optionStyle = 'border-rose-500/40 bg-rose-500/10 text-rose-300';
                    icon = <XCircle className="h-5 w-5 shrink-0 text-rose-400" />;
                  }
                } else if (isCorrectOption) {
                  // Reveal the correct option if user got it wrong
                  optionStyle = 'border-emerald-500/25 bg-emerald-500/5 text-emerald-400/90';
                  icon = <Check className="h-4 w-4 shrink-0 text-emerald-500" />;
                } else {
                  optionStyle = 'border-white/[0.04] bg-white/[0.005] text-zinc-600 cursor-not-allowed';
                }
              }

              return (
                <button
                  key={idx}
                  onClick={() => handleOptionSelect(option)}
                  disabled={isAnswered}
                  className={`flex w-full items-center justify-between gap-4 rounded-2xl border p-4 text-left text-sm font-black transition duration-200 ${optionStyle}`}
                >
                  <span className="flex items-start gap-3">
                    <span className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-black border ${
                      isAnswered
                        ? isCorrectOption
                          ? 'border-emerald-500 bg-emerald-500 text-black'
                          : isSelected
                            ? 'border-rose-500 bg-rose-500 text-black'
                            : 'border-white/10 text-zinc-600'
                        : 'border-white/20 text-zinc-500'
                    }`}>
                      {String.fromCharCode(65 + idx)}
                    </span>
                    <span className="leading-snug">{option}</span>
                  </span>
                  {icon}
                </button>
              );
            })}
          </div>

          {/* Answer Feedback & Explanation */}
          <AnimatePresence>
            {isAnswered && (
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 15 }}
                className="mt-6 border-t border-white/[0.06] pt-6"
              >
                <div className={`rounded-2xl border p-5 ${
                  status === 'success'
                    ? 'border-emerald-500/10 bg-emerald-500/[0.02] text-zinc-300'
                    : 'border-zinc-800 bg-white/[0.01] text-zinc-300'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className={`text-xs font-black uppercase tracking-wider ${
                      status === 'success' ? 'text-emerald-400' : 'text-zinc-400'
                    }`}>
                      {status === 'success' ? '🎉 Correct Answer!' : '💡 Concept Review'}
                    </span>
                  </div>

                  {challenge.explanation && (
                    <div className="text-sm leading-relaxed text-zinc-400">
                      <MarkdownRenderer content={challenge.explanation} />
                    </div>
                  )}

                  <button
                    onClick={handleReset}
                    className="mt-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-xs font-bold text-zinc-300 hover:bg-white hover:text-black hover:border-transparent transition duration-200"
                  >
                    <RotateCcw className="h-3.5 w-3.5" />
                    Reset & Try Again
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    );
  }

  // Original Coding Challenge logic
  if (!challenge.codeTemplate) return null;

  const isFillInBlank = challenge.type === 'fill-in-the-blank';
  const expected = (challenge.expectedAnswer || '').trim();

  const handleCheck = () => {
    if (!userInput.trim()) return;
    
    if (userInput.trim() === expected) {
      setStatus('success');
    } else {
      setStatus('error');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      handleCheck();
    }
  };

  return (
    <div className="my-6 overflow-hidden rounded-2xl border border-white/10 bg-slate-900 shadow-sm pdf-no-break">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-slate-800 bg-slate-950 px-4 py-3">
        <div className="flex items-center gap-2">
          <Terminal className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-bold uppercase tracking-wider text-slate-300">
            {isFillInBlank ? 'Fill in the Blank' : 'Guess the Output'}
          </span>
        </div>
        {challenge.hint && (
          <button
            onClick={() => setShowHint(!showHint)}
            className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
          >
            <Lightbulb className="h-3.5 w-3.5" />
            {showHint ? 'Hide Hint' : 'Hint'}
          </button>
        )}
      </div>

      {/* Body */}
      <div className="p-4 sm:p-5">
        {/* Question */}
        <p className="mb-4 text-sm text-slate-300">
          <MarkdownRenderer content={challenge.question || ''} />
        </p>

        {/* Code Snippet */}
        <div className="relative mb-5 rounded-xl bg-[#0f111a] p-4 font-mono text-sm text-slate-300">
          <pre className="whitespace-pre-wrap leading-relaxed">
            {challenge.codeTemplate.split('___').map((part, i, arr) => (
              <React.Fragment key={i}>
                {part}
                {i < arr.length - 1 && (
                  <span className="mx-1 inline-block min-w-[3ch] border-b-2 border-dashed border-emerald-500/50 bg-emerald-500/10 px-1 text-emerald-300">
                    {status === 'success' ? expected : (isFillInBlank ? '___' : '')}
                  </span>
                )}
              </React.Fragment>
            ))}
          </pre>
        </div>

        {/* Hint */}
        <AnimatePresence>
          {showHint && challenge.hint && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="mb-5 overflow-hidden rounded-xl border border-amber-500/20 bg-amber-500/10 px-4 py-3 text-sm text-amber-200/90"
            >
              <div className="flex items-start gap-2">
                <Lightbulb className="mt-0.5 h-4 w-4 shrink-0 text-amber-400" />
                <p>{challenge.hint}</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Input & Action */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <ChevronRight className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-500" />
            <input
              type="text"
              value={userInput}
              onChange={(e) => {
                setUserInput(e.target.value);
                setStatus('idle');
              }}
              onKeyDown={handleKeyDown}
              disabled={status === 'success'}
              placeholder={isFillInBlank ? "Type the missing code..." : "Type the expected output..."}
              className={`w-full rounded-xl border bg-slate-950 py-2.5 pl-9 pr-4 text-sm text-white placeholder-slate-600 outline-none transition focus:ring-2 ${
                status === 'error'
                  ? 'border-red-500/50 focus:border-red-500 focus:ring-red-500/20'
                  : status === 'success'
                  ? 'border-emerald-500/50 bg-emerald-500/5 text-emerald-300'
                  : 'border-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20'
              }`}
            />
          </div>
          
          <button
            onClick={handleCheck}
            disabled={!userInput.trim() || status === 'success'}
            className={`flex items-center justify-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition ${
              status === 'success'
                ? 'bg-emerald-500 text-slate-900'
                : 'bg-white text-slate-900 hover:bg-slate-200 active:scale-95 disabled:opacity-50 disabled:active:scale-100'
            }`}
          >
            {status === 'success' ? (
              <>
                <Check className="h-4 w-4" /> Correct
              </>
            ) : (
              'Check Answer'
            )}
          </button>
        </div>

        {/* Error Feedback */}
        <AnimatePresence>
          {status === 'error' && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-3 flex items-center gap-2 text-sm font-medium text-red-400"
            >
              <XCircle className="h-4 w-4" />
              Not quite right. Try again or check the hint.
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default CodeChallengeBlock;
