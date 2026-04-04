import React, { useState, useEffect, useRef } from 'react';
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Leaderboard from '../components/Leaderboard';
import { MagicCard } from '../components/magicui/MagicCard';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import MarkdownRenderer from '../components/MarkdownRenderer';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const FORGE_STEPS = [
  { icon: 'psychology',     text: 'Analyzing your learning goal...',       color: '#818cf8' },
  { icon: 'auto_awesome',   text: 'Designing personalized curriculum...',  color: '#6366f1' },
  { icon: 'travel_explore', text: 'Finding best YouTube tutorials...',     color: '#4f46e5' },
  { icon: 'video_library',  text: 'Curating top-rated video lessons...',   color: '#a78bfa' },
  { icon: 'checklist',      text: 'Building your learning planner...',     color: '#34d399' },
  { icon: 'rocket_launch',  text: 'Launching your course!',               color: '#818cf8' },
];

const CARD_PALETTES = [
  { from: '#1e1b4b', to: '#4338ca', icon: '⚡' },
  { from: '#0f172a', to: '#3730a3', icon: '🔮' },
  { from: '#022c22', to: '#059669', icon: '🌿' },
  { from: '#2e1065', to: '#6d28d9', icon: '✨' },
  { from: '#0f172a', to: '#0284c7', icon: '🚀' },
  { from: '#3b0764', to: '#7e22ce', icon: '💎' },
];

// ─── Animated progress ring ───
function ProgressRing({ pct, size = 56, stroke = 4, color = '#6366f1' }) {
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ - (pct / 100) * circ;
  return (
    <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(99,102,241,0.1)" strokeWidth={stroke} />
      <motion.circle
        cx={size/2} cy={size/2} r={r} fill="none"
        stroke={color} strokeWidth={stroke} strokeLinecap="round"
        strokeDasharray={circ}
        initial={{ strokeDashoffset: circ }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 1.2, ease: 'easeOut' }}
      />
    </svg>
  );
}

// ─── Forge Progress Panel ───
function ForgeProgressPanel() {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() =>
      setActiveStep(p => (p < FORGE_STEPS.length - 1 ? p + 1 : p)), 2800);
    return () => clearInterval(iv);
  }, []);
  const pct = ((activeStep + 1) / FORGE_STEPS.length) * 100;
  const step = FORGE_STEPS[activeStep];

  return (
    <div className="relative overflow-hidden rounded-2xl p-8" style={{
      background: 'var(--dash-card-bg)',
      border: '1px solid var(--dash-card-border)',
      backdropFilter: 'blur(24px)',
    }}>
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none" style={{
        background: `radial-gradient(circle, ${step.color}15, transparent 70%)`,
        filter: 'blur(60px)', transition: 'background 0.8s ease'
      }} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `${step.color}20` }} />
            <div className="w-3 h-3 rounded-full" style={{ background: step.color }} />
          </div>
          <div>
            <p className="font-label text-xs uppercase tracking-[0.2em] font-bold" style={{ color: step.color }}>AI is forging your path</p>
            <p className="font-body text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>This usually takes 15-30 seconds</p>
          </div>
        </div>

        <div className="space-y-2 mb-6">
          {FORGE_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 transition-all duration-500" style={{ opacity: i <= activeStep ? 1 : 0.2 }}>
              <span className="material-symbols-outlined text-base shrink-0" style={{
                color: i < activeStep ? '#34d399' : i === activeStep ? s.color : 'var(--theme-text-faint)',
                fontSize: '16px'
              }}>{i < activeStep ? 'check_circle' : s.icon}</span>
              <span className="font-body text-sm" style={{
                color: i === activeStep ? 'var(--theme-text-heading)' : 'var(--theme-text-muted)',
                fontWeight: i === activeStep ? 600 : 400
              }}>{s.text}</span>
            </div>
          ))}
        </div>

        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)' }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
        <p className="text-right font-label text-xs mt-1.5" style={{ color: 'var(--theme-text-faint)' }}>{Math.round(pct)}%</p>
      </div>
    </div>
  );
}

// ─── Delete Course Modal ───
function DeleteCourseModal({ course, onConfirm, onCancel }) {
  const [inputVal, setInputVal] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleConfirm = async () => {
    if (inputVal.toLowerCase() !== 'delete') return;
    setDeleting(true);
    await onConfirm(course._id);
    setDeleting(false);
  };
 
  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(12px)' }}>
      <motion.div 
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: -20 }}
        className="relative overflow-hidden rounded-3xl p-8 max-w-md w-full text-center shadow-[0_32px_64px_rgba(0,0,0,0.5)] border border-white/10"
        style={{ background: 'linear-gradient(145deg, rgba(30,41,59,0.95) 0%, rgba(15,23,42,0.95) 100%)' }}
      >
        {/* Decorative severe background glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[80%] h-[100px] bg-red-500/20 blur-[50px] rounded-full pointer-events-none" />

        <div className="mx-auto w-16 h-16 rounded-full flex flex-col items-center justify-center mb-6 border border-red-500/30 shadow-[0_0_30px_rgba(239,68,68,0.3)] bg-red-500/10 text-red-500">
           <span className="material-symbols-outlined text-3xl">delete_forever</span>
        </div>
        
        <h3 className="font-headline text-2xl font-black italic mb-3 text-white tracking-wide">
          Delete Course
        </h3>
        <p className="text-sm mb-6 text-white/60 leading-relaxed">
          You are about to permanently delete <strong className="text-white/90">"{course.course_title}"</strong>. All associated progress, quizzes, and data will be wiped out.
        </p>

        <div className="bg-black/30 rounded-2xl p-5 mb-8 border border-white/5">
           <p className="text-xs font-label text-red-400 mb-3 tracking-widest uppercase font-bold">
             Type <span className="text-white bg-red-500/20 px-2 py-0.5 rounded ml-1 mr-1 border border-red-500/30">delete</span> below
           </p>
           <input 
             type="text"
             value={inputVal}
             onChange={(e) => setInputVal(e.target.value)}
             placeholder="delete"
             className="w-full px-4 py-3.5 rounded-xl border-2 border-transparent bg-white/5 text-white font-body text-center outline-none focus:border-red-500/50 focus:bg-white/10 transition-all font-bold tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-normal placeholder:text-white/20"
           />
        </div>

        <div className="flex gap-4">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-3.5 rounded-xl font-label text-xs sm:text-sm font-bold uppercase tracking-widest transition-all text-white/70 hover:text-white hover:bg-white/5 border border-white/10"
          >Cancel</button>
          
          <button onClick={handleConfirm} 
            disabled={deleting || inputVal.toLowerCase() !== 'delete'}
            className="flex-1 py-3.5 rounded-xl font-label text-xs sm:text-sm font-bold uppercase tracking-widest transition-all disabled:opacity-30 disabled:cursor-not-allowed bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 shadow-[0_0_20px_rgba(239,68,68,0.4)]"
          >{deleting ? <div className="w-5 h-5 rounded-full border-2 border-white border-t-transparent animate-spin"></div> : 'Confirm'}</button>
        </div>
      </motion.div>
    </div>
  );
}

// ─── Course Card ───
function CourseCard({ course, palette, onOpen, index, onDeleteClick }) {
  const pct = course.progress;
  const isCompleted = pct === 100;
  const isActive = pct > 0 && pct < 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 10) * 0.05, duration: 0.4, ease: 'easeOut' }}
      className="relative w-full cursor-pointer group"
    >
      <div className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:-translate-y-1.5"
        style={{
          background: `linear-gradient(150deg, ${palette.from} 0%, ${palette.to} 100%)`,
          boxShadow: `0 8px 28px ${palette.from}30`,
          height: '240px'
        }}>
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
        }} />
        <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
        <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }} />

        {/* Delete Button */}
        <button 
           onClick={(e) => { e.stopPropagation(); onDeleteClick(course); }}
           className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-black/20 hover:bg-red-500/80 hover:scale-110 transition-all z-20 opacity-0 group-hover:opacity-100"
        >
           <span className="material-symbols-outlined text-[16px] text-white/90">delete</span>
        </button>

        <div className="relative z-10 p-6 h-full flex flex-col justify-between cursor-pointer" onClick={onOpen}>
          <div>
            <div className="text-3xl mb-4">{palette.icon}</div>
            <h3 className="font-headline text-base md:text-lg font-bold text-white leading-snug line-clamp-3">
              {course.course_title}
            </h3>
          </div>

          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-white/60 text-[11px] font-label uppercase tracking-wider">
                {isCompleted ? 'Complete' : isActive ? 'In Progress' : 'New'}
              </span>
              <span className="text-white font-label text-sm font-bold">{pct}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
              <motion.div className="h-full rounded-full bg-white/90"
                initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: (index % 10) * 0.1 }} />
            </div>
            <p className="text-white/50 text-xs font-label mt-3">
              {course.completedSubtopics}/{course.totalSubtopics} topics
            </p>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Activity Bars ───
