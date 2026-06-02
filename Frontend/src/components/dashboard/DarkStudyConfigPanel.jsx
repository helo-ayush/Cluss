import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, HelpCircle, Code2, Crown, Globe, Lock, Plus, Minus } from 'lucide-react';
import { DEFAULT_STUDY_CONFIG, getPlanConfig, normalizeStudyConfig } from '../../utils/studyConfig';

function Stepper({ value, min = 0, max = 5, disabled, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/40 p-1">
      <button
        type="button"
        disabled={disabled || value <= min}
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-zinc-300 transition duration-200 hover:bg-white/[0.1] active:scale-90 disabled:opacity-20"
      >
        <Minus className="h-3 w-3" />
      </button>
      <span className="w-8 text-center text-xs font-black text-white">{value}</span>
      <button
        type="button"
        disabled={disabled || value >= max}
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-7 w-7 items-center justify-center rounded-full bg-white/[0.04] text-zinc-300 transition duration-200 hover:bg-white/[0.1] active:scale-90 disabled:opacity-20"
      >
        <Plus className="h-3 w-3" />
      </button>
    </div>
  );
}

function ToggleRow({ mark, title, description, enabled, onToggle, locked, planRequired = 'Pro', icon: Icon, children }) {
  return (
    <div
      className={`group relative overflow-hidden rounded-[1.8rem] border p-5 transition-all duration-300 ${
        enabled
          ? 'border-[#cfff50]/30 bg-gradient-to-b from-[#cfff50]/[0.03] to-[#cfff50]/[0.005] shadow-[0_10px_30px_rgba(207,255,80,0.02)]'
          : 'border-white/[0.08] bg-[#1b1b1b] hover:border-white/20'
      }`}
    >
      <div className="flex items-start justify-between gap-4 relative z-10">
        <div className="flex min-w-0 items-start gap-3.5">
          {/* Active icon frame with spring scales */}
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border transition-all duration-300 group-hover:scale-105 ${
              locked
                ? 'border-white/[0.04] bg-white/[0.02] text-zinc-600'
                : enabled
                ? 'border-[#cfff50]/40 bg-[#cfff50]/15 text-[#cfff50] shadow-[0_0_20px_rgba(207,255,80,0.15)]'
                : 'border-white/[0.08] bg-black/20 text-zinc-400 group-hover:text-white'
            }`}
          >
            {locked ? <Lock className="h-4 w-4 text-amber-500" /> : Icon ? <Icon className="h-5 w-5" /> : <span className="text-xs font-black">{mark}</span>}
          </div>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <p className="text-sm font-black tracking-wide text-white group-hover:text-[#cfff50] transition-colors duration-200">{title}</p>
              {locked && (
                <span className="rounded-full bg-amber-500/10 border border-amber-500/25 px-2 py-0.5 text-[8px] font-black uppercase tracking-wider text-amber-400">
                  {planRequired}
                </span>
              )}
            </div>
            <p className="mt-1.5 text-xs leading-relaxed text-zinc-300 transition duration-200 group-hover:text-zinc-200">{description}</p>
          </div>
        </div>

        {/* Dynamic spring switch */}
        <button
          type="button"
          disabled={locked}
          onClick={() => onToggle(!enabled)}
          className={`relative h-7 w-12 shrink-0 rounded-full transition-all duration-300 focus:outline-none ${
            locked
              ? 'bg-zinc-900 cursor-not-allowed opacity-20'
              : enabled
              ? 'bg-[#cfff50] shadow-[0_0_15px_rgba(207,255,80,0.25)]'
              : 'bg-white/10 group-hover:bg-white/15'
          }`}
        >
          <span
            className={`absolute left-0.5 top-0.5 h-6 w-6 rounded-full shadow transition-all duration-300 ${
              enabled
                ? 'translate-x-5 bg-black'
                : 'translate-x-0 bg-zinc-400 group-hover:bg-white'
            }`}
          />
        </button>
      </div>

      <AnimatePresence initial={false}>
        {enabled && children && (
          <motion.div
            initial={{ height: 0, opacity: 0, marginTop: 0 }}
            animate={{ height: 'auto', opacity: 1, marginTop: 16 }}
            exit={{ height: 0, opacity: 0, marginTop: 0 }}
            className="overflow-hidden border-t border-white/[0.08] pt-4 relative z-10"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function DarkStudyConfigPanel({ value, onChange, plan = 'free', readOnly = false }) {
  const config = normalizeStudyConfig(value || DEFAULT_STUDY_CONFIG, plan);
  const limits = getPlanConfig(plan);
  const patch = (updates) => {
    if (readOnly || !onChange) return;
    onChange(normalizeStudyConfig({ ...config, ...updates }, plan));
  };

  return (
    <div className="grid gap-4">
      {/* 01 Note Depth Card with beautiful active-glow capsule selector */}
      <div className="group rounded-[1.8rem] border border-white/[0.08] bg-[#1b1b1b] p-5 transition-all duration-300 hover:border-white/20">
        <div className="flex items-start gap-3.5">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/[0.08] bg-black/20 text-zinc-400 transition-all duration-300 group-hover:scale-105 group-hover:text-white">
            <BookOpen className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-black tracking-wide text-white transition-colors duration-200 group-hover:text-[#cfff50]">Explanation depth</p>
            <p className="mt-1 text-xs leading-relaxed text-zinc-300 group-hover:text-zinc-200 transition duration-200">Determine default lesson detail and block scale.</p>
            
            {/* Highly reactive glowing capsule selector */}
            <div className="mt-4 grid grid-cols-3 gap-2">
              {[
                { key: 'short', label: 'Short' },
                { key: 'standard', label: 'Standard' },
                { key: 'deep', label: 'Deep', locked: !limits.canUseDeep },
              ].map((option) => {
                const isActive = config.explanationLength === option.key;
                const isLocked = option.locked;

                let btnClass = 'border-white/[0.06] bg-black/35 text-zinc-400 hover:border-white/20 hover:text-white';
                if (isActive) {
                  btnClass = 'border-[#cfff50]/30 bg-[#cfff50]/10 text-[#cfff50] shadow-[0_0_15px_rgba(207,255,80,0.06)] font-bold';
                } else if (isLocked) {
                  btnClass = 'border-amber-500/20 bg-amber-500/5 text-amber-500/70 cursor-not-allowed';
                }

                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={readOnly || isLocked}
                    onClick={() => patch({ explanationLength: option.key })}
                    className={`relative flex flex-col items-center justify-center rounded-2xl border py-3 text-center text-xs font-black transition-all duration-200 active:scale-95 ${btnClass}`}
                  >
                    <span className="flex items-center gap-1">
                      {option.label}
                      {isLocked && <Lock className="h-3 w-3" />}
                    </span>
                    {isLocked && (
                      <span className="mt-0.5 text-[8px] font-bold uppercase tracking-widest text-amber-500/50 leading-none">PRO</span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* 02 MCQ checks */}
      <ToggleRow
        mark="02"
        icon={HelpCircle}
        title="Multiple-choice checks"
        description="Embed responsive concept checkpoints directly inside notes."
        enabled={config.mcqEnabled}
        onToggle={(enabled) => patch({ mcqEnabled: enabled, mcqCount: enabled ? 3 : 0 })}
      />

      {/* 03 Code tasks */}
      <ToggleRow
        mark="03"
        icon={Code2}
        title="Practical coding tasks"
        description="Include programming exercises for technical modules."
        enabled={config.codeEnabled}
        onToggle={(enabled) => patch({ codeEnabled: enabled, codeCount: enabled ? Math.max(config.codeCount || 1, 1) : 0 })}
        locked={!limits.canUseCode}
        planRequired="Pro"
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-xs font-black tracking-wide text-zinc-300">Exercise limit per lesson</p>
          <Stepper
            value={config.codeCount}
            min={1}
            max={limits.codeMax}
            disabled={readOnly}
            onChange={(codeCount) => patch({ codeCount })}
          />
        </div>
      </ToggleRow>

      {/* 04 Mini projects */}
      <ToggleRow
        mark="04"
        icon={Crown}
        title="Milestone mini-projects"
        description="Structure practical checkpoints between major modules."
        enabled={config.miniProjectsEnabled}
        onToggle={(miniProjectsEnabled) => patch({ miniProjectsEnabled })}
        locked={!limits.canUseMiniProjects}
        planRequired="Pro"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'auto', label: 'Auto placement' },
            { key: 'every-module', label: 'Every module' },
          ].map((option) => (
            <button
              key={option.key}
              type="button"
              onClick={() => patch({ miniProjectMode: option.key })}
              className={`rounded-full px-5 py-2 text-xs font-black transition-all duration-200 active:scale-95 ${
                config.miniProjectMode === option.key
                  ? 'bg-white text-black shadow-md border-transparent'
                  : 'bg-black/35 text-zinc-400 hover:bg-white/[0.08] hover:text-white border border-white/[0.06]'
              }`}
            >
              {option.label}
            </button>
          ))}
        </div>
      </ToggleRow>

      {/* 05 Web grounding */}
      <ToggleRow
        mark="05"
        icon={Globe}
        title="Web-grounded search"
        description="Allow real-time search context to fetch fresh industry trends."
        enabled={config.webGroundingEnabled}
        onToggle={(webGroundingEnabled) => patch({ webGroundingEnabled })}
        locked={!limits.canUseWebGrounding}
        planRequired="Ultra"
      />
    </div>
  );
}
