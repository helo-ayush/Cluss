import React from 'react';
import { motion } from 'framer-motion';
import { Brain, Layers3, PlayCircle, Target, Plus, Zap, Activity, ArrowUpRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProgressWidgets({ studyPlans, stats, clerkId, isDashboard }) {
  const navigate = useNavigate();
  const totalActivePlans = studyPlans.filter((plan) => plan.progress > 0 && plan.progress < 100).length;
  const completedPlans = studyPlans.filter((plan) => plan.progress === 100).length;
  const averageProgress = studyPlans.length
    ? Math.round(studyPlans.reduce((sum, plan) => sum + (plan.progress || 0), 0) / studyPlans.length)
    : 0;

  // Chronological Course Generation History Builder (Genuine representation)
  const activeTrendPoints = React.useMemo(() => {
    if (!studyPlans || studyPlans.length === 0) {
      return [0, 0, 0, 0, 0]; 
    }

    const events = [];
    studyPlans.forEach((plan) => {
      const createdTime = plan.createdAt ? new Date(plan.createdAt).getTime() : 0;
      events.push({ time: createdTime, type: 'create' });

      if (plan.progress === 100) {
        const completedTime = plan.updatedAt ? new Date(plan.updatedAt).getTime() : createdTime + 86400000;
        events.push({ time: completedTime, type: 'complete' });
      }
    });

    events.sort((a, b) => a.time - b.time);

    let current = 0;
    const history = [0]; // baseline
    events.forEach((ev) => {
      if (ev.type === 'create') {
        current += 1;
      } else if (ev.type === 'complete') {
        current = Math.max(0, current - 1);
      }
      history.push(current);
    });

    // Pad array to look like a smooth timeline
    while (history.length < 5) {
      history.push(current);
    }

    return history;
  }, [studyPlans]);

  // Map values to coordinates inside 120x40 viewBox
  const svgPath = React.useMemo(() => {
    const points = activeTrendPoints;
    const N = points.length;
    const maxVal = Math.max(...points, 1);
    
    return points
      .map((val, i) => {
        const x = Math.round(5 + (i / (N - 1)) * 110);
        const y = Math.round(35 - (val / maxVal) * 28);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [activeTrendPoints]);

  const lastPointCoords = React.useMemo(() => {
    const points = activeTrendPoints;
    const N = points.length;
    const maxVal = Math.max(...points, 1);
    const x = Math.round(5 + ((N - 1) / (N - 1)) * 110);
    const y = Math.round(35 - (points[N - 1] / maxVal) * 28);
    return { x, y };
  }, [activeTrendPoints]);

  return (
    <div className="space-y-6 font-nunito text-white">
      
      {/* 1. Side-by-Side Analytics Grid */}
      <section className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
        
        {/* Primary Highlight Card - Parrot Green/Yellow in Dashboard, Dark/Neon in Progress */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          onClick={() => navigate('/create/guided')}
          className={
            isDashboard
              ? "relative overflow-hidden rounded-[2.2rem] bg-[#efff55] p-6 text-black flex flex-col justify-between h-[12.5rem] shadow-[0_20px_50px_rgba(239,255,85,0.15)] hover:scale-[1.01] hover:shadow-[0_20px_50px_rgba(239,255,85,0.25)] transition-all duration-300 cursor-pointer group"
              : "relative overflow-hidden rounded-[2.2rem] border border-[#efff55]/20 bg-[#1b1b1b] p-6 text-white flex flex-col justify-between h-[12.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:border-[#efff55]/40 transition-all duration-300 cursor-pointer group"
          }
        >
          {/* Subtle Backglow (only for dark progress variant) */}
          {!isDashboard && (
            <div className="absolute -right-10 -top-10 -z-10 h-32 w-32 rounded-full bg-[#efff55]/10 blur-2xl group-hover:bg-[#efff55]/15 transition-all duration-300" />
          )}

          {/* Top Row */}
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <span className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDashboard ? 'text-black/60' : 'text-[#efff55]'}`}>
                Workspace Overview
              </span>
              <div className="flex items-center gap-2">
                <h2 className={`text-xl font-black tracking-tight ${isDashboard ? 'text-black' : 'text-white'}`}>Active Courses</h2>
                <span className={`flex h-5 w-5 items-center justify-center rounded-full text-[10px] font-bold ${
                  isDashboard 
                    ? 'bg-black/10 text-black border border-black/10' 
                    : 'bg-[#efff55]/10 text-[#efff55] border border-[#efff55]/20'
                }`}>
                  {studyPlans.length}
                </span>
              </div>
            </div>
            
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); navigate('/create/guided'); }}
              className={`flex h-10 w-10 items-center justify-center rounded-full transition-all duration-300 shadow-md ${
                isDashboard
                  ? 'bg-black/10 text-black border border-black/5 hover:bg-black/20'
                  : 'bg-white/[0.04] text-[#efff55] border border-white/[0.06] hover:bg-[#efff55] hover:text-black hover:border-[#efff55]'
              }`}
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>

          {/* Bottom items row with graph */}
          <div className="flex items-end justify-between gap-4 mt-2">
            <div className="space-y-1">
              <div className={`inline-flex items-center gap-2 rounded-2xl px-4 py-2 border ${
                isDashboard
                  ? 'bg-black/10 border-black/5'
                  : 'bg-white/[0.03] border-white/[0.06]'
              }`}>
                <span className={`text-2xl font-black leading-none ${isDashboard ? 'text-black' : 'text-[#efff55]'}`}>{totalActivePlans}</span>
                <span className={`text-[10px] font-bold uppercase tracking-wider ${isDashboard ? 'text-black/60' : 'text-zinc-400'}`}>In Progress</span>
              </div>
            </div>

            {/* Dynamic SVG Trend Wave Graph */}
            <div className="flex-1 max-w-[12rem] mr-2 relative h-12">
              <svg className={`h-full w-full ${isDashboard ? 'text-black' : 'text-[#efff55]'}`} viewBox="0 0 120 40" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d={svgPath} className={!isDashboard ? "drop-shadow-[0_0_8px_rgba(239,255,85,0.4)]" : ""} />
                <circle cx={lastPointCoords.x} cy={lastPointCoords.y} r="3" className={isDashboard ? "fill-black stroke-[#efff55] stroke-2" : "fill-[#efff55] stroke-[#1b1b1b] stroke-2"} />
              </svg>
            </div>
          </div>
        </motion.div>

        {/* Secondary Stats Card - Learning Vitals Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.05, duration: 0.45 }}
          className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 flex flex-col justify-between h-[12.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          <div>
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Performance Metrics</span>
            <h2 className="text-xl font-black tracking-tight text-white mt-0.5">Learning Vitals</h2>
          </div>

          {/* Stats Columns with divide-x borders */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] mt-4 mb-1">
            <div className="pr-2 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block leading-tight">Lessons Done</span>
              <span className="text-2xl font-black text-white mt-1.5 block leading-none">{stats.completedSubtopics || 0}</span>
              <span className="text-[10px] font-bold text-zinc-500 block mt-1">subtopics</span>
            </div>
            <div className="px-4 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block leading-tight">Focus Accuracy</span>
              <span className="text-2xl font-black text-[#efff55] mt-1.5 block leading-none">{averageProgress}%</span>
              <span className="text-[10px] font-bold text-zinc-500 block mt-1">avg progress</span>
            </div>
            <div className="pl-4 flex flex-col justify-center">
              <span className="text-[10px] font-black uppercase tracking-wider text-zinc-400 block leading-tight">Total Library</span>
              <span className="text-2xl font-black text-white mt-1.5 block leading-none">{studyPlans.length}</span>
              <span className="text-[10px] font-bold text-zinc-500 block mt-1">generated</span>
            </div>
          </div>
        </motion.div>

      </section>

      {/* 2. Direct Momentum Chart integration */}
      <MomentumPanel stats={stats} clerkId={clerkId} />

    </div>
  );
}

export function MomentumPanel({ stats, clerkId }) {
  const total = Math.max(stats.totalSubtopics || 0, 1);
  const done = Math.min(stats.completedSubtopics || 0, total);
  const pct = Math.round((done / total) * 100);

  const [weekData, setWeekData] = React.useState([]);
  const [streak, setStreak] = React.useState(0);
  const [weeklyTotal, setWeeklyTotal] = React.useState(0);

  React.useEffect(() => {
    if (!clerkId) return;
    const API = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';
    fetch(`${API}/api/activity/${clerkId}?days=7`)
      .then((r) => r.json())
      .then((data) => {
        if (data.success) {
          setWeekData(data.activity || []);
          setStreak(data.streak || 0);
          setWeeklyTotal(data.totalThisWeek || 0);
        }
      })
      .catch(() => {});
  }, [clerkId]);

  const maxCount = Math.max(...weekData.map((d) => d.subtopicsCompleted), 1);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const bars = weekData.length === 7
    ? weekData.map((d) => {
        const count = d.subtopicsCompleted;
        const height = count === 0 ? 0 : Math.max(Math.round((count / maxCount) * 100), 8);
        
        // Premium HSL neon scale
        const color = count === 0
          ? 'transparent'
          : count === 1
            ? 'linear-gradient(to top, #7ca321, #8ebf22)'
            : count === 2
              ? 'linear-gradient(to top, #a2c92a, #b3de2a)'
              : count === 3
                ? 'linear-gradient(to top, #cbf238, #dfff44)'
                : 'linear-gradient(to top, #efff55, #f5ff88)';
              
        return {
          height,
          count,
          label: dayLabels[new Date(d.date + 'T00:00:00').getDay()],
          isToday: d.date === new Date().toISOString().slice(0, 10),
          color,
        };
      })
    : Array.from({ length: 7 }, () => ({ height: 0, count: 0, label: '', isToday: false, color: 'transparent' }));

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ delay: 0.1, duration: 0.45 }}
      className="h-[23rem] flex flex-col justify-between rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group"
    >
      {/* Decorative Wave Aura */}
      <div className="absolute right-0 bottom-0 -z-10 h-48 w-48 rounded-full bg-[#efff55]/5 blur-3xl opacity-50 group-hover:scale-110 transition-all duration-500" />

      <div className="flex items-start justify-between gap-4 shrink-0">
        <div>
          <h2 className="text-xl font-black text-white tracking-tight">Weekly Learning Signals</h2>
        </div>
        
        {streak > 0 && (
          <span className="rounded-full bg-[#efff55]/10 border border-[#efff55]/20 px-3.5 py-1 text-[11px] font-black text-[#efff55] tracking-wide uppercase animate-pulse">
            🔥 {streak} Day Streak
          </span>
        )}
      </div>
      
      {/* Ovals Chart */}
      <div className="flex items-end gap-3 px-1 my-4 justify-between flex-1">
        {bars.map((bar, index) => (
          <div key={index} className="group/bar relative flex flex-1 flex-col items-center gap-2.5 cursor-pointer">
            
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/[0.06] bg-[#1b1b1b] px-2.5 py-1.5 text-[10px] font-black text-[#efff55] opacity-0 shadow-2xl transition-all duration-200 group-hover/bar:-top-10 group-hover/bar:opacity-100">
              {bar.count} unit{bar.count !== 1 ? 's' : ''}
              <div className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 border-b border-r border-white/[0.06] bg-[#1b1b1b]" />
            </div>

            {/* Wide vertical oval container */}
            <div 
              className="flex w-14 sm:w-16 flex-col justify-end rounded-full bg-white/[0.02] p-1 transition-all duration-300 group-hover/bar:bg-white/[0.04] border border-white/[0.04] h-[120px] sm:h-[130px]" 
            >
              {bar.count > 0 ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.height}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
                  className="rounded-full shadow-[0_0_12px_rgba(239,255,85,0.15)] w-full"
                  style={{
                    background: bar.color,
                  }}
                />
              ) : (
                <div className="mx-auto h-1.5 w-1.5 rounded-full bg-zinc-700 mb-1 transition-colors group-hover/bar:bg-zinc-500" />
              )}
            </div>
            
            <span className={`text-[11px] font-black tracking-wider transition-colors duration-300 ${
              bar.isToday 
                ? 'text-[#efff55] border-b border-[#efff55]/60 pb-0.5' 
                : 'text-zinc-500 group-hover/bar:text-zinc-300'
            }`}>
              {bar.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Footer details row */}
      <div className="mt-auto flex items-center justify-between gap-3 text-xs border-t border-white/[0.04] pt-4 px-1 shrink-0">
        <span className="text-zinc-400 font-bold">
          {weeklyTotal} unit{weeklyTotal !== 1 ? 's' : ''} this week · {done}/{total} lessons
        </span>
        <span className="rounded-full bg-white/[0.03] border border-white/[0.06] px-3.5 py-1 text-[10.5px] font-black text-white uppercase tracking-wider">{pct}% completed</span>
      </div>
    </motion.section>
  );
}