function ActivityBars({ activityData }) {
  const last7 = activityData.slice(-7);
  const maxVal = Math.max(...last7.map(d => d.subtopicsCompleted), 1);
  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

  return (
    <div className="flex items-end gap-2.5 h-28">
      {last7.map((day, i) => {
        const pct = (day.subtopicsCompleted / maxVal) * 100;
        const todayStr = new Date().toISOString().slice(0, 10);
        const isToday = day.date === todayStr;
        const dateObj = new Date(day.date + 'T00:00:00');
        const dayLabel = days[(dateObj.getDay() + 6) % 7];

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
            {day.subtopicsCompleted > 0 && (
              <span className="font-label text-[9px] font-bold" style={{ color: isToday ? '#818cf8' : 'var(--theme-text-muted)' }}>
                {day.subtopicsCompleted}
              </span>
            )}
            <div className="w-full relative rounded-lg overflow-hidden" style={{ height: '80px', background: 'var(--theme-border)' }}>
              <motion.div className="absolute bottom-0 left-0 right-0 rounded-lg"
                style={{ background: isToday ? 'linear-gradient(180deg, #818cf8, #4f46e5)' : 'linear-gradient(180deg, rgba(99,102,241,0.5), rgba(99,102,241,0.2))' }}
                initial={{ height: 0 }} animate={{ height: `${Math.max(pct, day.subtopicsCompleted > 0 ? 10 : 0)}%` }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
              />
              {isToday && (
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-white animate-pulse" />
              )}
            </div>
            <span className="font-label text-[9px]" style={{
              color: isToday ? '#818cf8' : 'var(--theme-text-faint)',
              fontWeight: isToday ? 700 : 400
            }}>{dayLabel}</span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Mini Calendar ───
function MiniCalendar({ activityData }) {
  const [date, setDate] = useState(new Date());
  const today = new Date();
  const year = date.getFullYear(), month = date.getMonth();
  const monthName = date.toLocaleString('default', { month: 'long' });
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const activityByDate = {};
  activityData.forEach(a => { activityByDate[a.date] = a.subtopicsCompleted; });

  const getDateStr = d => `${year}-${String(month + 1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
  const isToday = d => d === today.getDate() && month === today.getMonth() && year === today.getFullYear();

  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-3">
        <span className="font-label text-xs font-bold" style={{ color: 'var(--theme-text-heading)' }}>{monthName} {year}</span>
        <div className="flex gap-1">
          <button onClick={() => setDate(new Date(year, month - 1, 1))} className="calender-nav-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>chevron_left</span>
          </button>
          <button onClick={() => setDate(new Date(year, month + 1, 1))} className="calender-nav-btn">
            <span className="material-symbols-outlined" style={{ fontSize: 12 }}>chevron_right</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 mb-1">
        {['M','T','W','T','F','S','S'].map((d, i) => (
          <div key={i} className="text-center font-label text-[9px]" style={{ color: 'var(--theme-text-faint)' }}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-y-0.5 flex-1">
        {cells.map((d, i) => {
          if (!d) return <div key={i} />;
          const ds = getDateStr(d);
          const count = activityByDate[ds] || 0;
          const todayCell = isToday(d);
          return (
            <div key={i} className="flex items-center justify-center py-0.5">
              <div className="w-6 h-6 rounded-full flex items-center justify-center relative" style={{
                background: todayCell ? 'var(--color-primary)' : count > 0 ? 'rgba(99,102,241,0.12)' : 'transparent',
                boxShadow: todayCell ? '0 0 10px rgba(99,102,241,0.5)' : 'none',
              }}>
                <span className="font-label text-[10px]" style={{
                  color: todayCell ? '#fff' : count > 0 ? 'var(--color-primary)' : 'var(--theme-text-body)',
                  fontWeight: todayCell || count > 0 ? 700 : 400
                }}>{d}</span>
                {count > 0 && !todayCell && (
                  <div className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full" style={{ background: 'var(--color-primary)' }} />
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section Header ───
function SectionHeader({ icon, title, subtitle, color = 'var(--color-primary)' }) {
  return (
    <div className="flex items-center gap-3 mb-5">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: `${color}12` }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: '20px' }}>{icon}</span>
      </div>
      <div>
        <h3 className="font-headline text-[15px] font-bold" style={{ color: 'var(--theme-text-heading)' }}>{title}</h3>
        {subtitle && <p className="font-body text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{subtitle}</p>}
      </div>
    </div>
  );
}

// ─── Course Progress Rows ───
function CourseProgressRows({ courses }) {
  if (!courses.length) return (
    <p className="text-center py-6 font-body text-xs" style={{ color: 'var(--theme-text-faint)' }}>No courses yet</p>
  );
  const statusColor = c => c.progress === 100 ? '#34d399' : c.progress > 0 ? '#818cf8' : '#64748b';
  return (
    <div className="space-y-3.5 max-h-52 overflow-y-auto custom-scroll pr-1">
      {courses.map((course, i) => {
        const color = statusColor(course);
        return (
          <div key={course._id}>
            <div className="flex items-center justify-between mb-1.5">
              <p className="font-body text-xs font-medium truncate max-w-[72%]" style={{ color: 'var(--theme-text-heading)' }}>{course.course_title}</p>
              <span className="font-label text-xs font-bold ml-2" style={{ color }}>{course.progress}%</span>
            </div>
            <div className="relative h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
              <motion.div className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: color }}
                initial={{ width: 0 }} animate={{ width: `${course.progress}%` }}
                transition={{ duration: 0.8, delay: i * 0.08, ease: 'easeOut' }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Dynamic Quotes ───
const getTopicsQuote = (count) => {
  if (count === 0) return "Zero is a very round number. Let's sharpen it up and take the first step.";
  if (count < 5) return "A solid start. You're building momentum, keep the engine running.";
  if (count < 20) return "You're blazing through content. Save some knowledge for the rest of us.";
  return "Absolute machine. The data is flowing through your veins.";
};

const getCoursesQuote = (count) => {
  if (count === 0) return "No trophies yet. Your digital display case is looking awfully empty.";
  if (count < 3) return "First course mathematically conquered! The addiction to learning begins.";
  return "A seasoned scholar. You're practically a professor at this point.";
};

const getStreakQuote = (count) => {
  if (count === 0) return "Your streak is as cold as ice. Time to spark a flame and get back to it!";
  if (count < 3) return "A tiny spark. We have ignition, don't break the chain now.";
  if (count < 7) return "You're on fire! Consistency is the ultimate weapon.";
  return "Unstoppable force of nature. Your dedication is genuinely terrifying.";
};

// ─── Editorial Stat Card ───
function StatCard({ icon, label, value, color, delay, quote }) {
  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay, duration: 0.4, ease: "easeOut" }} className="h-full">
      <MagicCard
        className="liquid-glass rounded-2xl h-full flex flex-col group cursor-default"
        gradientColor={`${color}15`}
        gradientFrom={color}
        gradientTo="#0f172a"
      >
        <div className="p-8 flex flex-col h-full justify-between">
          <div className="mb-6">
            <h3 className="font-headline text-5xl font-black italic tracking-tight mb-2" style={{ color: 'var(--theme-text-heading)' }}>{value}</h3>
            <p className="font-label text-xs font-bold tracking-widest uppercase mb-4" style={{ color: 'var(--theme-text-muted)' }}>{label}</p>
          </div>
          <p className="leading-relaxed font-body text-sm italic opacity-80" style={{ color: 'var(--theme-text-body)' }}>"{quote}"</p>
        </div>
      </MagicCard>
    </motion.div>
  );
}

// ─── Playlist Import Progress Steps ───
const PLAYLIST_STEPS = [
  { icon: 'link',          text: 'Extracting playlist info...',        color: '#818cf8' },
  { icon: 'video_library', text: 'Fetching video details...',          color: '#6366f1' },
  { icon: 'timer',         text: 'Calculating durations...',            color: '#a78bfa' },
  { icon: 'calendar_month',text: 'Organizing into daily schedule...',  color: '#4f46e5' },
  { icon: 'checklist',     text: 'Building your study plan...',         color: '#34d399' },
  { icon: 'rocket_launch', text: 'Launching your playlist course!',    color: '#818cf8' },
];

function PlaylistImportPanel() {
  const [activeStep, setActiveStep] = useState(0);
  useEffect(() => {
    const iv = setInterval(() =>
      setActiveStep(p => (p < PLAYLIST_STEPS.length - 1 ? p + 1 : p)), 3000);
    return () => clearInterval(iv);
  }, []);
  const pct = ((activeStep + 1) / PLAYLIST_STEPS.length) * 100;
  const step = PLAYLIST_STEPS[activeStep];

  return (
    <div className="relative overflow-hidden rounded-2xl p-8" style={{
      background: 'var(--dash-card-bg)',
      border: '1px solid var(--dash-card-border)',
      backdropFilter: 'blur(24px)',
    }}>
      <div className="absolute top-0 left-1/4 w-64 h-64 rounded-full pointer-events-none" style={{
        background: `radial-gradient(circle, ${step.color}15, transparent 70%)`,
        filter: 'blur(60px)', transition: 'background 0.8s ease'
      }} />
      <div className="relative z-10">
        <div className="flex items-center gap-3 mb-6">
          <div className="relative w-10 h-10 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `${step.color}20` }} />
            <div className="w-3 h-3 rounded-full" style={{ background: step.color }} />
          </div>
          <div>
            <p className="font-label text-xs uppercase tracking-[0.2em] font-bold" style={{ color: step.color }}>Importing Playlist</p>
            <p className="font-body text-sm mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>This usually takes 10-20 seconds</p>
          </div>
        </div>
        <div className="space-y-2 mb-6">
          {PLAYLIST_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-3 transition-all duration-500" style={{ opacity: i <= activeStep ? 1 : 0.2 }}>
              <span className="material-symbols-outlined text-base shrink-0" style={{
                color: i < activeStep ? '#34d399' : i === activeStep ? s.color : 'var(--theme-text-faint)',
                fontSize: '16px'
              }}>{i < activeStep ? 'check_circle' : s.icon}</span>
              <span className="font-body text-sm" style={{
                color: i === activeStep ? 'var(--theme-text-heading)' : 'var(--theme-text-muted)',
                fontWeight: i === activeStep ? 600 : 400
              }}>{s.text}</span>
            </div>
          ))}
        </div>
        <div className="h-1 rounded-full overflow-hidden" style={{ background: 'var(--theme-border)' }}>
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)' }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
        <p className="text-right font-label text-xs mt-1.5" style={{ color: 'var(--theme-text-faint)' }}>{Math.round(pct)}%</p>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  TOPIC ANALYSIS MODAL (Outdated only, pre-selected)
// ═══════════════════════════════════════════════
function TopicAnalysisModalInline({ blocks, onClose, onRemove }) {
  // All outdated topics pre-selected for removal
  const [selected, setSelected] = useState(() => new Set(blocks.map(b => b.topicName)));
  const [removing, setRemoving] = useState(false);

  const toggle = (name) => {
    setSelected(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; });
  };

  const handleRemove = async () => {
    if (selected.size === 0) return;
    setRemoving(true);
    await onRemove([...selected]);
    setRemoving(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ background: 'var(--color-background)', border: '1px solid var(--theme-border-strong)' }}>
        <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>🧹 Outdated Topics Found</h2>
              <p className="font-body text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {blocks.length > 0 ? 'Uncheck any topics you want to keep. The rest will be removed.' : 'No outdated topics detected — your curriculum looks great!'}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
              style={{ border: '1px solid var(--theme-border)' }}>
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--theme-text-muted)' }}>close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-2 custom-scroll">
          {blocks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="material-symbols-outlined text-5xl" style={{ color: '#34d399' }}>verified</span>
              <p className="font-body text-sm" style={{ color: 'var(--theme-text-muted)' }}>All topics are up to date!</p>
            </div>
          ) : blocks.map(b => (
            <label key={b.topicName} className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all hover:bg-white/5"
              style={{ background: selected.has(b.topicName) ? 'rgba(239,68,68,0.06)' : 'transparent', border: `1px solid ${selected.has(b.topicName) ? 'rgba(239,68,68,0.3)' : 'var(--theme-border)'}` }}>
              <input type="checkbox" checked={selected.has(b.topicName)} onChange={() => toggle(b.topicName)}
                className="mt-1 w-4 h-4 rounded accent-red-500" />
              <div className="flex-1">
                <p className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text-heading)' }}>{b.topicName}</p>
                <MarkdownRenderer content={b.reason} className="font-body text-xs mt-0.5" />
                <p className="font-label text-[10px] mt-1" style={{ color: 'var(--theme-text-faint)' }}>{b.videoIndices.length} videos</p>
              </div>
            </label>
          ))}
        </div>
        {blocks.length > 0 && (
          <div className="p-6 flex items-center justify-between gap-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
            <p className="font-label text-xs" style={{ color: 'var(--theme-text-muted)' }}>{selected.size} topic{selected.size !== 1 ? 's' : ''} will be removed</p>
            <button onClick={handleRemove} disabled={selected.size === 0 || removing}
              className="px-6 py-3 rounded-xl font-label text-sm font-bold text-white disabled:opacity-30 flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #ef4444, #dc2626)', boxShadow: '0 0 20px rgba(239,68,68,0.3)' }}>
              <span className="material-symbols-outlined text-base">{removing ? 'sync' : 'delete_sweep'}</span>
              {removing ? 'Removing...' : 'Remove Selected'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  FILLER MODAL (Opens immediately with loading)
// ═══════════════════════════════════════════════
function FillerModalInline({ loading, suggestions, onClose, onAdd }) {
  const [selected, setSelected] = useState(new Set());
  const [adding, setAdding] = useState(false);

  const toggle = (name) => { setSelected(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; }); };

  const handleAdd = async () => {
    if (selected.size === 0) return;
    setAdding(true);
    const selectedTopics = (suggestions?.missingSuggestions || []).filter(s => selected.has(s.topicName));
    await onAdd(selectedTopics);
    setAdding(false);
  };

  const items = suggestions?.missingSuggestions || [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(12px)' }}
      onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative rounded-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
        style={{ background: 'var(--color-background)', border: '1px solid var(--theme-border-strong)' }}>
        <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--theme-border)' }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-headline text-xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>🔮 Trending Missing Topics</h2>
              <p className="font-body text-sm mt-1" style={{ color: 'var(--theme-text-muted)' }}>
                {loading ? 'AI is analyzing your curriculum for gaps...' : `${items.length} missing topic${items.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            <button onClick={onClose} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 transition-all"
              style={{ border: '1px solid var(--theme-border)' }}>
              <span className="material-symbols-outlined text-sm" style={{ color: 'var(--theme-text-muted)' }}>close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scroll">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="relative">
                <div className="w-14 h-14 rounded-full border-3 border-indigo-500/20 animate-ping absolute inset-0" />
                <div className="w-14 h-14 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
              </div>
              <div className="text-center">
                <p className="font-body text-sm font-semibold mb-1" style={{ color: 'var(--theme-text-heading)' }}>Analyzing curriculum gaps...</p>
                <p className="font-body text-xs" style={{ color: 'var(--theme-text-muted)' }}>This may take 10–15 seconds</p>
              </div>
            </div>
          ) : items.map(s => (
            <label key={s.topicName} className="flex items-start gap-3 p-4 rounded-xl cursor-pointer transition-all hover:bg-white/5"
              style={{ background: selected.has(s.topicName) ? 'rgba(99,102,241,0.06)' : 'transparent', border: `1px solid ${selected.has(s.topicName) ? 'rgba(99,102,241,0.3)' : 'var(--theme-border)'}` }}>
              <input type="checkbox" checked={selected.has(s.topicName)} onChange={() => toggle(s.topicName)} className="mt-1 w-4 h-4 accent-indigo-500" />
              <div className="flex-1">
                <p className="font-body text-sm font-semibold" style={{ color: 'var(--theme-text-heading)' }}>{s.topicName}</p>
                <MarkdownRenderer content={s.reason} className="font-body text-xs mt-0.5" />
                <div className="flex flex-wrap gap-2 mt-2">
                  {s.subtopics.map((sub, i) => (
                    <span key={i} className="px-2 py-0.5 rounded-full font-label text-[9px]" style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.15)' }}>
                      {sub.title}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
        {!loading && items.length > 0 && (
          <div className="p-6 flex items-center justify-between gap-4" style={{ borderTop: '1px solid var(--theme-border)' }}>
            <p className="font-label text-xs" style={{ color: 'var(--theme-text-muted)' }}>{selected.size} topics selected</p>
            <button onClick={handleAdd} disabled={selected.size === 0 || adding}
              className="px-6 py-3 rounded-xl font-label text-sm font-bold text-white disabled:opacity-30 flex items-center gap-2 transition-all hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #6366f1, #4f46e5)', boxShadow: '0 0 20px rgba(99,102,241,0.3)' }}>
              <span className="material-symbols-outlined text-base">{adding ? 'sync' : 'add_circle'}</span>
              {adding ? 'Processing...' : 'Add Selected Topics'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// ─── MAIN DASHBOARD ───
export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const [courses, setCourses] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, completedSubtopics: 0, totalSubtopics: 0 });
  const [activityData, setActivityData] = useState([]);
  const [activityMeta, setActivityMeta] = useState({ streak: 0, totalThisWeek: 0 });
  const [usageData, setUsageData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [courseToDelete, setCourseToDelete] = useState(null);
  const [query, setQuery] = useState('');
  const nav = useNavigate();
  const loc = useLocation();
  const inputRef = useRef(null);

  // ── Playlist import state ──
  const [activeTab, setActiveTab] = useState('forge'); // 'forge' | 'playlist'
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [importingPlaylist, setImportingPlaylist] = useState(false);
  const [playlistCourses, setPlaylistCourses] = useState([]);
  const [playlistError, setPlaylistError] = useState('');
  const playlistInputRef = useRef(null);

  // ── 2-Stage Wizard State ──
  const [draftCourse, setDraftCourse] = useState(null); // Course created but not finalized
  const [wizardStage, setWizardStage] = useState(1); // 1 = input, 2 = optimize & save
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisData, setAnalysisData] = useState(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showFillerModal, setShowFillerModal] = useState(false);
  const [fillerSuggestions, setFillerSuggestions] = useState(null);
  const [loadingFillers, setLoadingFillers] = useState(false);
  const [optimizeApplied, setOptimizeApplied] = useState(false);
  const [fillersApplied, setFillersApplied] = useState(false);

  useEffect(() => {
    if (!isLoaded || !user) return;
    
    // Check for query param from Landing page
    const searchParams = new URLSearchParams(loc.search);
    const qParam = searchParams.get('q');
    if (qParam) {
      setQuery(qParam);
      setTimeout(() => inputRef.current?.focus(), 500);
      // Clean up URL
      nav('/dashboard', { replace: true });
    }
    
    fetchAll();
  }, [isLoaded, user, loc.search]);

  const fetchAll = async () => {
    setLoading(true);
    await Promise.all([fetchCourses(), fetchActivity(), fetchUsage(), fetchPlaylistCourses()]);
    setLoading(false);
  };

  const fetchUsage = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/user/${user.id}/usage`);
      const data = await res.json();
      if (data.success) setUsageData(data);
    } catch (err) { console.error(err); }
  };

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/user/${user.id}`);
      const data = await res.json();
      if (data.success) { setCourses(data.courses); setStats(data.stats); }
    } catch (err) { console.error(err); }
  };

  const fetchActivity = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/activity/${user.id}?days=30`);
      const data = await res.json();
      if (data.success) { setActivityData(data.activity); setActivityMeta({ streak: data.streak, totalThisWeek: data.totalThisWeek }); }
    } catch (err) { console.error(err); }
  };

  const handleCreateCourse = async () => {
    if (!query.trim() || creating) return;
    try {
      setCreating(true);
      const genRes = await fetch(`${API_BASE}/topic-generator`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: query.trim() })
      });
      const curriculum = await genRes.json();
      const saveRes = await fetch(`${API_BASE}/api/course/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          userName: user.firstName || user.fullName || 'Learner',
          llmCurriculum: {
            course_query: query.trim(), course_title: curriculum.course_title,
            modules: curriculum.modules.map(mod => ({
              module_id: mod.module_id, module_title: mod.module_title,
              subtopics: mod.subtopics.map(sub => ({
                subtopic_id: sub.subtopic_id, subtopic_title: sub.subtopic_title,
                Youtube_query: sub.youtube_search_query
              }))
            }))
          }
        })
      });
      const saveData = await saveRes.json();
      if (saveData.success) { setQuery(''); await fetchAll(); }
    } catch (err) { console.error(err); }
    finally { setCreating(false); }
  };

  // ── Playlist Import Functions ──
  const fetchPlaylistCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/course/user/${user.id}/playlists`);
      const data = await res.json();
      if (data.success) setPlaylistCourses(data.courses);
    } catch (err) { console.error(err); }
  };

  const handleImportPlaylist = async () => {
    if (!playlistUrl.trim() || importingPlaylist) return;
    setPlaylistError('');
    try {
      setImportingPlaylist(true);
      const res = await fetch(`${API_BASE}/api/course/from-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          userName: user.firstName || user.fullName || 'Learner',
          playlistUrl: playlistUrl.trim(),
          hoursPerDay: Math.max(0.5, hoursPerDay)
        })
      });
      const data = await res.json();
      if (data.success) {
        // Don't navigate — move to Stage 2 wizard
        setDraftCourse(data.course);
        setWizardStage(2);
        setOptimizeApplied(false);
        setFillersApplied(false);
        setAnalysisData(null);
        setFillerSuggestions(null);
      } else {
        setPlaylistError(data.message || 'Failed to import playlist.');
      }
    } catch (err) {
      console.error(err);
      setPlaylistError('Network error. Please try again.');
    } finally {
      setImportingPlaylist(false);
    }
  };

  // ── Stage 2: Optimizer Handlers ──
  const handleRunOptimizer = async () => {
    if (!draftCourse) return;
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/api/course/${draftCourse._id}/playlist/analyze`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAnalysisData(data.analysis);
        setShowAnalysisModal(true);
      }
    } catch (e) { console.error(e); }
    finally { setAnalyzing(false); }
  };

  const handleRemoveTopics = async (topicNames) => {
    if (!draftCourse) return;
    try {
      const res = await fetch(`${API_BASE}/api/course/${draftCourse._id}/playlist/remove-topics`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ topicNames })
      });
      const data = await res.json();
      if (data.success) {
        // Re-fetch the updated course
        const refreshRes = await fetch(`${API_BASE}/api/course/${draftCourse._id}`);
        const refreshData = await refreshRes.json();
        if (refreshData.success) setDraftCourse(refreshData.course);
        setOptimizeApplied(true);
        setShowAnalysisModal(false);
        setAnalysisData(null);
      }
    } catch (e) { console.error(e); }
  };

  const handleOpenFillerModal = () => {
    // Open modal immediately, then load suggestions
    setShowFillerModal(true);
    setFillerSuggestions(null);
    setLoadingFillers(true);
    (async () => {
      try {
        const res = await fetch(`${API_BASE}/api/course/${draftCourse._id}/playlist/suggest-fillers`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clerkId: user?.id })
        });
        const data = await res.json();
        if (data.success) setFillerSuggestions(data.suggestions);
        else if (res.status === 403) { setShowFillerModal(false); alert('This feature requires a Pro plan.'); }
      } catch (e) { console.error(e); }
      finally { setLoadingFillers(false); }
    })();
  };

  const handleAddFillers = async (selectedTopics) => {
    if (!draftCourse) return;
    try {
      const res = await fetch(`${API_BASE}/api/course/${draftCourse._id}/playlist/add-fillers`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clerkId: user?.id, selectedTopics })
      });
      const data = await res.json();
      if (data.success) {
        setFillersApplied(true);
        setShowFillerModal(false);
        // Wait a moment for background processing, then refresh
        setTimeout(async () => {
          const refreshRes = await fetch(`${API_BASE}/api/course/${draftCourse._id}`);
          const refreshData = await refreshRes.json();
          if (refreshData.success) setDraftCourse(refreshData.course);
        }, 3000);
      }
    } catch (e) { console.error(e); }
  };

  const handleSaveCourse = () => {
    // Course is already saved in DB. Just navigate to it.
    const courseId = draftCourse._id;
    setDraftCourse(null);
    setWizardStage(1);
    setPlaylistUrl('');
    setHoursPerDay(2);
    fetchAll();
    nav(`/playlist/${courseId}`);
  };

  const handleDiscardDraft = () => {
    setDraftCourse(null);
    setWizardStage(1);
    setPlaylistUrl('');
    setHoursPerDay(2);
  };

  const handleDeleteCourse = async (courseId) => {
    try {
      await fetch(`${API_BASE}/api/course/${courseId}`, { method: 'DELETE' });
      setCourseToDelete(null);
      await fetchAll(); // Refresh data
    } catch (err) {
      console.error('Failed to delete course:', err);
    }
  };

  if (!isLoaded) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: 'var(--color-background)' }}>
      <div className="w-8 h-8 rounded-full border-2 border-t-transparent animate-spin" style={{ borderColor: 'var(--color-primary)', borderTopColor: 'transparent' }} />
    </div>
  );

  const completedCourses = courses.filter(c => c.progress === 100).length;
  const activeCourses = courses.filter(c => c.progress > 0 && c.progress < 100).length;
  const progressPct = stats.totalSubtopics > 0 ? Math.round((stats.completedSubtopics / stats.totalSubtopics) * 100) : 0;
  const greeting = new Date().getHours() < 12 ? 'Good morning' : new Date().getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <>
      <SignedIn>
        {/* ── Background ── */}
        <div className="fixed inset-0 z-0" style={{ background: 'var(--color-background)' }} />
        <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[600px] h-[600px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(99,102,241,0.06) 0%, transparent 60%)', filter: 'blur(80px)' }} />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(79,70,229,0.04) 0%, transparent 60%)', filter: 'blur(80px)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(129,140,248,0.03) 0%, transparent 60%)', filter: 'blur(60px)' }} />
        </div>

        <main className="relative z-10 min-h-screen pt-28 pb-20 px-6 lg:px-8 max-w-[1200px] mx-auto">

          {/* Delete Modal Overlay */}
          <AnimatePresence>
            {courseToDelete && (
              <DeleteCourseModal 
                course={courseToDelete} 
                onConfirm={handleDeleteCourse} 
                onCancel={() => setCourseToDelete(null)} 
              />
            )}
          </AnimatePresence>

          {/* Optimizer Modal — Outdated topics only, all pre-selected */}
          {showAnalysisModal && analysisData && (() => {
            const blocks = analysisData.topicBlocks || [];
            return (
              <TopicAnalysisModalInline blocks={blocks} onClose={() => setShowAnalysisModal(false)} onRemove={handleRemoveTopics} />
            );
          })()}

          {/* Filler Modal — opens immediately with loading */}
          {showFillerModal && (
            <FillerModalInline
              loading={loadingFillers}
              suggestions={fillerSuggestions}
              onClose={() => setShowFillerModal(false)}
              onAdd={handleAddFillers}
            />
          )}

          {/* ══ HERO HEADER ══ */}
          <motion.section initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}
            className="mb-10">
            <div className="flex items-end justify-between flex-wrap gap-4 mb-8">
              <div>
                <p className="font-label text-[10px] sm:text-xs uppercase tracking-[0.25em] mb-1 sm:mb-2" style={{ color: 'var(--theme-text-muted)' }}>
                  {greeting}
                </p>
                <h1 className="font-serif text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.1]" style={{ color: 'var(--theme-text-heading)' }}>
                  {user?.firstName || 'Learner'}<span style={{ color: 'var(--color-primary)' }}>.</span>
                </h1>
              </div>
              {activityMeta.streak > 0 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="flex items-center gap-2.5 px-5 py-2.5 rounded-full"
                  style={{ background: 'rgba(99,102,241,0.06)', border: '1px solid rgba(99,102,241,0.12)' }}>
                  <span className="text-xl">🔥</span>
                  <div>
                    <p className="font-label text-sm font-black leading-none" style={{ color: '#818cf8' }}>{activityMeta.streak} day streak</p>
                    <p className="font-label text-[10px] mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>{activityMeta.totalThisWeek} topics this week</p>
                  </div>
                </motion.div>
              )}
            </div>

            {/* ── Tab Toggle ── */}
            <div className="flex items-center gap-2 mb-6">
              {[
                { key: 'forge', icon: 'auto_awesome', label: 'Forge Path' },
                { key: 'playlist', icon: 'smart_display', label: 'Import Playlist' },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className="relative px-5 py-2.5 rounded-full font-label text-xs font-bold transition-all duration-300 flex items-center gap-2"
                  style={{
                    background: activeTab === tab.key ? 'var(--color-primary)' : 'transparent',
                    color: activeTab === tab.key ? '#fff' : 'var(--theme-text-muted)',
                    border: `1px solid ${activeTab === tab.key ? 'var(--color-primary)' : 'var(--theme-border-strong)'}`,
                    boxShadow: activeTab === tab.key ? '0 0 20px rgba(99,102,241,0.3)' : 'none',
                  }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: '16px' }}>{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>

            {/* ── Hero Content (Conditional on Tab) ── */}
            <AnimatePresence mode="wait">
              {activeTab === 'forge' ? (
                /* ── FORGE TAB ── */
                creating ? (
                  <motion.div key="forge-progress" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                    <ForgeProgressPanel />
                  </motion.div>
                ) : (
                  <motion.div key="forge-input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="relative overflow-hidden rounded-2xl p-8 md:p-10" style={{
                      background: 'var(--dash-card-bg)',
                      border: '1px solid var(--dash-card-border)',
                      backdropFilter: 'blur(24px)',
                    }}>
                    <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none" style={{
                      background: 'radial-gradient(circle at top right, rgba(99,102,241,0.06), transparent 60%)',
                    }} />
                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-2">
                         <p className="font-label text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: 'var(--color-primary)' }}>
                          Forge a New Path
                        </p>
                        {usageData && usageData.plan === 'pro' ? (
                          <span className="px-2 py-0.5 rounded-full font-label text-[9px] font-bold uppercase bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                            PRO PLAN
                          </span>
                        ) : usageData ? (
                          <span className="px-2 py-0.5 rounded-full font-label text-[9px] font-bold uppercase bg-white/5 text-white/60 border border-white/10">
                            {usageData.usage.activeCourses}/{usageData.limits.maxCourses} Courses
                          </span>
                        ) : null}
                      </div>
                      <h2 className="font-serif text-2xl md:text-3xl font-bold mb-6" style={{ color: 'var(--theme-text-heading)' }}>
                        What do you want to <span className="italic" style={{ color: 'var(--color-primary)' }}>learn</span> today?
                      </h2>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 max-w-2xl">
                        <div className="flex-1 flex items-center rounded-xl px-4 py-3" style={{
                          background: 'var(--dash-input-bg)',
                          border: '1px solid var(--dash-input-border)',
                        }}>
                          <span className="material-symbols-outlined mr-3" style={{ color: 'var(--theme-text-faint)', fontSize: '20px' }}>search</span>
                          <input
                            ref={inputRef} type="text"
                            className="flex-1 bg-transparent border-none outline-none font-body text-sm"
                            style={{ color: 'var(--theme-text-heading)' }}
                            placeholder="e.g. Machine Learning, Web Development, Data Science..."
                            value={query} onChange={e => setQuery(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleCreateCourse()}
                          />
                        </div>
                        <button onClick={handleCreateCourse} disabled={!query.trim() || (usageData && !usageData.canCreateCourse)}
                          className="forge-btn-primary px-7 py-3 rounded-xl font-label text-sm font-bold text-white disabled:opacity-30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shrink-0">
                          <span className="material-symbols-outlined text-base">rocket_launch</span> Forge
                        </button>
                      </div>
                      {usageData && !usageData.canCreateCourse && (
                        <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                          <div>
                            <p className="font-label text-xs font-bold text-red-400">Limit Reached</p>
                            <p className="font-body text-xs text-white/70 mt-0.5">
                              {usageData.usage.activeCourses >= usageData.limits.maxCourses 
                                ? `You have reached the maximum of ${usageData.limits.maxCourses} free courses. Delete an existing course or upgrade to Pro.`
                                : `You can only create ${usageData.limits.coursesPerWeek} free course per week. Upgrade to Pro for unlimited access.`}
                            </p>
                            <Link to="/#pricing" className="inline-block mt-2 px-3 py-1 bg-white/10 hover:bg-white/20 text-white text-xs font-bold rounded">
                              View Pro Plan
                            </Link>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              ) : (
                /* ── PLAYLIST TAB ── */
                importingPlaylist ? (
                  <motion.div key="playlist-progress" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}>
                    <PlaylistImportPanel />
                  </motion.div>
                ) : wizardStage === 2 && draftCourse ? (
                  /* ═══ STAGE 2: OPTIMIZE & SAVE WIZARD ═══ */
                  <motion.div key="playlist-wizard" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="relative overflow-hidden rounded-2xl p-8 md:p-10" style={{
                      background: 'var(--dash-card-bg)',
                      border: '1px solid var(--dash-card-border)',
                      backdropFilter: 'blur(24px)',
                    }}>
                    {/* Background gradient */}
                    <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none" style={{
                      background: 'radial-gradient(circle at top right, rgba(99,102,241,0.06), transparent 60%)',
                    }} />
                    <div className="relative z-10">

                      {/* Step indicator */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}>
                            <span className="material-symbols-outlined text-xs" style={{ color: '#22c55e' }}>check</span>
                          </div>
                          <span className="font-label text-[10px] uppercase font-bold" style={{ color: '#22c55e' }}>Step 1</span>
                        </div>
                        <div className="w-8 h-px" style={{ background: 'var(--theme-border-strong)' }} />
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                            <span className="font-label text-[10px] font-bold" style={{ color: '#818cf8' }}>2</span>
                          </div>
                          <span className="font-label text-[10px] uppercase font-bold" style={{ color: '#818cf8' }}>Optimize & Save</span>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h2 className="font-serif text-2xl md:text-3xl font-bold mb-1" style={{ color: 'var(--theme-text-heading)' }}>
                        {draftCourse.course_title}
                      </h2>
                      <p className="font-body text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                        {draftCourse.days?.reduce((sum, d) => sum + d.videos.length, 0)} videos • {draftCourse.days?.length} days • ~{draftCourse.hoursPerDay}h/day
                      </p>

                      {/* Greyed-out inputs */}
                      <div className="space-y-3 max-w-2xl mb-8 opacity-40 pointer-events-none select-none">
                        <div className="flex items-center rounded-xl px-4 py-3" style={{ background: 'var(--dash-input-bg)', border: '1px solid var(--dash-input-border)' }}>
                          <span className="material-symbols-outlined mr-3" style={{ color: 'var(--theme-text-faint)', fontSize: '20px' }}>link</span>
                          <span className="font-body text-sm" style={{ color: 'var(--theme-text-faint)' }}>{playlistUrl || 'Playlist URL'}</span>
                        </div>
                        <div className="flex items-center gap-3 rounded-xl px-4 py-3 w-fit" style={{ background: 'var(--dash-input-bg)', border: '1px solid var(--dash-input-border)' }}>
                          <span className="material-symbols-outlined" style={{ color: 'var(--theme-text-faint)', fontSize: '20px' }}>schedule</span>
                          <span className="font-label text-xs" style={{ color: 'var(--theme-text-faint)' }}>Hours/day: {hoursPerDay}</span>
                        </div>
                      </div>

                      {/* Optimization Tools */}
                      <div className="mb-8">
                        <p className="font-label text-[11px] uppercase tracking-[0.2em] font-bold mb-4" style={{ color: 'var(--theme-text-muted)' }}>AI Optimization Tools</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">

                          {/* Optimize Button */}
                          <button onClick={handleRunOptimizer} disabled={analyzing || optimizeApplied}
                            className="p-5 rounded-xl text-left transition-all hover:scale-[1.01] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed group"
                            style={{ background: optimizeApplied ? 'rgba(34,197,94,0.05)' : 'rgba(239,68,68,0.04)', border: `1px solid ${optimizeApplied ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.15)'}` }}>
                            <div className="flex items-center gap-3 mb-2">
                              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: optimizeApplied ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.08)' }}>
                                <span className="material-symbols-outlined" style={{ color: optimizeApplied ? '#22c55e' : '#ef4444', fontSize: '20px' }}>{optimizeApplied ? 'check_circle' : analyzing ? 'sync' : 'cleaning_services'}</span>
                              </div>
                              <div>
                                <p className="font-label text-sm font-bold" style={{ color: 'var(--theme-text-heading)' }}>Optimize Curriculum</p>
                                <p className="font-label text-[10px] uppercase" style={{ color: 'rgba(34,197,94,0.8)' }}>FREE</p>
                              </div>
                            </div>
                            <p className="font-body text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                              {optimizeApplied ? 'Outdated topics removed!' : analyzing ? 'Scanning curriculum...' : 'AI scans and removes outdated topics'}
                            </p>
                          </button>

                          {/* Filler Button */}
                          {usageData?.plan === 'pro' ? (
                            <button onClick={handleOpenFillerModal} disabled={fillersApplied}
                              className="p-5 rounded-xl text-left transition-all hover:scale-[1.01] disabled:opacity-60 cursor-pointer disabled:cursor-not-allowed group"
                              style={{ background: fillersApplied ? 'rgba(34,197,94,0.05)' : 'rgba(99,102,241,0.04)', border: `1px solid ${fillersApplied ? 'rgba(34,197,94,0.2)' : 'rgba(99,102,241,0.15)'}` }}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: fillersApplied ? 'rgba(34,197,94,0.1)' : 'rgba(99,102,241,0.08)' }}>
                                  <span className="material-symbols-outlined" style={{ color: fillersApplied ? '#22c55e' : '#818cf8', fontSize: '20px' }}>{fillersApplied ? 'check_circle' : 'auto_fix_high'}</span>
                                </div>
                                <div>
                                  <p className="font-label text-sm font-bold" style={{ color: 'var(--theme-text-heading)' }}>Find Missing Topics</p>
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/20 text-amber-400 border border-amber-500/30">PRO</span>
                                </div>
                              </div>
                              <p className="font-body text-xs" style={{ color: 'var(--theme-text-muted)' }}>
                                {fillersApplied ? 'Trending topics added!' : 'AI finds trending topics missing from the curriculum'}
                              </p>
                            </button>
                          ) : (
                            <div className="p-5 rounded-xl text-left opacity-50 cursor-not-allowed" style={{ background: 'rgba(99,102,241,0.03)', border: '1px solid var(--theme-border)' }}>
                              <div className="flex items-center gap-3 mb-2">
                                <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.06)' }}>
                                  <span className="material-symbols-outlined" style={{ color: 'var(--theme-text-faint)', fontSize: '20px' }}>lock</span>
                                </div>
                                <div>
                                  <p className="font-label text-sm font-bold" style={{ color: 'var(--theme-text-faint)' }}>Find Missing Topics</p>
                                  <span className="px-1.5 py-0.5 rounded text-[8px] font-black uppercase bg-amber-500/10 text-amber-600 border border-amber-500/15">PRO ONLY</span>
                                </div>
                              </div>
                              <p className="font-body text-xs" style={{ color: 'var(--theme-text-faint)' }}>Upgrade to Pro to unlock AI-powered topic suggestions</p>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between gap-3">
                        <button onClick={handleDiscardDraft}
                          className="px-5 py-3 rounded-xl font-label text-xs font-bold flex items-center gap-2 transition-all hover:bg-white/5 cursor-pointer"
                          style={{ border: '1px solid var(--theme-border)', color: 'var(--theme-text-muted)' }}>
                          <span className="material-symbols-outlined text-sm">undo</span>
                          Start Over
                        </button>
                        <button onClick={handleSaveCourse}
                          className="px-8 py-3.5 rounded-xl font-label text-sm font-bold text-white flex items-center gap-2.5 transition-all hover:scale-[1.02] cursor-pointer"
                          style={{ background: 'linear-gradient(135deg, #22c55e, #16a34a)', boxShadow: '0 0 24px rgba(34,197,94,0.3)' }}>
                          <span className="material-symbols-outlined text-base">rocket_launch</span>
                          Save & Start Learning
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="playlist-input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="relative overflow-hidden rounded-2xl p-8 md:p-10" style={{
                      background: 'var(--dash-card-bg)',
                      border: '1px solid var(--dash-card-border)',
                      backdropFilter: 'blur(24px)',
                    }}>
                    {/* Subtle red-ish gradient for YouTube branding */}
                    <div className="absolute top-0 right-0 w-72 h-72 pointer-events-none" style={{
                      background: 'radial-gradient(circle at top right, rgba(239,68,68,0.05), transparent 60%)',
                    }} />
                    <div className="relative z-10">

                      {/* Step indicator */}
                      <div className="flex items-center gap-2 mb-4">
                        <div className="flex items-center gap-1.5">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'rgba(99,102,241,0.15)', border: '1px solid rgba(99,102,241,0.3)' }}>
                            <span className="font-label text-[10px] font-bold" style={{ color: '#818cf8' }}>1</span>
                          </div>
                          <span className="font-label text-[10px] uppercase font-bold" style={{ color: '#818cf8' }}>Import</span>
                        </div>
                        <div className="w-8 h-px" style={{ background: 'var(--theme-border)' }} />
                        <div className="flex items-center gap-1.5 opacity-30">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center" style={{ background: 'var(--theme-glass-bg)', border: '1px solid var(--theme-border)' }}>
                            <span className="font-label text-[10px] font-bold" style={{ color: 'var(--theme-text-faint)' }}>2</span>
                          </div>
                          <span className="font-label text-[10px] uppercase font-bold" style={{ color: 'var(--theme-text-faint)' }}>Optimize & Save</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between mb-2">
                        <p className="font-label text-[11px] uppercase tracking-[0.25em] font-bold" style={{ color: '#ef4444' }}>
                          <span className="inline-flex items-center gap-1.5">
                            <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>smart_display</span>
                            Import YouTube Playlist
                          </span>
                        </p>
                      </div>
                      <h2 className="font-serif text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--theme-text-heading)' }}>
                        Turn any playlist into a <span className="italic" style={{ color: '#ef4444' }}>study plan</span>
                      </h2>
                      <p className="font-body text-sm mb-6" style={{ color: 'var(--theme-text-muted)' }}>
                        Paste a YouTube playlist link and we'll organize it into daily study sessions.
                      </p>

                      {/* Playlist URL Input */}
                      <div className="space-y-4 max-w-2xl">
                        <div className="flex-1 flex items-center rounded-xl px-4 py-3" style={{
                          background: 'var(--dash-input-bg)',
                          border: '1px solid var(--dash-input-border)',
                        }}>
                          <span className="material-symbols-outlined mr-3" style={{ color: 'var(--theme-text-faint)', fontSize: '20px' }}>link</span>
                          <input
                            ref={playlistInputRef}
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none font-body text-sm"
                            style={{ color: 'var(--theme-text-heading)' }}
                            placeholder="https://youtube.com/playlist?list=PLxxxxxx"
                            value={playlistUrl}
                            onChange={e => { setPlaylistUrl(e.target.value); setPlaylistError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleImportPlaylist()}
                          />
                        </div>

                        {/* Hours Per Day + Submit */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex items-center gap-3 rounded-xl px-4 py-3" style={{
                            background: 'var(--dash-input-bg)',
                            border: '1px solid var(--dash-input-border)',
                          }}>
                            <span className="material-symbols-outlined" style={{ color: 'var(--theme-text-faint)', fontSize: '20px' }}>schedule</span>
                            <span className="font-label text-xs" style={{ color: 'var(--theme-text-muted)' }}>Hours/day:</span>
                            <input
                              type="number"
                              min="0.5"
                              max="12"
                              step="0.5"
                              value={hoursPerDay}
                              onChange={e => setHoursPerDay(parseFloat(e.target.value) || 2)}
                              className="w-16 bg-transparent border-none outline-none font-headline text-lg font-bold text-center"
                              style={{ color: 'var(--theme-text-heading)' }}
                            />
                          </div>

                          <button
                            onClick={handleImportPlaylist}
                            disabled={!playlistUrl.trim()}
                            className="px-7 py-3 rounded-xl font-label text-sm font-bold text-white disabled:opacity-30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] shrink-0"
                            style={{
                              background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                              boxShadow: '0 0 20px rgba(239,68,68,0.3)',
                            }}
                          >
                            <span className="material-symbols-outlined text-base">download</span>
                            Build Study Plan
                          </button>
                        </div>
                      </div>

                      {/* Error Message */}
                      {playlistError && (
                        <div className="mt-4 p-3 rounded-xl border border-red-500/20 bg-red-500/5 flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-400 text-lg">error</span>
                          <p className="font-body text-xs text-red-400">{playlistError}</p>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )
              )}
            </AnimatePresence>
          </motion.section>

          {/* ══ OVERALL PROGRESS ══ */}
          <section className="mb-6">
            <div className="rounded-2xl p-6 md:px-8 md:py-7" style={{
              background: 'var(--dash-card-bg)',
              border: '1px solid var(--dash-card-border)',
              backdropFilter: 'blur(20px)',
            }}>
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <SectionHeader icon="donut_large" title="Overall Progress" subtitle="Your journey so far" color="#6366f1" />
                {loading ? (
                  <div className="flex items-center gap-6">
                    <div className="w-[88px] h-[88px] rounded-full skeleton shrink-0" />
                    <div>
                      <div className="w-48 h-6 skeleton rounded-md mb-3" />
                      <div className="flex gap-2.5 mt-2.5">
                        <div className="w-16 h-6 skeleton rounded-full" />
                        <div className="w-16 h-6 skeleton rounded-full" />
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-6">
                    <div className="relative shrink-0">
                      <ProgressRing pct={progressPct} size={88} stroke={6} color="#6366f1" />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="font-headline text-xl font-black" style={{ color: 'var(--color-primary)' }}>{progressPct}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="font-body text-balance" style={{ color: 'var(--theme-text-body)' }}>
                        <span className="font-bold text-lg" style={{ color: 'var(--theme-text-heading)' }}>{stats.completedSubtopics}</span> of {stats.totalSubtopics} topics completed
                      </p>
                      <div className="flex gap-2.5 mt-2.5 flex-wrap">
                        <span className="inline-block px-3 py-1 rounded-full font-label text-[11px] font-bold"
                          style={{ background: 'rgba(99,102,241,0.08)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.12)' }}>
                          {activeCourses} active
                        </span>
                        <span className="inline-block px-3 py-1 rounded-full font-label text-[11px] font-bold"
                          style={{ background: 'rgba(52,211,153,0.08)', color: '#34d399', border: '1px solid rgba(52,211,153,0.12)' }}>
                          {completedCourses} done
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </section>

          {/* ══ MY COURSES (AI-Generated) ══ */}
          {activeTab === 'forge' && (
          <section className="mb-10">
            <div className="rounded-2xl p-6 md:p-8" style={{
              background: 'var(--dash-card-bg)',
              border: '1px solid var(--dash-card-border)',
              backdropFilter: 'blur(20px)',
            }}>
              <SectionHeader icon="auto_stories" title="My Courses" subtitle="Continue where you left off" color="#818cf8" />
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1,2,3,4].map(i => <div key={i} className="w-full h-[240px] skeleton rounded-2xl shrink-0" />)}
                </div>
              ) : courses.filter(c => c.sourceType !== 'playlist').length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-60">
                  <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--theme-text-faint)' }}>sentiment_satisfied</span>
                  <p className="font-body text-sm" style={{ color: 'var(--theme-text-muted)' }}>No courses yet. Forge one above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-h-[760px] overflow-y-auto custom-scroll pr-2 -mr-2">
                  {courses.filter(c => c.sourceType !== 'playlist').map((course, i) => (
                    <CourseCard key={course._id} course={course} palette={CARD_PALETTES[i % CARD_PALETTES.length]} index={i} onOpen={() => nav(`/course/${course._id}`)} onDeleteClick={setCourseToDelete} />
                  ))}
                </div>
              )}
            </div>
          </section>
          )}

          {/* ══ MY PLAYLIST COURSES ══ */}
          {activeTab === 'playlist' && (
          <section className="mb-10">
            <div className="rounded-2xl p-6 md:p-8" style={{
              background: 'var(--dash-card-bg)',
              border: '1px solid var(--dash-card-border)',
              backdropFilter: 'blur(20px)',
            }}>
              <SectionHeader icon="playlist_play" title="My Playlist Courses" subtitle="Imported from YouTube" color="#ef4444" />
              
              {loading ? (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {[1,2,3].map(i => <div key={i} className="w-full h-[240px] skeleton rounded-2xl shrink-0" />)}
                </div>
              ) : playlistCourses.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 opacity-60">
                  <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--theme-text-faint)' }}>smart_display</span>
                  <p className="font-body text-sm" style={{ color: 'var(--theme-text-muted)' }}>No imported playlists yet. Paste a YouTube link above!</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5 max-h-[760px] overflow-y-auto custom-scroll pr-2 -mr-2">
                  {playlistCourses.map((course, i) => {
                    const palette = { from: '#450a0a', to: '#dc2626', icon: '📺' };
                    return (
                      <motion.div
                        key={course._id}
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4 }}
                        className="relative w-full cursor-pointer group"
                        onClick={() => nav(`/playlist/${course._id}`)}
                      >
                        <div className="relative overflow-hidden rounded-2xl transition-all duration-300 group-hover:-translate-y-1.5"
                          style={{
                            background: `linear-gradient(150deg, ${palette.from} 0%, ${palette.to} 100%)`,
                            boxShadow: `0 8px 28px ${palette.from}30`,
                            height: '240px'
                          }}>
                          <div className="absolute inset-0" style={{
                            backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
                          }} />
                          <div className="absolute -top-6 -right-6 w-32 h-32 rounded-full" style={{ background: 'rgba(255,255,255,0.04)' }} />
                          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full" style={{ background: 'rgba(0,0,0,0.1)' }} />

                          {/* Delete Button */}
                          <button 
                            onClick={(e) => { e.stopPropagation(); setCourseToDelete(course); }}
                            className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center bg-black/20 hover:bg-red-500/80 hover:scale-110 transition-all z-20 opacity-0 group-hover:opacity-100"
                          >
                            <span className="material-symbols-outlined text-[16px] text-white/90">delete</span>
                          </button>

                          <div className="relative z-10 p-6 h-full flex flex-col justify-between">
                            <div>
                              <div className="flex items-center gap-2 mb-3">
                                <span className="text-2xl">{palette.icon}</span>
                                <span className="px-2 py-0.5 rounded-full font-label text-[9px] font-bold uppercase bg-white/10 text-white/80 border border-white/10">
                                  {course.totalDays} days
                                </span>
                              </div>
                              <h3 className="font-headline text-base md:text-lg font-bold text-white leading-snug line-clamp-3">
                                {course.course_title}
                              </h3>
                            </div>
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span className="text-white/60 text-[11px] font-label uppercase tracking-wider">
                                  {course.totalVideos} videos
                                </span>
                                <span className="text-white font-label text-sm font-bold">{course.progress}%</span>
                              </div>
                              <div className="h-1.5 rounded-full bg-black/20 overflow-hidden">
                                <motion.div className="h-full rounded-full bg-white/90"
                                  initial={{ width: 0 }} animate={{ width: `${course.progress}%` }} transition={{ duration: 0.8, delay: i * 0.1 }} />
                              </div>
                              <p className="text-white/50 text-xs font-label mt-3">
                                {course.completedDays}/{course.totalDays} days completed
                              </p>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
              )}
            </div>
          </section>
          )}

          {/* ══ LEADERBOARD ══ */}
          <Leaderboard />

          {/* ══ ACTIVITY + CALENDAR + PROGRESS + ACTIONS ══ */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-5 mb-10">

            {/* Weekly Activity */}
            <div className="lg:col-span-4">
              <div className="rounded-2xl p-6 h-full" style={{
                background: 'var(--dash-card-bg)',
                border: '1px solid var(--dash-card-border)',
                backdropFilter: 'blur(20px)',
              }}>
                <SectionHeader icon="bar_chart_4_bars" title="This Week" subtitle="7 days of focus" color="#a78bfa" />
                {loading ? (
                  <div className="flex items-end gap-2.5 h-28">
                    {[20, 50, 30, 70, 40, 60, 80].map((h, i) => (
                      <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
                        <div className="w-full skeleton rounded-md" style={{ height: `${h}%` }} />
                        <div className="w-6 h-3 skeleton rounded-full" />
                      </div>
                    ))}
                  </div>
                ) : activityData.length > 0 ? (
                  <ActivityBars activityData={activityData} />
                ) : (
                  <div className="h-28 flex items-center justify-center"><p className="font-body text-xs" style={{ color: 'var(--theme-text-faint)' }}>No activity</p></div>
                )}
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="lg:col-span-3">
              <div className="rounded-2xl p-6 h-full" style={{
                background: 'var(--dash-card-bg)',
                border: '1px solid var(--dash-card-border)',
                backdropFilter: 'blur(20px)',
              }}>
                {loading ? (
                  <div className="h-full w-full flex flex-col pt-2">
                    <div className="flex justify-between items-center mb-4">
                       <div className="w-24 h-5 skeleton rounded-full" />
                       <div className="flex gap-2"><div className="w-6 h-6 skeleton rounded-md" /><div className="w-6 h-6 skeleton rounded-md" /></div>
                    </div>
                    <div className="grid grid-cols-7 gap-y-2 flex-1 items-center">
                      {Array.from({length: 35}).map((_, i) => <div key={i} className="mx-auto w-6 h-6 skeleton rounded-full" />)}
                    </div>
                  </div>
                ) : (
                  <MiniCalendar activityData={activityData} />
                )}
              </div>
            </div>

            {/* Progress Breakdown */}
            <div className="lg:col-span-5">
              <div className="rounded-2xl p-6 h-full" style={{
                background: 'var(--dash-card-bg)',
                border: '1px solid var(--dash-card-border)',
                backdropFilter: 'blur(20px)',
              }}>
                <SectionHeader icon="timeline" title="Progress Breakdown" color="#fbbf24" />
                {loading ? (
                  <div className="space-y-3 pt-2">{[1,2,3].map(i => <div key={i} className="h-6 skeleton rounded-full" />)}</div>
                ) : (
                  <CourseProgressRows courses={courses} />
                )}
              </div>
            </div>

            {/* Elevated Quick Actions */}
            <div className="lg:col-span-12 flex flex-col sm:flex-row items-center gap-4 sm:gap-6 mt-2 mb-2">
               <div className="h-[1px] flex-1 hidden sm:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.1), transparent)' }}></div>
               <div className="flex items-center gap-3 sm:gap-4 flex-wrap justify-center w-full sm:w-auto">
                 <p className="font-label text-xs font-bold uppercase tracking-[0.2em] mr-2 w-full sm:w-auto text-center sm:text-left" style={{ color: 'var(--theme-text-faint)' }}>Quick Actions</p>
                 {[
                   { icon: 'play_circle', label: activeCourses > 0 ? 'Continue Learning' : 'Start a Course', color: '#6366f1', action: () => activeCourses > 0 && nav(`/course/${courses.find(c => c.progress > 0 && c.progress < 100)?._id}`) },
                   { icon: 'add_circle', label: 'New Course', color: '#818cf8', action: () => { window.scrollTo({top: 0, behavior: 'smooth'}); setTimeout(() => inputRef.current?.focus(), 500); } },
                 ].map((item, i) => (
                   <button key={i} onClick={item.action}
                     className="relative px-5 py-2.5 rounded-full font-label text-xs font-bold transition-all duration-300 overflow-hidden group border hover:-translate-y-0.5"
                     style={{
                        background: 'linear-gradient(180deg, rgba(255,255,255,0.03) 0%, rgba(255,255,255,0.0) 100%)',
                        borderColor: 'rgba(255,255,255,0.08)',
                        color: 'var(--theme-text-heading)',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
                     }}
                    >
                     <div className="relative z-10 flex items-center gap-2">
                       <span className="material-symbols-outlined" style={{ color: item.color, fontSize: '18px' }}>{item.icon}</span>
                       {item.label}
                       <span className="material-symbols-outlined text-sm ml-1 transition-transform group-hover:translate-x-1" style={{ color: 'var(--theme-text-faint)' }}>arrow_forward</span>
                     </div>
                     <div className="absolute inset-0 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-in-out" style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.08), transparent)' }}></div>
                   </button>
                 ))}
               </div>
               <div className="h-[1px] flex-1 hidden sm:block" style={{ background: 'linear-gradient(90deg, transparent, rgba(148,163,184,0.1), transparent)' }}></div>
            </div>

          </section>
          
          {/* ══ STATS ROW (MOVED TO BOTTOM) ══ */}
          <section className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
            {loading ? (
              [1,2,3].map(i => <div key={i} className="h-64 lg:h-72 skeleton rounded-2xl" />)
            ) : (
              <>
                <StatCard icon="task_alt" label="Topics Conquered" value={stats.completedSubtopics} color="#34d399" delay={0.12} quote={getTopicsQuote(stats.completedSubtopics)} />
                <StatCard icon="emoji_events" label="Courses Mastered" value={completedCourses} color="#fbbf24" delay={0.16} quote={getCoursesQuote(completedCourses)} />
                <StatCard icon="local_fire_department" label="Daily Streak" value={activityMeta.streak} color="#f472b6" delay={0.20} quote={getStreakQuote(activityMeta.streak)} />
              </>
            )}
          </section>

        </main>
      </SignedIn>
      <SignedOut><RedirectToSignIn redirectUrl="/" /></SignedOut>
    </>
  );
}