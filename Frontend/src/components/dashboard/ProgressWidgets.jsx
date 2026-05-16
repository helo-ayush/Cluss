import React from 'react';
import { motion } from 'motion/react';
import { Brain, Layers3, PlayCircle, Target } from 'lucide-react';

function StatTile({ icon: Icon, label, value, detail, accent = '#f5f5f5', delay = 0 }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-80px' }}
      transition={{ delay, duration: 0.45 }}
      whileHover={{ y: -6, scale: 1.015 }}
      className="group relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#171717] p-5 shadow-[0_20px_70px_rgba(0,0,0,0.25)]"
    >
      <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full opacity-25 blur-2xl transition group-hover:opacity-45" style={{ backgroundColor: accent }} />
      <div className="relative flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{label}</p>
          <p className="mt-4 text-4xl font-black text-white">{value}</p>
        </div>
        <div className="flex h-12 w-12 items-center justify-center rounded-full text-black transition duration-300 group-hover:rotate-6 group-hover:scale-110" style={{ backgroundColor: accent }}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
      <p className="relative mt-4 text-sm leading-6 text-zinc-400">{detail}</p>
    </motion.div>
  );
}

export default function ProgressWidgets({ studyPlans, stats }) {
  const totalActivePlans = studyPlans.filter((plan) => plan.progress > 0 && plan.progress < 100).length;
  const completedPlans = studyPlans.filter((plan) => plan.progress === 100).length;
  const averageProgress = studyPlans.length
    ? Math.round(studyPlans.reduce((sum, plan) => sum + (plan.progress || 0), 0) / studyPlans.length)
    : 0;

  return (
    <section id="progress" className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
      <StatTile icon={Layers3} label="Study plans" value={studyPlans.length} detail="Everything active in your study system." accent="#f5f5f5" />
      <StatTile icon={Brain} label="Units finished" value={stats.completedSubtopics || 0} detail="Lessons and checkpoints completed." accent="#A3FF4F" delay={0.04} />
      <StatTile icon={PlayCircle} label="In progress" value={totalActivePlans} detail="Plans with real forward motion." accent="#FF9F1C" delay={0.08} />
      <StatTile icon={Target} label="Avg progress" value={`${averageProgress}%`} detail={`${completedPlans} fully completed plans.`} accent="#f5f5f5" delay={0.12} />
    </section>
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

  // Normalize bar heights: tallest bar = 100%
  const maxCount = Math.max(...weekData.map((d) => d.subtopicsCompleted), 1);
  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const bars = weekData.length === 7
    ? weekData.map((d) => ({
        height: Math.max(Math.round((d.subtopicsCompleted / maxCount) * 100), 8),
        count: d.subtopicsCompleted,
        label: dayLabels[new Date(d.date + 'T00:00:00').getDay()],
        isToday: d.date === new Date().toISOString().slice(0, 10),
      }))
    : Array.from({ length: 7 }, () => ({ height: 8, count: 0, label: '', isToday: false }));

  return (
    <section className="rounded-[2.4rem] border border-white/10 bg-[#171717] p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Momentum</p>
          <h2 className="mt-3 text-3xl font-black text-white">Learning signal</h2>
        </div>
        <div className="flex items-center gap-2">
          {streak > 0 && (
            <span className="rounded-full bg-[#A3FF4F]/15 px-3 py-1 text-xs font-black text-[#A3FF4F]">
              🔥 {streak}d streak
            </span>
          )}
          <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">LIVE</span>
        </div>
      </div>
      <div className="mt-8 flex items-end gap-3">
        {bars.map((bar, index) => (
          <div key={index} className="group relative flex flex-1 flex-col items-center gap-2 cursor-pointer">
            {/* Hover Tooltip */}
            <div className="pointer-events-none absolute -top-8 left-1/2 z-10 -translate-x-1/2 whitespace-nowrap rounded-md bg-white px-2 py-1 text-[10px] font-bold text-black opacity-0 shadow-xl transition-all duration-200 group-hover:-top-10 group-hover:opacity-100">
              {bar.count} unit{bar.count !== 1 ? 's' : ''}
              <div className="absolute -bottom-1 left-1/2 h-2 w-2 -translate-x-1/2 rotate-45 bg-white" />
            </div>

            <div className="flex w-full flex-col justify-end rounded-full bg-white/5 p-1 transition-colors duration-300 group-hover:bg-white/10" style={{ height: 150 }}>
              <motion.div
                initial={{ height: 0 }}
                animate={{ height: `${bar.height}%` }}
                transition={{ delay: index * 0.05, duration: 0.5, ease: 'easeOut' }}
                className="rounded-full transition-all duration-300 group-hover:scale-x-[1.08] group-hover:shadow-[0_0_15px_rgba(255,255,255,0.15)]"
                style={{
                  background: bar.isToday ? '#A3FF4F' : bar.count > 0 ? '#fff' : '#555',
                  opacity: bar.isToday ? 1 : bar.count > 0 ? 0.72 : 0.3,
                }}
              />
            </div>
            <span className={`text-[10px] font-bold transition-colors duration-300 ${bar.isToday ? 'text-[#A3FF4F]' : 'text-zinc-600 group-hover:text-zinc-300'}`}>
              {bar.label}
            </span>
          </div>
        ))}
      </div>
      <div className="mt-5 flex items-center justify-between gap-3 text-sm">
        <span className="font-bold text-zinc-400">
          {weeklyTotal} unit{weeklyTotal !== 1 ? 's' : ''} this week · {done}/{total} total
        </span>
        <span className="rounded-full bg-white px-3 py-1 text-xs font-black text-black">{pct}% complete</span>
      </div>
    </section>
  );
}
