import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Network, Sparkles, ArrowRight } from 'lucide-react';

export default function ConceptConnectorWidget() {
  const [revealed, setRevealed] = useState(false);
  const [loading, setLoading] = useState(false);

  const conceptA = "React State";
  const conceptB = "Tailwind Utility Classes";

  const insight = "React state manages the logical data changing over time, while Tailwind manages the static visual representation. When combined, React state can dynamically toggle Tailwind utility classes to create instantaneous, reactive UI transformations (like switching a button from 'bg-blue-500' to 'bg-green-500' when 'isSuccess' becomes true).";

  const handleReveal = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setRevealed(true);
    }, 800); // Simulate AI generation
  };

  const handleNext = () => {
    setRevealed(false);
  };

  return (
    <section className="relative overflow-hidden flex flex-col rounded-[2.4rem] border border-white/10 bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
      {/* Background aesthetics */}
      <div className="absolute -right-32 top-10 h-96 w-96 rounded-full bg-indigo-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute -left-20 bottom-10 h-72 w-72 rounded-full bg-fuchsia-500/[0.04] blur-[100px] pointer-events-none" />

      <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/5 relative z-10">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400">
            <Network className="h-3 w-3" />
            <span>Synapse Connector</span>
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Find the link</h2>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center p-6 md:p-8 relative z-10">
        <div className="relative flex flex-col sm:flex-row items-center gap-4 sm:gap-6 justify-center">
          
          {/* Concept A */}
          <div className="w-full sm:w-1/2 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-md shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Concept A</p>
            <p className="text-lg font-black text-white">{conceptA}</p>
          </div>

          {/* Connector Icon */}
          <div className="shrink-0 rounded-full border border-white/10 bg-black p-3 z-10 relative">
            <ArrowRight className="h-5 w-5 text-zinc-400 rotate-90 sm:rotate-0" />
            
            {/* Connecting lines for aesthetics */}
            <div className="absolute top-1/2 left-1/2 -translate-y-1/2 -translate-x-1/2 w-[200%] h-px bg-linear-to-r from-transparent via-white/20 to-transparent -z-10 hidden sm:block" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-[200%] w-px bg-linear-to-b from-transparent via-white/20 to-transparent -z-10 sm:hidden" />
          </div>

          {/* Concept B */}
          <div className="w-full sm:w-1/2 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-6 text-center backdrop-blur-md shadow-inner">
            <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 mb-2">Concept B</p>
            <p className="text-lg font-black text-white">{conceptB}</p>
          </div>
          
        </div>

        <div className="mt-8 flex justify-center min-h-[120px] items-center">
          <AnimatePresence mode="wait">
            {!revealed && !loading && (
              <motion.div
                key="prompt"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="text-center w-full"
              >
                <p className="text-sm font-bold text-zinc-400 mb-5">How do these two concepts interact or relate to each other?</p>
                <button
                  onClick={handleReveal}
                  className="mx-auto flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-black text-black transition hover:bg-zinc-200 hover:scale-105 active:scale-95"
                >
                  <Sparkles className="h-4 w-4 text-black" />
                  Reveal AI Insight
                </button>
              </motion.div>
            )}

            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex flex-col items-center gap-3"
              >
                <div className="h-8 w-8 rounded-full border-2 border-indigo-500/30 border-t-indigo-500 animate-spin" />
                <p className="text-[10px] font-black uppercase tracking-widest text-indigo-400">Synthesizing...</p>
              </motion.div>
            )}

            {revealed && (
              <motion.div
                key="insight"
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="w-full rounded-[1.5rem] border border-indigo-500/20 bg-indigo-500/[0.05] p-6 backdrop-blur"
              >
                <div className="flex items-start gap-3">
                  <Sparkles className="h-5 w-5 text-indigo-400 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm leading-relaxed text-zinc-200">{insight}</p>
                    <button 
                      onClick={handleNext}
                      className="mt-4 text-xs font-black text-indigo-400 hover:text-indigo-300 transition underline underline-offset-4"
                    >
                      Try another pair
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
