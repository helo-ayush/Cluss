import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { AnimatePresence, motion } from 'framer-motion';
import { Compass, Youtube, PlayCircle, Layers, Plus, Search, ArrowRight, Sparkles } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import DarkPlanCard from '../components/dashboard/DarkPlanCard';
import DeletePlanModal from '../components/dashboard/DeletePlanModal';
import { useUsage } from '../contexts/UsageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

/* ─── Animated number counter ─── */
const Counter = ({ value }) => {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (value === 0) { setCount(0); return; }
    let current = 0;
    const step = Math.max(1, Math.ceil(value / 25));
    const timer = setInterval(() => {
      current = Math.min(current + step, value);
      setCount(current);
      if (current >= value) clearInterval(timer);
    }, 30);
    return () => clearInterval(timer);
  }, [value]);
  return <>{count}</>;
};

/* ─── Orbital SVG Progress Ring ─── */
const OrbitalRing = ({ progress = 0 }) => {
  const size = 240;
  const cx = size / 2;
  const cy = size / 2;
  const r1 = 95; // main progress ring
  const r2 = 75; // inner decorative ring
  const r3 = 108; // outer decorative ring
  const circumference = 2 * Math.PI * r1;
  const strokeDash = (progress / 100) * circumference;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="w-full h-full" style={{ maxWidth: size, maxHeight: size }}>
      {/* Outer decorative ring */}
      <circle cx={cx} cy={cy} r={r3} fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={r3} fill="none" stroke="rgba(239,255,85,0.06)" strokeWidth="1" strokeDasharray="6 8" />

      {/* Inner decorative ring */}
      <circle cx={cx} cy={cy} r={r2} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1" />

      {/* Main track */}
      <circle cx={cx} cy={cy} r={r1} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="6" strokeLinecap="round" />

      {/* Progress arc */}
      <motion.circle
        cx={cx} cy={cy} r={r1}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: circumference - strokeDash }}
        transition={{ duration: 1.5, ease: 'easeOut', delay: 0.3 }}
        transform={`rotate(-90 ${cx} ${cy})`}
        style={{ filter: 'drop-shadow(0 0 8px rgba(239,255,85,0.35))' }}
      />

      {/* Gradient definition */}
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#71717a" />
          <stop offset="60%" stopColor="#efff55" />
          <stop offset="100%" stopColor="#d4ff00" />
        </linearGradient>
      </defs>

      {/* Orbit dots */}
      {[0, 60, 120, 200, 280, 340].map((angle, i) => {
        const rad = (angle * Math.PI) / 180;
        const dotR = i % 2 === 0 ? r3 + 8 : r2 - 10;
        const dx = cx + dotR * Math.cos(rad);
        const dy = cy + dotR * Math.sin(rad);
        return (
          <motion.circle
            key={i}
            cx={dx} cy={dy} r={i % 3 === 0 ? 2.5 : 1.5}
            fill={i % 2 === 0 ? 'rgba(239,255,85,0.25)' : 'rgba(255,255,255,0.08)'}
            initial={{ opacity: 0, scale: 0 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5 + i * 0.1, duration: 0.4 }}
          />
        );
      })}

      {/* Center text */}
      <text x={cx} y={cx - 12} textAnchor="middle" className="fill-white font-black" style={{ fontSize: '36px', fontFamily: 'inherit' }}>
        {progress}%
      </text>
      <text x={cx} y={cx + 10} textAnchor="middle" className="fill-zinc-500" style={{ fontSize: '9px', fontFamily: 'inherit', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase' }}>
        Avg Progress
      </text>
    </svg>
  );
};

