import React from 'react';
import { DEFAULT_STUDY_CONFIG, getPlanConfig, normalizeStudyConfig } from '../../utils/studyConfig';

function Stepper({ value, min = 0, max = 5, disabled, onChange }) {
  return (
    <div className="flex items-center gap-1 rounded-full border border-white/10 bg-black/30 p-1">
      <button type="button" disabled={disabled || value <= min} onClick={() => onChange(Math.max(min, value - 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-zinc-300 disabled:opacity-35">
        -
      </button>
      <span className="w-8 text-center font-black text-white">{value}</span>
      <button type="button" disabled={disabled || value >= max} onClick={() => onChange(Math.min(max, value + 1))} className="flex h-8 w-8 items-center justify-center rounded-full bg-white/[0.08] text-zinc-300 disabled:opacity-35">
        +
      </button>
    </div>
  );
}

function ToggleRow({ mark, title, description, enabled, onToggle, locked, children }) {
  return (
    <div className={`rounded-[1.6rem] border p-4 ${enabled ? 'border-white/20 bg-white/[0.045]' : 'border-white/10 bg-[#171717]'}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="flex min-w-0 items-start gap-3">
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-xs font-black ${locked ? 'bg-white/[0.08] text-zinc-500' : enabled ? 'bg-white text-black' : 'bg-white/[0.08] text-zinc-400'}`}>
            {locked ? 'L' : mark}
          </div>
          <div className="min-w-0">
            <p className="font-black text-white">{title}</p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">{description}</p>
          </div>
        </div>
        <button
          type="button"
          disabled={locked}
          onClick={() => onToggle(!enabled)}
          className={`relative h-8 w-14 shrink-0 rounded-full transition ${enabled ? 'bg-white' : 'bg-white/12'} disabled:opacity-50`}
        >
          <span className={`absolute left-1 top-1 h-6 w-6 rounded-full shadow-sm transition-transform ${enabled ? 'translate-x-6 bg-black' : 'translate-x-0 bg-white'}`} />
        </button>
      </div>
      {enabled && children && <div className="mt-4 border-t border-white/10 pt-4">{children}</div>}
      {locked && <p className="mt-3 text-[10px] font-black uppercase tracking-[0.2em] text-[#FF9F1C]">Paid plan feature</p>}
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
      <div className="rounded-[1.6rem] border border-white/10 bg-[#171717] p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-white text-black">
            01
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-black text-white">Explanation style</p>
            <p className="mt-1 text-sm leading-6 text-zinc-500">Choose the default note depth.</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {[
                { key: 'short', label: 'Short' },
                { key: 'standard', label: 'Standard' },
                { key: 'deep', label: 'Deep', locked: !limits.canUseDeep },
              ].map((option) => (
                <button
                  key={option.key}
                  type="button"
                  disabled={readOnly || option.locked}
                  onClick={() => patch({ explanationLength: option.key })}
                  className={`rounded-full px-4 py-2 text-sm font-black transition disabled:opacity-50 ${
                    config.explanationLength === option.key
                      ? 'bg-white text-black'
                      : option.locked
                      ? 'bg-[#FF9F1C]/15 text-[#FF9F1C]'
                      : 'bg-white/[0.08] text-zinc-300 hover:bg-white/[0.12]'
                  }`}
                >
                  {option.locked ? `${option.label} - Pro` : option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <ToggleRow mark="02" title="Multiple choice checks" description="Quick checks after each explanation." enabled={config.mcqEnabled} onToggle={(enabled) => patch({ mcqEnabled: enabled, mcqCount: enabled ? Math.max(config.mcqCount || 1, 1) : 0 })}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-zinc-300">Question count</p>
          <Stepper value={config.mcqCount} min={1} max={limits.mcqMax} disabled={readOnly} onChange={(mcqCount) => patch({ mcqCount })} />
        </div>
      </ToggleRow>

      <ToggleRow mark="03" title="Written responses" description="Short written answers and deeper reasoning." enabled={config.writtenEnabled} onToggle={(enabled) => patch({ writtenEnabled: enabled, writtenCount: enabled ? Math.max(config.writtenCount || 1, 1) : 0 })}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-zinc-300">Prompt count</p>
          <Stepper value={config.writtenCount} min={1} max={limits.writtenMax} disabled={readOnly} onChange={(writtenCount) => patch({ writtenCount })} />
        </div>
      </ToggleRow>

      <ToggleRow mark="04" title="Code tasks" description="Coding challenges for practical topics." enabled={config.codeEnabled} onToggle={(enabled) => patch({ codeEnabled: enabled, codeCount: enabled ? Math.max(config.codeCount || 1, 1) : 0 })} locked={!limits.canUseCode}>
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-bold text-zinc-300">Task count</p>
          <Stepper value={config.codeCount} min={1} max={limits.codeMax} disabled={readOnly} onChange={(codeCount) => patch({ codeCount })} />
        </div>
      </ToggleRow>

      <ToggleRow mark="05" title="Mini projects" description="Milestone checkpoints between sections." enabled={config.miniProjectsEnabled} onToggle={(miniProjectsEnabled) => patch({ miniProjectsEnabled })} locked={!limits.canUseMiniProjects}>
        <div className="flex flex-wrap gap-2">
          {[
            { key: 'auto', label: 'Auto placement' },
            { key: 'every-module', label: 'Every module' },
          ].map((option) => (
            <button key={option.key} type="button" onClick={() => patch({ miniProjectMode: option.key })} className={`rounded-full px-4 py-2 text-sm font-black ${config.miniProjectMode === option.key ? 'bg-white text-black' : 'bg-white/[0.08] text-zinc-300'}`}>
              {option.label}
            </button>
          ))}
        </div>
      </ToggleRow>

      <ToggleRow mark="06" title="Web grounding" description="Allow fresh web context where needed." enabled={config.webGroundingEnabled} onToggle={(webGroundingEnabled) => patch({ webGroundingEnabled })} locked={!limits.canUseWebGrounding} />
    </div>
  );
}
