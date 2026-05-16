import React from 'react';
import { Sparkles, CheckSquare, FileText, Code2, Wand2, Globe2, Lock, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_STUDY_CONFIG, getPlanConfig, normalizeStudyConfig } from '../utils/studyConfig';

function Stepper({ value, min = 0, max = 5, disabled, onChange }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-white/5 p-1 shadow-inner border border-white/10">
      <button 
        type="button" 
        disabled={disabled || value <= min} 
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-zinc-300 transition-all hover:text-white hover:bg-white/20 disabled:opacity-40 disabled:hover:text-zinc-300 disabled:hover:bg-white/10"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-[15px] font-bold text-white">{value}</span>
      <button 
        type="button" 
        disabled={disabled || value >= max} 
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 shadow-[0_2px_8px_rgba(0,0,0,0.2)] text-zinc-300 transition-all hover:text-white hover:bg-white/20 disabled:opacity-40 disabled:hover:text-zinc-300 disabled:hover:bg-white/10"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}

function ToggleRow({ icon: Icon, title, description, enabled, onToggle, children, locked = false }) {
  return (
    <motion.div 
      layout
      className={`group relative overflow-hidden rounded-[1.8rem] border transition-all duration-300 ${
        locked 
          ? 'border-amber-500/20 bg-amber-500/5' 
          : enabled 
            ? 'border-white/20 bg-[#111111] shadow-[0_8px_30px_rgba(0,0,0,0.4)]' 
            : 'border-white/5 bg-white/[0.02] hover:bg-white/[0.04] hover:shadow-[0_8px_30px_rgba(0,0,0,0.2)]'
      } px-5 py-5`}
    >
      <div className="flex items-start justify-between gap-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
            locked 
              ? 'bg-amber-500/10 text-amber-400' 
              : enabled 
                ? 'bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.2)]' 
                : 'bg-white/5 text-zinc-500 shadow-inner group-hover:bg-white/10 group-hover:text-white'
          }`}>
            {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-[15px] transition-colors ${enabled ? 'text-white' : 'text-zinc-400 group-hover:text-zinc-200'}`}>{title}</p>
            <p className="mt-1 text-sm leading-[1.6] text-zinc-500">{description}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={locked}
          onClick={() => onToggle(!enabled)}
          className={`relative flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-black ${
            enabled 
              ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.3)]' 
              : 'bg-zinc-700 hover:bg-zinc-600'
          } ${locked ? 'opacity-40 cursor-not-allowed' : ''}`}
        >
          <span 
            className={`absolute inline-block h-[20px] w-[20px] transform rounded-full transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${
              enabled ? 'translate-x-[24px] bg-black shadow-sm' : 'translate-x-[4px] bg-white'
            }`} 
          />
        </button>
      </div>
      
      <AnimatePresence>
        {enabled && children && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative z-10"
          >
            <div className="pt-5 mt-5 border-t border-white/10">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {locked && (
        <div className="mt-4 inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">Locked for paid plans</p>
        </div>
      )}
    </motion.div>
  );
}

