import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useUsage } from '../contexts/UsageContext';
import { motion } from 'motion/react';
import { ArrowLeft, FileText, GraduationCap, WandSparkles } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import DarkStudyConfigPanel from '../components/dashboard/DarkStudyConfigPanel';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';
import { DEFAULT_STUDY_CONFIG, normalizeStudyConfig } from '../utils/studyConfig';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

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

  return (
    <DashboardShell title="Guided Setup" usageData={usageData}>
      <div className="mx-auto max-w-[92rem]">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#171717] px-4 py-3 text-sm font-black text-zinc-300 transition hover:-translate-y-0.5 hover:bg-white hover:text-black"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </button>

        <section className="overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#0d0d0d] shadow-[0_30px_100px_rgba(0,0,0,0.4)]">
          <div className="grid min-h-[calc(100dvh-12rem)] xl:grid-cols-[minmax(0,1fr)_28rem]">
            <div className="relative min-w-0 border-white/10 p-5 md:p-8 xl:border-r">
              <div className="pointer-events-none absolute -left-24 top-8 h-72 w-72 rounded-full bg-[#A3FF4F]/12 blur-[100px]" />
              <div className="pointer-events-none absolute right-0 top-24 h-72 w-72 rounded-full bg-white/[0.05] blur-[100px]" />

              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="relative">
                <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[10px] font-black uppercase tracking-[0.24em] text-[#A3FF4F]">
                  <WandSparkles className="h-4 w-4" />
                  Guided plan builder
                </div>
                <h2 className="mt-6 max-w-4xl text-5xl font-black leading-[0.94] tracking-tight text-white md:text-7xl">
                  Tell Cluss what you want to master.
                </h2>
                <p className="mt-5 max-w-2xl text-sm leading-7 text-zinc-400">
                  We will turn it into a clean study plan with lesson depth, practice style, and checkpoints controlled by you.
                </p>
              </motion.div>

              <div className="relative mt-8 grid gap-5">
                <label className="group block rounded-[2rem] border border-white/10 bg-black p-5 transition focus-within:border-[#A3FF4F]/50 hover:border-white/20">
                  <span className="flex items-center gap-2 text-sm font-black text-white">
                    <GraduationCap className="h-4 w-4 text-[#A3FF4F]" />
                    Main topic
                  </span>
                  <textarea
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="Machine learning from basics, React interview prep, C++ DSA from zero..."
                    rows={5}
                    className="mt-4 w-full resize-none bg-transparent text-2xl font-black leading-tight text-white outline-none placeholder:text-zinc-700"
                  />
                </label>

                <label className="group block rounded-[2rem] border border-white/10 bg-black p-5 transition focus-within:border-white/25 hover:border-white/20">
                  <span className="flex items-center gap-2 text-sm font-black text-white">
                    <FileText className="h-4 w-4 text-[#FF9F1C]" />
                    Syllabus or constraints <span className="text-zinc-600">(optional)</span>
                  </span>
                  <textarea
                    value={syllabus}
                    onChange={(event) => setSyllabus(event.target.value)}
                    placeholder="Paste exam outline, chapters, must-cover topics, or what not to include..."
                    rows={4}
                    className="mt-4 w-full resize-none bg-transparent text-sm leading-7 text-white outline-none placeholder:text-zinc-700"
                  />
                </label>

                <div className="rounded-[2rem] border border-white/10 bg-black p-5">
                  <p className="text-sm font-black text-white">Current level</p>
                  <div className="mt-4 grid gap-2 sm:grid-cols-3">
                    {['beginner', 'intermediate', 'advanced'].map((level) => (
                      <button
                        key={level}
                        type="button"
                        onClick={() => setConfig((prev) => ({ ...prev, level }))}
                        className={`rounded-full px-5 py-3 text-sm font-black capitalize transition hover:-translate-y-0.5 ${
                          normalizedConfig.level === level ? 'bg-white text-black' : 'bg-[#1b1b1b] text-zinc-400 hover:text-white'
                        }`}
                      >
                        {level}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <aside className="flex min-h-0 flex-col bg-[#111111] p-5 md:p-6">
              <div className="shrink-0">
                <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Controls</p>
                <h3 className="mt-3 text-3xl font-black text-white">Lesson defaults</h3>
                <p className="mt-2 text-sm leading-6 text-zinc-500">These apply to unopened lessons. You can adjust later.</p>
              </div>

              <div className="custom-scroll mt-5 min-h-0 flex-1 overflow-y-auto pr-1">
                <DarkStudyConfigPanel value={normalizedConfig} onChange={setConfig} plan={usageData?.plan || 'free'} />
              </div>

              {error && <div className="mt-4 rounded-[1.4rem] border border-[#FF9F1C]/20 bg-[#FF9F1C]/10 px-5 py-4 text-sm font-bold text-[#ffd08a]">{error}</div>}

              <div className="sticky bottom-0 mt-5 border-t border-white/10 bg-[#111111] pt-4">
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={submitting || !topic.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-white px-6 py-4 text-sm font-black text-black shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 hover:bg-[#A3FF4F] disabled:cursor-not-allowed disabled:opacity-45"
                >
                  {submitting ? 'Creating...' : 'Create guided plan'}
                  <CreditCost cost={getCostForAction(usageData?.plan, 'courseScaffold')} className="text-black" />
                </button>
              </div>
            </aside>
          </div>
        </section>
      </div>
    </DashboardShell>
  );
}
