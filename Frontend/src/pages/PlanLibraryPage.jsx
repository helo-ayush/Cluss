import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'motion/react';
import { Compass, Youtube, PlayCircle, Layers, Plus } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import DarkPlanCard from '../components/dashboard/DarkPlanCard';
import DeletePlanModal from '../components/dashboard/DeletePlanModal';

import { useUsage } from '../contexts/UsageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function PlanLibraryPage({ type = 'guided' }) {
  const { user, isLoaded } = useUser();
  const { usageData } = useUsage();
  const navigate = useNavigate();
  const location = useLocation();
  const [studyPlans, setStudyPlans] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(location.state?.toast || null);
  const isPlaylist = type === 'playlist';

  useEffect(() => {
    if (!location.state?.toast) return;
    setToast(location.state.toast);
    const timer = setTimeout(() => setToast(null), 3200);
    window.history.replaceState({}, document.title);
    return () => clearTimeout(timer);
  }, [location.state]);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [plansRes] = await Promise.all([
        fetch(`${API_BASE}/api/study-plans/user/${user.id}`),
      ]);
      const plansData = await plansRes.json();
      if (plansData.success) setStudyPlans(plansData.courses || []);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    fetchAll();
  }, [fetchAll, isLoaded, user?.id]);

  const plans = useMemo(() => (
    studyPlans
      .filter((plan) => isPlaylist ? plan.sourceType === 'playlist' : plan.sourceType === 'guided-topic')
      .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0))
  ), [isPlaylist, studyPlans]);

  const openPlan = (plan) => {
    if (plan.sourceType === 'playlist') navigate(`/playlist/${plan._id}`);
    else navigate(`/study-plan/${plan._id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API_BASE}/api/study-plans/${deleteTarget._id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await fetchAll();
    } catch (error) {
      console.error(error);
    }
  };

  const title = isPlaylist ? 'Playlist Plans' : 'Guided Plans';
  const Icon = isPlaylist ? Youtube : Compass;
  const accentColor = '#e2e8f0'; // Slate 200
  const emptyMessage = isPlaylist
    ? 'Convert your favorite YouTube playlists into structured daily learning plans.'
    : 'Let AI craft the perfect curriculum for whatever you want to learn next.';

  const createLink = isPlaylist ? '/create/playlist' : '/create/guided';

  return (
    <DashboardShell title={title} eyebrow="Study library" usageData={usageData}>
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="fixed left-1/2 top-6 z-[2000] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#12141c]/95 px-5 py-3 text-sm font-bold text-zinc-200 shadow-2xl backdrop-blur-xl"
          >
            {toast.message || toast}
          </motion.div>
        )}
      </AnimatePresence>
      <div className="mx-auto max-w-[96rem] space-y-8">
        {/* ═══ PREMIUM HERO SECTION ═══ */}
        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#111111] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent shadow-[0_20px_60px_rgba(0,0,0,0.4)]">
          {/* Ambient Glows */}
          <div className="absolute -left-32 -top-32 h-96 w-96 rounded-full opacity-20 blur-[120px] pointer-events-none" style={{ backgroundColor: accentColor }} />
          <div className="absolute -right-20 -bottom-20 h-80 w-80 rounded-full bg-white/[0.03] blur-[100px] pointer-events-none" />

          <div className="relative z-10 p-8 md:p-12">
            <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">

              {/* Left Content */}
              <div className="flex-1">
                <div className="inline-flex items-center gap-2.5 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 mb-6 backdrop-blur-md">
                  <Icon className="h-4 w-4" style={{ color: accentColor }} />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-300">
                    {isPlaylist ? 'Video Learning' : 'AI Curriculum'}
                  </span>
                </div>

                <h2 className="text-4xl md:text-5xl lg:text-6xl font-black tracking-tight text-white mb-4">
                  {title}
                </h2>
                <p className="max-w-2xl text-base leading-7 text-zinc-400">
                  {isPlaylist
                    ? 'All your imported YouTube playlists, structured and organized into actionable, day-by-day learning schedules.'
                    : 'Your personal, AI-generated curriculums tailored specifically to your learning goals and timeline.'}
                </p>
              </div>

              {/* Right Stats Box */}
              <div className="shrink-0 flex items-center gap-4">
                <div className="flex flex-col items-center justify-center rounded-[2rem] border border-white/10 bg-[#181a21]/80 backdrop-blur-xl p-6 min-w-[140px]">
                  <span className="text-3xl font-black text-white">{plans.length}</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 mt-2">Total Plans</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ═══ CONTENT GRID ═══ */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {[1, 2, 3].map((item) => (
              <div key={item} className="h-80 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.045]" />
            ))}
          </div>
        ) : plans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-[2.8rem] border border-white/10 bg-[#141414] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent py-24 px-6 text-center shadow-[0_20px_60px_rgba(0,0,0,0.2)]"
          >
            <div className="h-20 w-20 rounded-full bg-white/[0.02] border border-white/10 flex items-center justify-center mb-6">
              {isPlaylist ? <PlayCircle className="h-8 w-8 text-zinc-500" /> : <Layers className="h-8 w-8 text-zinc-500" />}
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-white mb-4">Nothing here yet</h3>
            <p className="max-w-md text-sm leading-7 text-zinc-400 mb-8">
              {emptyMessage}
            </p>
            <button
              onClick={() => navigate(createLink)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white px-6 py-3.5 text-sm font-black text-black transition hover:bg-zinc-200"
            >
              <Plus className="h-4 w-4" /> Create {isPlaylist ? 'Playlist' : 'Guided'} Plan
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {plans.map((plan) => (
              <DarkPlanCard key={plan._id} plan={plan} onOpen={openPlan} onDelete={setDeleteTarget} />
            ))}
          </div>
        )}
      </div>

      <DeletePlanModal plan={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </DashboardShell>
  );
}