export default function PlanLibraryPage({ type = 'guided' }) {
  const { user, isLoaded } = useUser();
  const { usageData } = useUsage();
  const navigate = useNavigate();
  const location = useLocation();
  const [studyPlans, setStudyPlans] = useState([]);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(location.state?.toast || null);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('all');

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
      setLoading(true);
      const res = await fetch(`${API_BASE}/api/study-plans/user/${user.id}`);
      const data = await res.json();
      if (data.success) setStudyPlans(data.courses || []);
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

  const sourceFilteredPlans = useMemo(() => (
    studyPlans.filter((plan) => isPlaylist ? plan.sourceType === 'playlist' : plan.sourceType !== 'playlist')
  ), [isPlaylist, studyPlans]);

  const stats = useMemo(() => {
    const total = sourceFilteredPlans.length;
    const completed = sourceFilteredPlans.filter(p => p.progress === 100).length;
    const inProgress = sourceFilteredPlans.filter(p => p.progress > 0 && p.progress < 100).length;
    const totalLessons = sourceFilteredPlans.reduce((acc, p) => acc + (p.totalSubtopics || p.totalDays || 0), 0);
    const doneLessons = sourceFilteredPlans.reduce((acc, p) => acc + (p.completedSubtopics || p.completedDays || 0), 0);
    const avgProgress = total === 0 ? 0 : Math.round(sourceFilteredPlans.reduce((acc, p) => acc + (p.progress || 0), 0) / total);
    return { total, completed, inProgress, totalLessons, doneLessons, avgProgress };
  }, [sourceFilteredPlans]);

  const filteredPlans = useMemo(() => {
    return sourceFilteredPlans
      .filter((plan) => {
        if (activeTab === 'in-progress') return plan.progress < 100;
        if (activeTab === 'completed') return plan.progress === 100;
        return true;
      })
      .filter((plan) => {
        if (searchQuery.trim() === '') return true;
        return plan.course_title.toLowerCase().includes(searchQuery.toLowerCase());
      })
      .sort((left, right) => new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0));
  }, [sourceFilteredPlans, activeTab, searchQuery]);

  const openPlan = (plan) => {
    if (plan.sourceType === 'playlist') navigate(`/playlist/${plan._id}`);
    else navigate(`/dashboard/guided/study-plan/${plan._id}`);
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
  const createLink = isPlaylist ? '/create/playlist' : '/create/guided';
  const eyebrow = isPlaylist ? 'Video Learning' : 'AI Curriculum';
  const description = isPlaylist
    ? 'All your imported YouTube playlists, structured and organized into actionable, day-by-day learning schedules.'
    : 'Your personal, AI-generated curriculums tailored specifically to your learning goals and timeline.';
  const emptyMessage = isPlaylist
    ? 'Convert your favorite YouTube playlists into structured daily learning plans.'
    : 'Let AI craft the perfect curriculum for whatever you want to learn next.';

  const tabLabels = { all: 'All Plans', 'in-progress': 'In Progress', completed: 'Completed' };

  return (
    <DashboardShell title={title} eyebrow="Study library" usageData={usageData}>
      {/* Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -16 }} className="fixed left-1/2 top-6 z-[2000] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#12141c]/95 px-5 py-3 text-sm font-bold text-zinc-200 shadow-2xl backdrop-blur-xl">
            {toast.message || toast}
          </motion.div>
        )}
      </AnimatePresence>

      <div className="mx-auto max-w-[96rem] space-y-7 font-nunito antialiased text-white">

        {/* ═══════════════════════════════════════════════════════════════════
            HERO PANEL — Premium Command Center
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] shadow-[0_20px_60px_rgba(0,0,0,0.6)]"
        >
          {/* Ambient glows */}
          <div className="absolute -left-40 -top-40 h-[28rem] w-[28rem] rounded-full bg-[#efff55] opacity-[0.025] blur-[140px] pointer-events-none" />
          <div className="absolute -right-20 top-0 h-72 w-72 rounded-full bg-[#efff55] opacity-[0.015] blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-1/3 h-52 w-52 rounded-full bg-white/[0.01] blur-[80px] pointer-events-none" />
          {/* Dot grid texture */}
          <div className="absolute inset-0 opacity-[0.012] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, #efff55 1px, transparent 1px)', backgroundSize: '28px 28px' }} />

          <div className="relative z-10 p-8 md:p-10 lg:p-12">
            <div className="flex flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">

              {/* ── Left Column: Info + CTA ── */}
              <div className="flex-1 max-w-xl">
                {/* Eyebrow */}
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="inline-flex items-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.03] px-4 py-2 mb-6 backdrop-blur-md"
                >
                  <Icon className="h-4 w-4 text-[#efff55]" />
                  <span className="text-[11px] font-black uppercase tracking-[0.2em] text-[#efff55]">{eyebrow}</span>
                </motion.div>

                {/* Title */}
                <motion.h2
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.15, duration: 0.45 }}
                  className="text-[2.5rem] md:text-[3rem] font-extrabold tracking-tight text-white leading-[1.1] mb-4"
                >
                  {title}
                </motion.h2>

                {/* Description */}
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2, duration: 0.45 }}
                  className="text-[15px] leading-7 text-zinc-400 mb-7"
                >
                  {description}
                </motion.p>

                {/* Inline stat chips row */}
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.28, duration: 0.4 }}
                  className="flex items-center gap-3 flex-wrap mb-8"
                >
                  {[
                    { label: 'Total', val: stats.total },
                    { label: 'Active', val: stats.inProgress, lime: true },
                    { label: 'Done', val: stats.completed },
                    { label: isPlaylist ? 'Days' : 'Lessons', val: stats.doneLessons },
                  ].map((chip, i) => (
                    <div
                      key={i}
                      className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-[11px] font-extrabold uppercase tracking-wider backdrop-blur-sm transition-all hover:scale-105 ${
                        chip.lime
                          ? 'border border-[#efff55]/15 bg-[#efff55]/[0.06] text-[#efff55]'
                          : 'border border-white/[0.06] bg-white/[0.03] text-zinc-300'
                      }`}
                    >
                      <span className="font-black"><Counter value={chip.val} /></span>
                      <span className="text-zinc-500">{chip.label}</span>
                    </div>
                  ))}
                </motion.div>

                {/* CTA Button */}
                <motion.button
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.35, duration: 0.4 }}
                  whileHover={{ scale: 1.03, boxShadow: '0 0 30px rgba(239,255,85,0.25)' }}
                  whileTap={{ scale: 0.97 }}
                  onClick={() => navigate(createLink)}
                  className="group inline-flex items-center gap-3 rounded-2xl bg-[#efff55] px-6 py-3.5 text-[13px] font-extrabold text-black transition-all"
                >
                  <div className="flex h-6 w-6 items-center justify-center rounded-lg bg-black/10">
                    <Plus className="h-3.5 w-3.5 transition-transform group-hover:rotate-90 duration-300" />
                  </div>
                  New {isPlaylist ? 'Playlist' : 'Guided'} Plan
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 duration-300" />
                </motion.button>
              </div>

              {/* ── Right Column: Orbital Progress Visualization ── */}
              <motion.div
                initial={{ opacity: 0, scale: 0.85 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.6, ease: 'easeOut' }}
                className="relative flex-shrink-0 w-[280px] h-[280px] mx-auto lg:mx-0"
              >
                {/* Glow behind the ring */}
                <div className="absolute inset-0 rounded-full bg-[#efff55] opacity-[0.03] blur-[60px] pointer-events-none" />

                {/* The SVG ring */}
                <div className="relative w-full h-full flex items-center justify-center">
                  <OrbitalRing progress={stats.avgProgress} />
                </div>
              </motion.div>
            </div>
          </div>
        </motion.section>

        {/* ═══════════════════════════════════════════════════════════════════
            TOOLBAR — Tabs + Search
        ═══════════════════════════════════════════════════════════════════ */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.4 }}
          className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          {/* Tab capsule */}
          <div className="flex items-center gap-1 bg-[#141414] rounded-2xl p-1.5 border border-white/[0.04]">
            {Object.entries(tabLabels).map(([key, label]) => (
              <button
                key={key}
                onClick={() => setActiveTab(key)}
                className={`px-5 py-2 rounded-xl text-xs font-bold transition-all duration-200 uppercase tracking-wider ${
                  activeTab === key
                    ? 'bg-white text-black shadow-[0_2px_10px_rgba(255,255,255,0.1)]'
                    : 'text-zinc-500 hover:text-zinc-300 hover:bg-white/[0.03]'
                }`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="relative max-w-sm w-full">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-500 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by course title..."
              className="w-full h-10 pl-10 pr-4 rounded-xl border border-white/[0.05] bg-[#141414] text-xs text-white placeholder-zinc-600 outline-none transition-all focus:border-[#efff55]/30 focus:bg-[#161616] focus:shadow-[0_0_0_3px_rgba(239,255,85,0.06)]"
            />
          </div>
        </motion.div>

        {/* ═══════════════════════════════════════════════════════════════════
            CONTENT GRID
        ═══════════════════════════════════════════════════════════════════ */}
        {loading ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-80 animate-pulse rounded-[2.2rem] border border-white/[0.05] bg-white/[0.03]" />
            ))}
          </div>
        ) : filteredPlans.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center rounded-[2.2rem] border border-white/[0.06] bg-[#141414] py-24 px-6 text-center shadow-[0_20px_50px_rgba(0,0,0,0.4)]"
          >
            <div className="relative h-20 w-20 mb-6">
              <div className="absolute inset-0 rounded-full bg-[#efff55] opacity-[0.04] blur-[20px]" />
              <div className="relative h-full w-full rounded-full bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-zinc-500">
                {isPlaylist ? <PlayCircle className="h-8 w-8" /> : <Sparkles className="h-8 w-8" />}
              </div>
            </div>
            <h3 className="text-2xl font-extrabold text-white mb-3">No Plans Found</h3>
            <p className="max-w-md text-sm leading-6 text-zinc-500 mb-8">
              {searchQuery.trim() !== ''
                ? `No courses matched "${searchQuery}" under this filter.`
                : emptyMessage}
            </p>
            {searchQuery.trim() === '' && (
              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                onClick={() => navigate(createLink)}
                className="inline-flex items-center gap-2.5 rounded-2xl bg-[#efff55] px-6 py-3.5 text-xs font-extrabold text-black transition hover:shadow-[0_0_20px_rgba(239,255,85,0.25)]"
              >
                <Plus className="h-3.5 w-3.5" /> Create {isPlaylist ? 'Playlist' : 'Guided'} Plan
              </motion.button>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.45 }}
            className="grid gap-6 md:grid-cols-2 lg:grid-cols-3"
          >
            {filteredPlans.map((plan, i) => (
              <motion.div
                key={plan._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.05 + i * 0.06, duration: 0.4 }}
                className="h-full"
              >
                <DarkPlanCard plan={plan} onOpen={openPlan} onDelete={setDeleteTarget} />
              </motion.div>
            ))}
          </motion.div>
        )}
      </div>

      <DeletePlanModal plan={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </DashboardShell>
  );
}