export default function StudyConfigPanel({ value, onChange, plan = 'free', compact = false, readOnly = false }) {
  const config = normalizeStudyConfig(value || DEFAULT_STUDY_CONFIG, plan);
  const limits = getPlanConfig(plan);

  const patch = (updates) => {
    if (readOnly || !onChange) return;
    onChange(normalizeStudyConfig({ ...config, ...updates }, plan));
  };

  const tone = compact ? 'gap-4' : 'gap-5';

  return (
    <div className={`grid ${tone}`}>
      <motion.div layout className="relative overflow-hidden rounded-[1.8rem] border border-white/10 bg-white/[0.03] px-5 py-5 shadow-lg transition-all hover:bg-white/[0.05]">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-black shadow-[0_4px_12px_rgba(255,255,255,0.2)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[15px] text-white">Explanation style</p>
            <p className="mt-1 text-sm leading-[1.6] text-zinc-500">Choose how dense each lesson should feel by default.</p>
            <div className="mt-5 flex flex-wrap gap-2.5">
              {[
                { key: 'short', label: 'Short' },
                { key: 'standard', label: 'Standard' },
                { key: 'deep', label: 'Deep', locked: !limits.canUseDeep },
              ].map((option) => {
                const active = config.explanationLength === option.key;
                return (
                  <button
                    key={option.key}
                    type="button"
                    disabled={readOnly || option.locked}
                    onClick={() => patch({ explanationLength: option.key })}
                    className={`relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-black transition-all duration-300 ${
                      active
                        ? 'bg-white text-black shadow-[0_4px_14px_rgba(255,255,255,0.2)] hover:bg-zinc-200'
                        : option.locked
                        ? 'bg-amber-500/5 text-amber-400 ring-1 ring-amber-500/20'
                        : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                    } disabled:cursor-not-allowed`}
                  >
                    {option.locked ? `${option.label} · Pro` : option.label}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </motion.div>

      <ToggleRow
        icon={CheckSquare}
        title="Multiple choice checks"
        description="Quick knowledge checks after the explanation."
        enabled={config.mcqEnabled}
        onToggle={(enabled) => patch({ mcqEnabled: enabled, mcqCount: enabled ? Math.max(config.mcqCount || 1, 1) : 0 })}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-white">Question count</p>
          <Stepper value={config.mcqCount} min={1} max={limits.mcqMax} disabled={readOnly} onChange={(mcqCount) => patch({ mcqCount })} />
        </div>
      </ToggleRow>

      <ToggleRow
        icon={FileText}
        title="Written responses"
        description="Ask for short written answers and deeper reasoning."
        enabled={config.writtenEnabled}
        onToggle={(enabled) => patch({ writtenEnabled: enabled, writtenCount: enabled ? Math.max(config.writtenCount || 1, 1) : 0 })}
      >
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-white">Prompt count</p>
          <Stepper value={config.writtenCount} min={1} max={limits.writtenMax} disabled={readOnly} onChange={(writtenCount) => patch({ writtenCount })} />
        </div>
      </ToggleRow>

      <ToggleRow
        icon={Code2}
        title="Code tasks"
        description="Include coding challenges for practical topics."
        enabled={config.codeEnabled}
        onToggle={(enabled) => patch({ codeEnabled: enabled, codeCount: enabled ? Math.max(config.codeCount || 1, 1) : 0 })}
        locked={!limits.canUseCode}
      >
        {limits.canUseCode && (
          <div className="flex items-center justify-between gap-4">
            <p className="text-sm font-semibold text-white">Task count</p>
            <Stepper value={config.codeCount} min={1} max={limits.codeMax} disabled={readOnly} onChange={(codeCount) => patch({ codeCount })} />
          </div>
        )}
      </ToggleRow>

      <ToggleRow
        icon={Wand2}
        title="Mini projects"
        description="Drop in milestone checkpoints between major sections."
        enabled={config.miniProjectsEnabled}
        onToggle={(miniProjectsEnabled) => patch({ miniProjectsEnabled })}
        locked={!limits.canUseMiniProjects}
      >
        {limits.canUseMiniProjects && (
          <div className="flex flex-wrap gap-2.5">
            {[
              { key: 'auto', label: 'Auto placement' },
              { key: 'every-module', label: 'Every module' },
            ].map((option) => {
              const active = config.miniProjectMode === option.key;
              return (
                <button
                  key={option.key}
                  type="button"
                  disabled={readOnly}
                  onClick={() => patch({ miniProjectMode: option.key })}
                  className={`rounded-full px-5 py-2.5 text-sm font-black transition-all duration-300 ${
                    active 
                      ? 'bg-white text-black shadow-[0_4px_14px_rgba(255,255,255,0.2)] hover:bg-zinc-200' 
                      : 'bg-white/5 text-zinc-300 hover:bg-white/10 hover:text-white'
                  }`}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        )}
      </ToggleRow>

      <ToggleRow
        icon={Globe2}
        title="Web grounding"
        description="Allow the lesson generator to pull fresh web context when needed."
        enabled={config.webGroundingEnabled}
        onToggle={(webGroundingEnabled) => patch({ webGroundingEnabled })}
        locked={!limits.canUseWebGrounding}
      />

    </div>
  );
}
