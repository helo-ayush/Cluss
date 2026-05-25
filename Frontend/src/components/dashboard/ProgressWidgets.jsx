import React from 'react';
import { motion } from 'motion/react';
import { Brain, Layers3, PlayCircle, Target, Plus, Zap, Activity } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function ProgressWidgets({ studyPlans, stats, clerkId }) {
  const navigate = useNavigate();
  const totalActivePlans = studyPlans.filter((plan) => plan.progress > 0 && plan.progress < 100).length;
  const completedPlans = studyPlans.filter((plan) => plan.progress === 100).length;
  const averageProgress = studyPlans.length
    ? Math.round(studyPlans.reduce((sum, plan) => sum + (plan.progress || 0), 0) / studyPlans.length)
    : 0;

  // Chronological Course Generation History Builder (100% Genuine database representation)
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
    const history = [0]; // base baseline
    events.forEach((ev) => {
      if (ev.type === 'create') {
        current += 1;
      } else if (ev.type === 'complete') {
        current = Math.max(0, current - 1);
      }
      history.push(current);
    });

    // Pad array to look like a smooth timeline if there are few events
    while (history.length < 5) {
      history.push(current);
    }

    return history;
  }, [studyPlans]);

  // Map values to coordinates [4, 96] x [4, 24] inside 100x30 viewBox
  const svgPath = React.useMemo(() => {
    const points = activeTrendPoints;
    const N = points.length;
    const maxVal = Math.max(...points, 1);
    
    return points
      .map((val, i) => {
        const x = Math.round(4 + (i / (N - 1)) * 92);
        const y = Math.round(24 - (val / maxVal) * 20);
        return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  }, [activeTrendPoints]);

  const lastPointCoords = React.useMemo(() => {
    const points = activeTrendPoints;
    const N = points.length;
    const maxVal = Math.max(...points, 1);
    const x = Math.round(4 + ((N - 1) / (N - 1)) * 92);
    const y = Math.round(24 - (points[N - 1] / maxVal) * 20);
    return { x, y };
  }, [activeTrendPoints]);

  return (
    <div className="space-y-6 font-nunito antialiased text-white">
      
      {/* 1. Side-by-Side Analytics Grid */}
      <section id="progress" className="grid gap-5 md:grid-cols-[1.3fr_1fr]">
        
        {/* Primary Highlight Card - Lime Yellow "Active Courses" Box */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          onClick={() => navigate('/create/guided')}
          className="relative overflow-hidden rounded-[2rem] bg-[#efff55] p-5 text-black flex flex-col justify-between h-[11.5rem] shadow-[0_20px_45px_rgba(239,255,85,0.08)] hover:scale-[1.015] hover:shadow-[0_20px_50px_rgba(239,255,85,0.18)] transition-all duration-300 cursor-pointer"
        >
          {/* Top bar inside card */}
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <h2 className="text-sm font-bold text-black tracking-tight">Active courses</h2>
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-black text-[10px] font-bold text-[#efff55]">
                {studyPlans.length}
              </span>
            </div>
            <button 
              type="button" 
              onClick={(e) => { e.stopPropagation(); navigate('/create/guided'); }}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-black/10 text-black hover:bg-black/20 transition-all duration-200"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>

          {/* Bottom items row inside card with large graph cutout */}
          <div className="flex items-center justify-between gap-4 mt-1">
            <div className="flex items-center gap-2 bg-black/10 rounded-full px-3.5 py-1.5 border border-black/5">
              <span className="text-xl font-bold tracking-tight text-black leading-none">{totalActivePlans}</span>
              <span className="text-[9px] font-bold uppercase tracking-wider text-black/60">In Progress</span>
            </div>

            {/* Genuine dynamic SVG Trend Wave Graph (Clean dark stroke and peak dot) */}
            <div className="flex-1 max-w-[10rem] opacity-90 mr-2">
              <svg className="h-10 w-full text-black" viewBox="0 0 100 30" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round">
                <path d={svgPath} />
                <circle cx={lastPointCoords.x} cy={lastPointCoords.y} r="3" className="fill-black stroke-black" />
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
          className="rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 flex flex-col justify-between h-[11.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:scale-[1.015] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-300 cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-bold text-white tracking-tight">Learning Vitals</h2>
          </div>

          {/* Stats Columns with divide-x borders */}
          <div className="grid grid-cols-3 divide-x divide-white/[0.06] mt-4 mb-1">
            <div className="pr-2 flex flex-col justify-center">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-zinc-400 block leading-tight">Lessons Completed</span>
              <span className="text-xl font-bold text-white mt-1 block leading-none">{stats.completedSubtopics || 0}</span>
              <span className="text-[11px] font-bold text-zinc-500 block mt-1">finished</span>
            </div>
            <div className="px-3 flex flex-col justify-center">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-zinc-400 block leading-tight">Focus Accuracy</span>
              <span className="text-xl font-bold text-white mt-1 block leading-none">{averageProgress}%</span>
              <span className="text-[11px] font-bold text-zinc-500 block mt-1">progress avg</span>
            </div>
            <div className="pl-3 flex flex-col justify-center">
              <span className="text-[11.5px] font-bold uppercase tracking-wider text-zinc-400 block leading-tight">Total Library</span>
              <span className="text-xl font-bold text-white mt-1 block leading-none">{studyPlans.length}</span>
              <span className="text-[11px] font-bold text-zinc-500 block mt-1">courses gen</span>
            </div>
          </div>
        </motion.div>

      </section>

      {/* 2. Direct Momentum Chart integration inside main cockpit */}
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
        
        // Premium Step Completed Units Shading: more units = limer/neon glowing lime color
        const color = count === 0
          ? 'transparent'
          : count === 1
            ? '#7ca321' // elegant muted lime green
            : count === 2
              ? '#a2c92a' // bright green-lime
              : count === 3
                ? '#cbf238' // vibrant glowing lime
                : '#efff55'; // full vibrant neon lime yellow
              
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
      whileHover={{ y: -2 }}
      className="h-[22rem] flex flex-col justify-between rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-300"
    >
      <div className="flex items-start justify-between gap-4 shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-zinc-300 border border-white/[0.04]">
            <Activity className="h-4 w-4" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-white tracking-tight">Weekly learning signals</h2>
          </div>
        </div>
        {streak > 0 && (
          <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10.5px] font-bold text-white tracking-wide uppercase">
            🔥 {streak}d streak
          </span>
        )}
      </div>
      
      {/* Ovals Chart (Beautiful vertical ovals exactly as in reference image) */}
      <div className="flex items-end gap-3 px-1 my-3 justify-between">
        {bars.map((bar, index) => (
          <div key={index} className="group relative flex flex-1 flex-col items-center gap-2 cursor-pointer">
            {/* Tooltip */}
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2.5 py-1 text-[9px] font-bold text-black opacity-0 shadow-xl transition-all duration-200 group-hover:-top-10 group-hover:opacity-100">
              {bar.count} unit{bar.count !== 1 ? 's' : ''}
              <div className="absolute -bottom-1 left-1/2 h-1.5 w-1.5 -translate-x-1/2 rotate-45 bg-white" />
            </div>

            {/* Wide vertical oval container rounded-full */}
            <div 
              className="flex w-14 sm:w-16 flex-col justify-end rounded-full bg-white/[0.03] p-1 transition-all duration-300 group-hover:bg-white/[0.06] border border-white/[0.02]" 
              style={{ height: 110 }}
            >
              {bar.count > 0 ? (
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${bar.height}%` }}
                  transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
                  className="rounded-full shadow-[0_0_15px_rgba(255,255,255,0.05)] w-full"
                  style={{
                    background: bar.color,
                  }}
                />
              ) : (
                /* Dynamic visual flat dot baseline for zero units at the bottom of the oval */
                <div className="mx-auto h-1.5 w-1.5 rounded-full bg-zinc-700 mb-1 transition-colors group-hover:bg-zinc-500" />
              )}
            </div>
            
            <span className={`text-[11px] font-bold tracking-wider transition-colors duration-300 ${
              bar.isToday 
                ? 'text-[#efff55] font-black border-b border-[#efff55]/60 pb-0.5' 
                : 'text-zinc-500 group-hover:text-zinc-300'
            }`}>
              {bar.label}
            </span>
          </div>
        ))}
      </div>
      
      {/* Footer details row */}
      <div className="mt-auto flex items-center justify-between gap-3 text-xs border-t border-white/[0.04] pt-4 px-1 shrink-0">
        <span className="text-zinc-400 font-bold text-xs">
          {weeklyTotal} unit{weeklyTotal !== 1 ? 's' : ''} this week · {done}/{total} lessons
        </span>
        <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-[10.5px] font-bold text-white uppercase tracking-wider">{pct}% completed</span>
      </div>
    </motion.section>
  );
}
