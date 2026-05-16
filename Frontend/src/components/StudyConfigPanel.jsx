import React from 'react';
import { Sparkles, CheckSquare, FileText, Code2, Wand2, Globe2, Lock, Plus, Minus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { DEFAULT_STUDY_CONFIG, getPlanConfig, normalizeStudyConfig } from '../utils/studyConfig';

function Stepper({ value, min = 0, max = 5, disabled, onChange }) {
  return (
    <div className="flex items-center gap-1.5 rounded-full bg-slate-100/80 p-1 shadow-inner border border-slate-200/60">
      <button 
        type="button" 
        disabled={disabled || value <= min} 
        onClick={() => onChange(Math.max(min, value - 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-slate-600 transition-all hover:text-slate-900 hover:shadow-[0_4px_12px_rgba(15,23,42,0.12)] disabled:opacity-40 disabled:hover:text-slate-600 disabled:hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
      >
        <Minus className="h-4 w-4" />
      </button>
      <span className="w-8 text-center text-[15px] font-bold text-slate-800">{value}</span>
      <button 
        type="button" 
        disabled={disabled || value >= max} 
        onClick={() => onChange(Math.min(max, value + 1))}
        className="flex h-8 w-8 items-center justify-center rounded-full bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)] text-slate-600 transition-all hover:text-indigo-600 hover:shadow-[0_4px_12px_rgba(79,70,229,0.12)] disabled:opacity-40 disabled:hover:text-slate-600 disabled:hover:shadow-[0_2px_8px_rgba(0,0,0,0.04)]"
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
          ? 'border-amber-200/60 bg-amber-50/40' 
          : enabled 
            ? 'border-slate-200 bg-white shadow-[0_8px_30px_rgba(15,23,42,0.06)]' 
            : 'border-slate-200/50 bg-white/60 hover:bg-white/90 hover:shadow-[0_8px_30px_rgba(15,23,42,0.03)]'
      } px-5 py-5`}
    >
      <div className="flex items-start justify-between gap-5 relative z-10">
        <div className="flex items-start gap-4">
          <div className={`mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl transition-all duration-300 ${
            locked 
              ? 'bg-gradient-to-br from-amber-100 to-amber-200/60 text-amber-700 shadow-inner' 
              : enabled 
                ? 'bg-slate-800 text-white shadow-[0_4px_12px_rgba(15,23,42,0.2)]' 
                : 'bg-slate-100/80 text-slate-500 shadow-inner group-hover:bg-slate-200 group-hover:text-slate-800'
          }`}>
            {locked ? <Lock className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
          </div>
          <div className="min-w-0">
            <p className={`font-semibold text-[15px] transition-colors ${enabled ? 'text-slate-900' : 'text-slate-800'}`}>{title}</p>
            <p className="mt-1 text-sm leading-[1.6] text-slate-500">{description}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={locked}
          onClick={() => onToggle(!enabled)}
          className={`relative flex h-7 w-12 shrink-0 cursor-pointer items-center rounded-full transition-all duration-300 ease-in-out focus:outline-none focus-visible:ring-2 focus-visible:ring-slate-500 focus-visible:ring-offset-2 ${
            enabled 
              ? 'bg-slate-800 shadow-inner' 
              : 'bg-slate-200 hover:bg-slate-300'
          } ${locked ? 'opacity-60 cursor-not-allowed' : ''}`}
        >
          <span 
            className={`absolute inline-block h-[20px] w-[20px] transform rounded-full bg-white shadow-sm transition-transform duration-300 cubic-bezier(0.4, 0, 0.2, 1) ${
              enabled ? 'translate-x-[24px]' : 'translate-x-[4px]'
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
            <div className="pt-5 mt-5 border-t border-slate-100/80">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {locked && (
        <div className="mt-4 inline-flex items-center rounded-full bg-amber-100/50 px-3 py-1">
          <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-amber-700">Locked for paid plans</p>
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
      <motion.div layout className="relative overflow-hidden rounded-[1.8rem] border border-slate-200/50 bg-white/60 px-5 py-5 shadow-[0_2px_10px_rgba(0,0,0,0.01)] transition-all hover:bg-white/90 hover:shadow-[0_8px_30px_rgba(15,23,42,0.03)]">
        <div className="flex items-start gap-4">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-slate-800 text-white shadow-[0_4px_12px_rgba(15,23,42,0.2)]">
            <Sparkles className="h-5 w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[15px] text-slate-900">Explanation style</p>
            <p className="mt-1 text-sm leading-[1.6] text-slate-500">Choose how dense each lesson should feel by default.</p>
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
                    className={`relative overflow-hidden rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                      active
                        ? 'bg-slate-900 text-white shadow-[0_4px_14px_rgba(15,23,42,0.2)] hover:bg-slate-800'
                        : option.locked
                        ? 'bg-amber-50 text-amber-700 ring-1 ring-amber-200/50'
                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
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
          <p className="text-sm font-semibold text-slate-700">Question count</p>
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
          <p className="text-sm font-semibold text-slate-700">Prompt count</p>
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
            <p className="text-sm font-semibold text-slate-700">Task count</p>
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
                  className={`rounded-full px-5 py-2.5 text-sm font-semibold transition-all duration-300 ${
                    active 
                      ? 'bg-slate-800 text-white shadow-[0_4px_14px_rgba(15,23,42,0.2)] hover:bg-slate-700' 
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-slate-900'
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
