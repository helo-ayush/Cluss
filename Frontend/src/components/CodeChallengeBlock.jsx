import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Terminal, Lightbulb, CheckCircle2, XCircle, ChevronRight, Check } from 'lucide-react';
import MarkdownRenderer from './MarkdownRenderer';

const CodeChallengeBlock = ({ challenge }) => {
  const [userInput, setUserInput] = useState('');
  const [status, setStatus] = useState('idle'); // 'idle', 'success', 'error'
  const [showHint, setShowHint] = useState(false);

  if (!challenge || !challenge.codeTemplate) return null;

  const isFillInBlank = challenge.type === 'fill-in-the-blank';
  const expected = (challenge.expectedAnswer || '').trim();

  // For fill in the blank, we can split the template by '___' and render an input in the middle
  // Or just provide an input field below. Let's do a stylish input field below the code.
  
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
    <div className="my-6 overflow-hidden rounded-2xl border border-slate-200 bg-slate-900 shadow-sm">
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
