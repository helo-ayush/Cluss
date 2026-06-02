import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useUsage } from '../contexts/UsageContext';
import { motion } from 'motion/react';
import { FileText, GraduationCap, WandSparkles, Sparkles, X } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import DarkStudyConfigPanel from '../components/dashboard/DarkStudyConfigPanel';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';
import { DEFAULT_STUDY_CONFIG, normalizeStudyConfig } from '../utils/studyConfig';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const PRESET_TOPICS = [
  { label: 'React.js Interview Prep', query: 'React.js advanced state hooks, virtual DOM, reconciler execution, and active engineering interview preparation' },
  { label: 'Machine Learning Basics', query: 'Supervised vs unsupervised algorithms, regression math, neural network gradient descent, and training flows' },
  { label: 'C++ Data Structures', query: 'Data Structures and Algorithms in C++ covering pointers, memory maps, trees, graph traversals, and dynamic programming' },
  { label: 'Systems Design Basics', query: 'Scalable system design architectures, load balancers, caching layers, database replication, and API gateways' }
];

export default function GuidedCreatePage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { usageData, fetchUsage } = useUsage();
  const [topic, setTopic] = useState('');
  const [syllabus, setSyllabus] = useState('');
  const [config, setConfig] = useState(DEFAULT_STUDY_CONFIG);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (usageData) {
      setConfig((prev) => normalizeStudyConfig(prev, usageData.plan));
    }
  }, [usageData?.plan]);

  const normalizedConfig = normalizeStudyConfig(config, usageData?.plan || 'free');

  const handleSubmit = async () => {
    if (!topic.trim() || !user?.id) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/study-plans/guided`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          topic: topic.trim(),
          syllabus: syllabus.trim(),
          goal: normalizedConfig.goal,
          level: normalizedConfig.level,
          studyConfig: normalizedConfig,
          userName: user.fullName || user.firstName || 'Learner',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'Failed to create study plan.');
      
      // Update global credits after successful creation
      fetchUsage();
      
      navigate(`/dashboard/guided/study-plan/${data.course._id}`);
    } catch (err) {
      setError(err.message || 'Failed to create study plan.');
    } finally {
      setSubmitting(false);
    }
  };

  const LEVELS = [
    {
      key: 'beginner',
      label: 'Beginner',
      desc: 'Build fundamentals with analogies and gentle jargon explanation.',
      hoverStyle: 'hover:border-emerald-500/20 hover:bg-emerald-500/[0.005]'
    },
    {
      key: 'intermediate',
      label: 'Intermediate',
      desc: 'Shift focus to practical code examples and standard math derivations.',
      hoverStyle: 'hover:border-blue-500/20 hover:bg-blue-500/[0.005]'
    },
    {
      key: 'advanced',
      label: 'Advanced',
      desc: 'Dive into extreme architectural nuances and complex mathematical proofs.',
      hoverStyle: 'hover:border-indigo-500/20 hover:bg-indigo-500/[0.005]'
    }
  ];

  return (
    <DashboardShell title="Guided Setup" usageData={usageData}>
      {/* Maximum screen-wide container (max-w-[104rem]) aligned perfectly to match headers */}
      <div className="mx-auto max-w-[104rem] px-4 pt-2 pb-10 sm:px-6 lg:px-8">
        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_26rem]">
          {/* Main Card Builder */}
          <div className="relative rounded-[2.4rem] border border-white/10 bg-[#1b1b1b] p-6 md:p-8 shadow-2xl transition duration-300">
            {/* Elegant Corner Close Button inside the builder box */}
            <button
              type="button"
              onClick={() => navigate('/dashboard')}
              className="absolute top-6 right-6 flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.04] border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 active:scale-90 transition-all duration-200 z-20"
            >
              <X className="h-4 w-4" />
            </button>

            {/* Glowing mesh background overlays */}
            <div className="pointer-events-none absolute -left-24 top-8 h-80 w-80 rounded-full bg-[#A3FF4F]/5 blur-[120px]" />
            <div className="pointer-events-none absolute right-0 top-24 h-80 w-80 rounded-full bg-white/[0.02] blur-[120px]" />

            <div className="relative z-10 pr-12">
              <p className="text-[10px] font-black uppercase tracking-[0.28em] text-[#A3FF4F]">Guided plan builder</p>
              <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl leading-tight">Tell Cluss what you want to master.</h2>
              <p className="mt-3 max-w-2xl text-sm leading-relaxed text-zinc-300">
                We will turn it into a clean study plan with lesson depth, practice style, and checkpoints controlled by you.
              </p>
            </div>

            <div className="relative z-10 mt-8 grid gap-5">
              {/* Main Topic Input Box with reactive neon shadows */}
              <label className="group block rounded-[1.8rem] border border-white/10 bg-black/30 p-5 transition duration-300 focus-within:border-[#A3FF4F]/40 focus-within:shadow-[0_0_20px_rgba(163,255,79,0.04)] hover:border-white/20">
                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white transition-colors duration-300 group-focus-within:text-[#A3FF4F]">
                  <GraduationCap className="h-4.5 w-4.5 text-[#A3FF4F]" />
                  Main topic
                </span>
                <textarea
                  value={topic}
                  onChange={(event) => setTopic(event.target.value)}
                  placeholder="Machine learning from basics, React interview prep, C++ DSA from zero..."
                  rows={3}
                  className="mt-4 w-full resize-none bg-transparent text-lg font-black leading-snug text-white outline-none placeholder:text-zinc-700"
                />

                {/* Highly reactive preset trigger grid */}
                <div className="mt-4 border-t border-white/[0.08] pt-4">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Quick preset triggers</p>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {PRESET_TOPICS.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setTopic(preset.query)}
                        className="rounded-full border border-white/[0.06] bg-black/40 px-3.5 py-1.5 text-xs font-bold text-zinc-400 transition-all duration-200 hover:border-[#A3FF4F]/30 hover:bg-[#A3FF4F]/5 hover:text-[#A3FF4F] hover:shadow-[0_0_15px_rgba(163,255,79,0.04)] hover:scale-105 active:scale-95"
                      >
                        {preset.label}
                      </button>
                    ))}
                  </div>
                </div>
              </label>

              {/* Syllabus Box with reactive orange highlights */}
              <label className="group block rounded-[1.8rem] border border-white/10 bg-black/30 p-5 transition duration-300 focus-within:border-[#FF9F1C]/40 focus-within:shadow-[0_0_20px_rgba(255,159,28,0.04)] hover:border-white/20">
                <span className="flex items-center gap-2 text-xs font-black uppercase tracking-wider text-white transition-colors duration-300 group-focus-within:text-[#FF9F1C]">
                  <FileText className="h-4.5 w-4.5 text-[#FF9F1C]" />
                  Syllabus or constraints <span className="text-[10px] lowercase text-zinc-500">(optional)</span>
                </span>
                <textarea
                  value={syllabus}
                  onChange={(event) => setSyllabus(event.target.value)}
                  placeholder="Paste exam outline, chapters, must-cover topics, or what not to include..."
                  rows={4}
                  className="mt-4 w-full resize-none bg-transparent text-sm leading-relaxed text-white outline-none placeholder:text-zinc-700"
                />
              </label>

              {/* Highly reactive Student Level Cards */}
              <div className="rounded-[1.8rem] border border-white/10 bg-black/30 p-5">
                <p className="text-xs font-black uppercase tracking-wider text-white">Target student level</p>
                <div className="mt-5 grid gap-3 md:grid-cols-3">
                  {LEVELS.map((lvl) => {
                    const isActive = normalizedConfig.level === lvl.key;
                    return (
                      <button
                        key={lvl.key}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, level: lvl.key }))}
                        className={`relative flex flex-col items-start rounded-2xl border p-5 text-left transition-all duration-300 hover:-translate-y-0.5 focus:outline-none ${
                          isActive
                            ? 'bg-[#cfff50] border-transparent text-black shadow-lg shadow-[#cfff50]/15 scale-[1.01]'
                            : `border-white/[0.06] bg-black/20 text-zinc-300 ${lvl.hoverStyle}`
                        }`}
                      >
                        <span className={`text-base font-black transition-colors duration-200 ${isActive ? 'text-black font-extrabold' : 'text-white'}`}>
                          {lvl.label}
                        </span>
                        {/* Highly legible text contrast */}
                        <p className={`mt-3 text-xs leading-relaxed transition-colors duration-200 ${
                          isActive ? 'text-zinc-850 font-bold' : 'text-zinc-300'
                        }`}>
                          {lvl.desc}
                        </p>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>

          {/* Configuration sidebar */}
          <aside className="flex min-h-0 flex-col justify-between rounded-[2.4rem] border border-white/10 bg-[#1b1b1b] p-6 shadow-2xl">
            <div className="space-y-5">
              <div className="shrink-0 border-b border-white/[0.08] pb-5">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Controls</p>
                <h3 className="mt-2 text-2xl font-black text-white">Lesson defaults</h3>
                <p className="mt-1.5 text-xs leading-relaxed text-zinc-300">These apply to unopened lessons. You can adjust later.</p>
              </div>

              {/* Dynamic configs list */}
              <div className="space-y-4">
                <DarkStudyConfigPanel value={normalizedConfig} onChange={setConfig} plan={usageData?.plan || 'free'} />
              </div>
            </div>

            {/* Submit triggers */}
            <div className="mt-8 space-y-4">
              {error && (
                <div className="rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3 text-xs leading-relaxed text-red-300">
                  {error}
                </div>
              )}

              <button
                type="button"
                onClick={handleSubmit}
                disabled={submitting || !topic.trim()}
                className="group relative flex w-full items-center justify-center gap-2.5 overflow-hidden rounded-full bg-gradient-to-r from-[#efff55] to-[#cfff50] py-4 text-xs font-black uppercase tracking-widest text-black shadow-[0_15px_40px_rgba(207,255,80,0.15)] transition duration-300 hover:shadow-[0_20px_50px_rgba(207,255,80,0.3)] hover:-translate-y-0.5 active:scale-98 disabled:pointer-events-none disabled:opacity-35"
              >
                {submitting ? (
                  <span className="flex items-center gap-2">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-black border-t-transparent" />
                    Assembling plan...
                  </span>
                ) : (
                  <>
                    <Sparkles className="h-4 w-4 transition duration-300 group-hover:scale-110" />
                    Create guided plan
                  </>
                )}
                
                <div className="absolute right-4 top-1/2 -translate-y-1/2">
                  <CreditCost cost={getCostForAction(usageData?.plan, 'courseScaffold')} className="text-black bg-black/10 px-2 py-1 rounded-full border border-black/5" />
                </div>
              </button>
            </div>
          </aside>
        </section>
      </div>
    </DashboardShell>
  );
}
