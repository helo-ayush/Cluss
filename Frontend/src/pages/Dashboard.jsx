import React, { useState, useEffect, useRef } from 'react';
import { useUser, SignedIn, SignedOut, RedirectToSignIn } from '@clerk/clerk-react';
import Leaderboard from '../components/Leaderboard';

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
    <div className="relative overflow-hidden rounded-[40px] bg-white shadow-sm p-12">
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full pointer-events-none" style={{
        background: `radial-gradient(circle, ${step.color}10, transparent 70%)`,
        filter: 'blur(60px)', transition: 'background 0.8s ease'
      }} />
      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `${step.color}25` }} />
            <div className="w-4 h-4 rounded-full" style={{ background: step.color }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: step.color }}>AI is forging your path</p>
            <p className="text-sm text-gray-500 mt-1.5 font-medium">This usually takes 15-30 seconds</p>
          </div>
        </div>

        <div className="space-y-4 mb-10">
          {FORGE_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-4 transition-all duration-500" style={{ opacity: i <= activeStep ? 1 : 0.2 }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${i < activeStep ? 'bg-green-50' : i === activeStep ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[14px]" style={{
                  color: i < activeStep ? '#22c55e' : i === activeStep ? s.color : '#94a3b8'
                }}>{i < activeStep ? 'check' : s.icon}</span>
              </div>
              <span className={`text-sm font-medium ${i === activeStep ? 'text-gray-900' : 'text-gray-500'}`}>{s.text}</span>
            </div>
          ))}
        </div>

        <div className="h-2 rounded-full bg-gray-50 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)' }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="relative overflow-hidden rounded-[32px] p-8 max-w-md w-full text-center bg-white shadow-2xl border border-gray-100"
      >
        <div className="mx-auto w-16 h-16 rounded-2xl flex items-center justify-center mb-6 bg-red-50 text-red-500">
           <span className="material-symbols-outlined text-3xl">delete_forever</span>
        </div>
        
        <h3 className="text-2xl font-bold mb-3 text-gray-900 tracking-tight">
          Delete Course
        </h3>
        <p className="text-sm mb-8 text-gray-500 leading-relaxed font-medium">
          You are about to permanently delete <strong className="text-gray-900">"{course.course_title}"</strong>. This action cannot be undone.
        </p>

        <div className="bg-gray-50 rounded-2xl p-6 mb-8 border border-gray-100">
           <p className="text-[10px] font-bold text-gray-400 mb-3 tracking-widest uppercase">
             Type <span className="text-red-500 bg-red-50 px-2 py-0.5 rounded border border-red-100 mx-1">delete</span> to confirm
           </p>
           <input 
             type="text"
             value={inputVal}
             onChange={(e) => setInputVal(e.target.value)}
             placeholder="delete"
             className="w-full px-6 py-4 rounded-xl border-2 border-transparent bg-white text-gray-900 font-bold text-center outline-none focus:border-red-500/20 transition-all tracking-widest uppercase placeholder:normal-case placeholder:tracking-normal placeholder:font-medium placeholder:text-gray-300 shadow-sm"
           />
        </div>

        <div className="flex gap-3">
          <button onClick={onCancel} disabled={deleting}
            className="flex-1 py-4 rounded-xl text-sm font-bold text-gray-500 hover:bg-gray-50 transition-all border border-gray-100"
          >Cancel</button>
          
          <button onClick={handleConfirm} 
            disabled={deleting || inputVal.toLowerCase() !== 'delete'}
            className="flex-1 py-4 rounded-xl text-sm font-bold bg-red-500 hover:bg-red-600 text-white flex items-center justify-center gap-2 transition-all disabled:opacity-30 shadow-lg shadow-red-500/20"
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
      whileHover={{ y: -8, scale: 1.02 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: (index % 10) * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
      className="relative w-full cursor-pointer group"
    >
      <div className="relative overflow-hidden rounded-[40px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-500 group-hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)] h-[260px]">
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
             style={{ background: `radial-gradient(circle at 50% 0%, ${palette.from}10, transparent 70%)` }} />

        {/* Delete Button */}
        <button 
           onClick={(e) => { e.stopPropagation(); onDeleteClick(course); }}
           className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-md border border-white/80 hover:bg-red-500 hover:text-white transition-all z-20 opacity-0 group-hover:opacity-100 text-gray-500 shadow-sm"
        >
           <span className="material-symbols-outlined text-[18px]">delete</span>
        </button>

        <div className="relative z-10 p-8 h-full flex flex-col justify-between" onClick={onOpen}>
          <div>
            <h3 className="font-bold text-[20px] text-gray-900 leading-[1.2] tracking-tight line-clamp-2 mb-4 group-hover:text-indigo-600 transition-colors">
              {course.course_title}
            </h3>
            <div className="flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_8px_rgba(0,0,0,0.1)]" style={{ background: palette.from }} />
              <span className="text-gray-500 text-[10px] uppercase font-black tracking-[0.15em]">
                {isCompleted ? 'Complete' : isActive ? 'In Progress' : 'New'}
              </span>
            </div>
          </div>

          <div>
            <div className="flex items-end justify-between mb-4">
              <div className="flex flex-col">
                <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Progress</span>
                <p className="text-gray-400 text-[11px] font-medium">
                  {course.completedSubtopics}/{course.totalSubtopics} topics
                </p>
              </div>
              <span className="text-3xl font-black italic tracking-tighter text-gray-900/10 group-hover:text-indigo-600/20 transition-all duration-500">
                {pct}%
              </span>
            </div>
            
            <div className="h-2 rounded-full bg-black/5 overflow-hidden p-[1px]">
              <motion.div className="h-full rounded-full relative" 
                style={{ 
                  background: `linear-gradient(90deg, ${palette.from}, ${palette.to})`,
                  boxShadow: `0 0 12px ${palette.from}40`
                }}
                initial={{ width: 0 }} 
                animate={{ width: `${pct}%` }} 
                transition={{ duration: 1, delay: (index % 10) * 0.1, ease: "circOut" }} 
              >
                <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" 
                     style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
              </motion.div>
            </div>
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
    <div className="flex items-end gap-3 h-32 mt-4">
      {last7.map((day, i) => {
        const pct = (day.subtopicsCompleted / maxVal) * 100;

        const todayStr = new Date().toISOString().slice(0, 10);
        const isToday = day.date === todayStr;
        const dateObj = new Date(day.date + 'T00:00:00');
        const dayLabel = days[(dateObj.getDay() + 6) % 7];

        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            {day.subtopicsCompleted > 0 && (
              <span className={`text-[10px] font-bold ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
                {day.subtopicsCompleted}
              </span>
            )}
            <div className="w-full relative rounded-md overflow-hidden bg-gray-50 h-24">
              <motion.div className={`absolute bottom-0 left-0 right-0 rounded-t-md ${isToday ? 'bg-indigo-500' : 'bg-indigo-100'}`}
                initial={{ height: 0 }} animate={{ height: `${Math.max(pct, day.subtopicsCompleted > 0 ? 10 : 0)}%` }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
              />
            </div>
            <span className={`text-[10px] font-bold uppercase tracking-wider ${isToday ? 'text-indigo-600' : 'text-gray-400'}`}>
              {dayLabel}
            </span>
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
  activityData.forEach(d => { activityByDate[d.date] = d.subtopicsCompleted > 0; });

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-4">
        <span className="text-sm font-bold text-gray-900">{monthName} {year}</span>
        <div className="flex gap-1">
          <button onClick={() => setDate(new Date(year, month - 1))} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button onClick={() => setDate(new Date(year, month + 1))} className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {['M','T','W','T','F','S','S'].map((d, i) => <span key={`${d}-${i}`} className="text-[9px] font-bold text-gray-400 uppercase">{d}</span>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="h-7" />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const active = activityByDate[dateStr];
          const isT = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
          return (
            <div key={d} className={`h-7 w-7 flex items-center justify-center rounded-full text-[10px] font-bold transition-all ${
              isT ? 'bg-indigo-600 text-white shadow-md' : active ? 'bg-indigo-50 text-indigo-600' : 'text-gray-600 hover:bg-gray-50'
            }`}>
              {d}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─── Section Header ───
function SectionHeader({ icon, title, subtitle, color = '#6366f1' }) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shrink-0" style={{ background: `${color}15` }}>
        <span className="material-symbols-outlined" style={{ color, fontSize: '22px' }}>{icon}</span>
      </div>
      <div>
        <h3 className="text-2xl font-bold text-gray-900 tracking-tight leading-none">{title}</h3>
        {subtitle && <p className="text-sm text-gray-500 mt-1.5 font-medium">{subtitle}</p>}
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
      <div className="rounded-[40px] h-full flex flex-col group cursor-default bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-300 hover:-translate-y-1.5 hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)]">
        <div className="p-8 flex flex-col h-full justify-between">
          <div className="mb-6">
            <h3 className="text-6xl font-black italic tracking-tighter mb-2 text-gray-900 group-hover:text-indigo-600 transition-colors">{value}</h3>
            <p className="text-[11px] font-black tracking-[0.2em] uppercase mb-4 text-gray-400">{label}</p>
          </div>
          <p className="leading-relaxed text-sm font-medium italic text-gray-500/80">"{quote}"</p>
        </div>
      </div>
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
    <div className="relative overflow-hidden rounded-[40px] bg-white shadow-sm p-12">
      <div className="absolute top-0 left-1/4 w-72 h-72 rounded-full pointer-events-none" style={{
        background: `radial-gradient(circle, ${step.color}10, transparent 70%)`,
        filter: 'blur(60px)', transition: 'background 0.8s ease'
      }} />
      <div className="relative z-10 max-w-2xl">
        <div className="flex items-center gap-5 mb-10">
          <div className="relative w-12 h-12 flex items-center justify-center">
            <div className="absolute inset-0 rounded-full animate-ping" style={{ background: `${step.color}25` }} />
            <div className="w-4 h-4 rounded-full" style={{ background: step.color }} />
          </div>
          <div>
            <p className="text-xs uppercase tracking-[0.25em] font-bold" style={{ color: step.color }}>Importing Playlist</p>
            <p className="text-sm text-gray-500 mt-1.5 font-medium">This usually takes 10-20 seconds</p>
          </div>
        </div>
        <div className="space-y-4 mb-10">
          {PLAYLIST_STEPS.map((s, i) => (
            <div key={i} className="flex items-center gap-4 transition-all duration-500" style={{ opacity: i <= activeStep ? 1 : 0.2 }}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${i < activeStep ? 'bg-green-50' : i === activeStep ? 'bg-indigo-50' : 'bg-gray-50'}`}>
                <span className="material-symbols-outlined text-[14px]" style={{
                  color: i < activeStep ? '#22c55e' : i === activeStep ? s.color : '#94a3b8'
                }}>{i < activeStep ? 'check' : s.icon}</span>
              </div>
              <span className={`text-sm font-medium ${i === activeStep ? 'text-gray-900' : 'text-gray-500'}`}>{s.text}</span>
            </div>
          ))}
        </div>
        <div className="h-2 rounded-full bg-gray-50 overflow-hidden">
          <motion.div className="h-full rounded-full" style={{ background: 'linear-gradient(90deg, #4f46e5, #6366f1, #818cf8)' }}
            animate={{ width: `${pct}%` }} transition={{ duration: 0.4 }} />
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════
//  TOPIC ANALYSIS MODAL (Outdated only, pre-selected)
// ═══════════════════════════════════════════════
function TopicAnalysisModalInline({ loading, blocks, onClose, onRemove }) {
  const [selected, setSelected] = useState(() => new Set((blocks || []).map(b => b.topicName)));
  const [removing, setRemoving] = useState(false);

  useEffect(() => { if (blocks && blocks.length > 0) { setSelected(new Set(blocks.map(b => b.topicName))); } }, [blocks]);

  const toggle = (name) => { setSelected(prev => { const s = new Set(prev); s.has(name) ? s.delete(name) : s.add(name); return s; }); };

  const handleRemove = async () => { if (selected.size === 0) return; setRemoving(true); await onRemove([...selected]); setRemoving(false); };

  const items = blocks || [];

  return (
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative rounded-[32px] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden bg-white shadow-2xl">
        <div className="p-8 pb-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">🧹 Outdated Topics Found</h2>
              <p className="text-sm mt-1.5 text-gray-500 font-medium">
                {loading ? 'AI is scanning your curriculum...' : items.length > 0 ? 'Uncheck any topics you want to keep. The rest will be removed.' : 'No outdated topics detected!'}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-3 custom-scroll">
          {loading ? (
             <div className="flex flex-col items-center justify-center py-16 gap-4">
                <div className="w-10 h-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
                <p className="text-sm font-bold text-gray-900">Scanning playlist content...</p>
             </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3">
              <span className="material-symbols-outlined text-5xl text-green-500">verified</span>
              <p className="text-sm font-medium text-gray-500">All topics are up to date!</p>
            </div>
          ) : items.map(b => (
            <label key={b.topicName} className={`flex items-start gap-4 p-6 rounded-[24px] cursor-pointer transition-all border ${selected.has(b.topicName) ? 'bg-red-50/50 border-red-100' : 'bg-gray-50/50 border-transparent hover:bg-gray-50'}`}>
              <input type="checkbox" checked={selected.has(b.topicName)} onChange={() => toggle(b.topicName)}
                className="mt-1 w-4 h-4 rounded accent-red-500" />
              <div className="flex-1">
                <p className={`text-sm font-bold ${selected.has(b.topicName) ? 'text-red-700' : 'text-gray-900'}`}>{b.topicName}</p>
                <MarkdownRenderer content={b.reason} className="text-xs mt-1.5 text-gray-600 leading-relaxed" />
                <p className="text-[10px] font-bold text-gray-400 mt-2 uppercase tracking-widest">{b.videoIndices.length} videos</p>
              </div>
            </label>
          ))}
        </div>
        {!loading && items.length > 0 && (
          <div className="p-8 pt-6 bg-gray-50/30 flex items-center justify-between gap-4">
            <p className="text-xs font-bold text-gray-400">{selected.size} topic{selected.size !== 1 ? 's' : ''} will be removed</p>
            <button onClick={handleRemove} disabled={selected.size === 0 || removing}
              className="px-8 py-3 rounded-full text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-500/20 disabled:opacity-30 flex items-center gap-2 transition-all">
              <span className="material-symbols-outlined text-[18px]">{removing ? 'sync' : 'delete_sweep'}</span>
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
    <div className="fixed inset-0 z-100 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="relative rounded-[32px] w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden bg-white shadow-2xl">
        <div className="p-8 pb-6 bg-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">🔮 Trending Missing Topics</h2>
              <p className="text-sm mt-1.5 text-gray-500 font-medium">
                {loading ? 'AI is analyzing your curriculum for gaps...' : `${items.length} missing topic${items.length !== 1 ? 's' : ''} found`}
              </p>
            </div>
            <button onClick={onClose} className="w-10 h-10 rounded-full flex items-center justify-center bg-gray-50 hover:bg-gray-100 transition-all text-gray-400">
              <span className="material-symbols-outlined text-[20px]">close</span>
            </button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto p-8 pt-0 space-y-3 custom-scroll">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-4">
              <div className="w-10 h-10 rounded-full border-3 border-indigo-500 border-t-transparent animate-spin" />
              <p className="text-sm font-bold text-gray-900">AI is finding gaps in curriculum...</p>
            </div>
          ) : items.map(s => (
            <label key={s.topicName} className={`flex items-start gap-4 p-6 rounded-[24px] cursor-pointer transition-all border ${selected.has(s.topicName) ? 'bg-indigo-50/50 border-indigo-100' : 'bg-gray-50/50 border-transparent hover:bg-gray-50'}`}>
              <input type="checkbox" checked={selected.has(s.topicName)} onChange={() => toggle(s.topicName)} className="mt-1 w-4 h-4 rounded accent-indigo-500" />
              <div className="flex-1">
                <p className={`text-sm font-bold ${selected.has(s.topicName) ? 'text-indigo-700' : 'text-gray-900'}`}>{s.topicName}</p>
                <MarkdownRenderer content={s.reason} className="text-xs mt-1.5 text-gray-600 leading-relaxed" />
                <div className="flex flex-wrap gap-2 mt-3">
                  {s.subtopics.map((sub, i) => (
                    <span key={i} className="px-2.5 py-1 rounded-full text-[9px] font-bold bg-indigo-50 text-indigo-500 border border-indigo-100/50 uppercase tracking-wider">
                      {sub.title}
                    </span>
                  ))}
                </div>
              </div>
            </label>
          ))}
        </div>
        {!loading && items.length > 0 && (
          <div className="p-8 pt-6 bg-gray-50/30 flex items-center justify-between gap-4">
            <p className="text-xs font-bold text-gray-400">{selected.size} topics selected</p>
            <button onClick={handleAdd} disabled={selected.size === 0 || adding}
              className="px-8 py-3 rounded-full text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 disabled:opacity-30 flex items-center gap-2 transition-all">
              <span className="material-symbols-outlined text-[18px]">{adding ? 'sync' : 'add_circle'}</span>
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
  const [forgeError, setForgeError] = useState('');
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
    
    const searchParams = new URLSearchParams(loc.search);
    const qParam = searchParams.get('q');
    const actionParam = searchParams.get('action');

    let modified = false;
    if (qParam) {
      setQuery(qParam);
      setTimeout(() => inputRef.current?.focus(), 500);
      modified = true;
    }
    if (actionParam) {
      setActiveTab(actionParam === 'import' ? 'playlist' : 'forge');
      if (actionParam === 'forge') setTimeout(() => inputRef.current?.focus(), 500);
      if (actionParam === 'import') setTimeout(() => document.getElementById('playlistUrlInput')?.focus(), 500);
      modified = true;
    }
    
    if (modified) {
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
    if (usageData?.permissions?.forge && !usageData.permissions.forge.canCreate) {
      return;
    }
    try {
      const trimmedQuery = query.trim();
      setForgeError('');
      setCreating(true);
      const genRes = await fetch(`${API_BASE}/topic-generator`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmedQuery })
      });
      const curriculum = await genRes.json();
      if (!genRes.ok) {
        throw new Error(curriculum.error || curriculum.message || 'Failed to generate a curriculum for this topic.');
      }
      if (!curriculum || !curriculum.modules) {
        throw new Error("Invalid curriculum format received from AI");
      }

      const saveRes = await fetch(`${API_BASE}/api/course/create`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          userName: user.firstName || user.fullName || 'Learner',
          llmCurriculum: {
            course_query: trimmedQuery,
            course_title: curriculum.course_title || trimmedQuery,
            modules: curriculum.modules.map(mod => ({
              module_id: mod.module_id, module_title: mod.module_title,
              subtopics: (mod.subtopics || []).map(sub => ({
                subtopic_id: sub.subtopic_id, subtopic_title: sub.subtopic_title,
                Youtube_query: sub.youtube_search_query
              }))
            }))
          }
        })
      });
      const saveData = await saveRes.json();
      if (!saveRes.ok || !saveData.success) {
        throw new Error(saveData.message || saveData.error || 'Failed to save the course to your profile.');
      }

      if (saveData.course) {
        const totalSubtopics = (saveData.course.modules || []).reduce(
          (count, mod) => count + (mod.subtopics || []).length,
          0
        );

        const optimisticCourse = {
          ...saveData.course,
          sourceType: saveData.course.sourceType || 'ai-generated',
          progress: 0,
          completedSubtopics: 0,
          totalSubtopics,
          totalModules: (saveData.course.modules || []).length
        };

        setCourses(prev => [
          optimisticCourse,
          ...prev.filter(course => course._id !== optimisticCourse._id)
        ]);
      }

      setQuery('');
      await fetchAll();
    } catch (err) {
      console.error(err);
      setForgeError(err.message || 'Something went wrong while creating your course.');
    }
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
    if (usageData?.permissions?.playlist && !usageData.permissions.playlist.canCreate) {
      return;
    }
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
    setAnalysisData(null);
    setShowAnalysisModal(true);
    try {
      const res = await fetch(`${API_BASE}/api/course/${draftCourse._id}/playlist/analyze`, { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        setAnalysisData(data.analysis);
      } else {
        setShowAnalysisModal(false);
      }
    } catch (e) { 
      console.error(e);
      setShowAnalysisModal(false);
    } finally { 
      setAnalyzing(false); 
    }
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
  const planName = usageData?.plan?.toUpperCase() || 'FREE';
  const hasProFeatures = usageData ? usageData.plan === 'pro' || usageData.plan === 'ultra' : false;
  const showUpgradeLink = usageData ? usageData.plan !== 'ultra' : true;
  const forgePermission = usageData?.permissions?.forge || null;
  const playlistPermission = usageData?.permissions?.playlist || null;

  return (
    <>
      <SignedIn>
        {/* ── Superb Mesh Background ── */}
        <div className="fixed inset-0 z-0 bg-[#f8fafc] overflow-hidden">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-200/40 blur-[120px] animate-pulse" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-200/30 blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] rounded-full bg-purple-100/40 blur-[100px]" />
          <div className="absolute bottom-[20%] left-[10%] w-[25%] h-[25%] rounded-full bg-indigo-50/50 blur-[80px]" />
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
          {showAnalysisModal && (
            <TopicAnalysisModalInline 
              loading={analyzing}
              blocks={analysisData?.topicBlocks || []} 
              onClose={() => setShowAnalysisModal(false)} 
              onRemove={handleRemoveTopics} 
            />
          )}

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
                <p className="text-[10px] uppercase tracking-[0.3em] mb-2 font-bold text-gray-400">
                  {greeting}
                </p>
                <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight leading-[1.1] text-gray-900">
                  {user?.firstName || 'Learner'}<span className="text-indigo-500">.</span>
                </h1>
              </div>
              {activityMeta.streak > 0 && (
                <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ delay: 0.3 }}
                  className="flex items-center gap-3 px-6 py-3 rounded-[24px] bg-white border border-gray-100 shadow-sm">
                  <div className="w-10 h-10 rounded-full bg-orange-50 flex items-center justify-center text-xl">🔥</div>
                  <div>
                    <p className="text-sm font-bold text-gray-900 leading-none">{activityMeta.streak} day streak</p>
                    <p className="text-[11px] mt-1 text-gray-500 font-medium">{activityMeta.totalThisWeek} topics this week</p>
                  </div>
                </motion.div>
              )}
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
                    className="bg-white/40 backdrop-blur-2xl rounded-[48px] border border-white/60 shadow-[0_20px_64px_rgba(0,0,0,0.06)] p-10 md:p-14 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col max-w-2xl">
                      <div className="flex items-center justify-between mb-4">
                        {usageData && (
                          <>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-900">
                              {planName} PLAN
                            </span>
                            <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-indigo-50 text-indigo-600 border border-indigo-100">
                              {forgePermission?.activeCount ?? 0}/{forgePermission?.maxCourses ?? usageData.limits.maxCourses} Forge Courses
                            </span>
                          </>
                        )}
                      </div>
                      <h2 className="text-3xl md:text-5xl font-medium text-gray-900 mb-2 leading-tight">
                        What do you want to learn today?
                      </h2>
                      <p className="text-gray-500 mb-8">Cluss will automatically generate a tailored curriculum just for you.</p>
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                        <div className="flex-1 flex items-center bg-gray-50 rounded-full px-6 py-4 border border-gray-200 focus-within:border-black transition-colors">
                          <span className="material-symbols-outlined text-gray-400 mr-3">search</span>
                          <input
                            ref={inputRef} type="text"
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400"
                            placeholder="e.g. Machine Learning, Web Development, Data Science..."
                            value={query} onChange={e => { setQuery(e.target.value); setForgeError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleCreateCourse()}
                          />
                        </div>
                        <button onClick={handleCreateCourse} disabled={!query.trim() || creating || (forgePermission && !forgePermission.canCreate)}
                          className="group relative cursor-pointer px-8 py-4 bg-[#e5e9eb] flex gap-2 rounded-full overflow-hidden shrink-0 items-center justify-center disabled:opacity-50">
                          <div className='absolute inset-0 bg-black translate-y-full group-hover:translate-y-0 transition-transform duration-500'></div>
                          <div className='relative z-10 flex gap-2 text-gray-900 group-hover:text-white transition-colors duration-500 font-medium'>
                            Forge Path
                          </div>
                        </button>
                      </div>
                      {forgeError && (
                        <div className="mt-6 p-4 rounded-2xl border border-red-100 bg-red-50 flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                          <p className="text-sm text-red-500 font-medium">{forgeError}</p>
                        </div>
                      )}
                      {forgePermission && !forgePermission.canCreate && (
                        <div className="mt-6 p-4 rounded-2xl border border-red-100 bg-red-50 flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                          <div>
                            <p className="font-bold text-red-600 text-sm">Limit Reached</p>
                            <p className="text-sm text-red-500 mt-1">{forgePermission.message}</p>
                            {showUpgradeLink && (
                              <Link to="/#pricing" className="inline-block mt-3 px-4 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-full transition-colors">
                                View Plans
                              </Link>
                            )}
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
                    className="bg-white/40 backdrop-blur-2xl rounded-[48px] border border-white/60 shadow-[0_20px_64px_rgba(0,0,0,0.06)] p-10 md:p-14 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col">

                      {/* Step indicator */}
                      <div className="flex items-center gap-4 mb-8">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-green-50 border border-green-100">
                            <span className="material-symbols-outlined text-[14px] text-green-600">check</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-green-600 tracking-wider">Imported</span>
                        </div>
                        <div className="w-10 h-px bg-gray-100" />
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full flex items-center justify-center bg-indigo-50 border border-indigo-100">
                            <span className="text-[10px] font-bold text-indigo-600">2</span>
                          </div>
                          <span className="text-[10px] uppercase font-bold text-indigo-600 tracking-wider">Optimize</span>
                        </div>
                      </div>

                      {/* Course Title */}
                      <h2 className="text-3xl md:text-5xl font-medium text-gray-900 mb-2 leading-tight">
                        {draftCourse.course_title}
                      </h2>
                      <p className="text-gray-500 mb-10 font-medium">
                        {draftCourse.days?.reduce((sum, d) => sum + d.videos.length, 0)} videos • {draftCourse.days?.length} days • ~{draftCourse.hoursPerDay}h/day
                      </p>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
                        {/* Filler Optimization */}
                        <div className="space-y-4">
                          <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-gray-400 px-1">Curriculum Optimization</h4>
                          
                          {hasProFeatures ? (
                            <button
                              onClick={() => setShowFillerModal(true)}
                              className={`w-full p-6 rounded-[24px] text-left transition-all relative overflow-hidden border ${
                                fillersApplied 
                                  ? 'bg-green-50 border-green-100 text-green-700' 
                                  : 'bg-indigo-50/50 border-indigo-100 hover:bg-indigo-50 text-indigo-700'
                              }`}
                            >
                              <div className="flex items-center gap-4 mb-2">
                                <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${fillersApplied ? 'bg-green-100' : 'bg-indigo-100'}`}>
                                  <span className="material-symbols-outlined text-[20px]">{fillersApplied ? 'verified' : 'auto_awesome'}</span>
                                </div>
                                <div>
                                  <p className="text-sm font-bold leading-none">Find Missing Topics</p>
                                  {fillersApplied && <span className="text-[10px] font-bold uppercase mt-1 inline-block">Applied</span>}
                                </div>
                              </div>
                              <p className="text-xs font-medium opacity-80 leading-relaxed">
                                {fillersApplied ? 'Trending topics added to your plan!' : 'AI scans for missing trending topics to bridge the gap in your curriculum.'}
                              </p>
                            </button>
                          ) : (
                            <div className="w-full p-6 rounded-[24px] text-left border border-gray-100 bg-gray-50 opacity-60">
                              <div className="flex items-center gap-4 mb-2">
                                <div className="w-10 h-10 rounded-2xl bg-gray-200 flex items-center justify-center">
                                  <span className="material-symbols-outlined text-[20px] text-gray-400">lock</span>
                                </div>
                                <div>
                                  <p className="text-sm font-bold text-gray-400">Find Missing Topics</p>
                                  <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-100 text-amber-700 mt-1 inline-block">PRO / ULTRA</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-400 font-medium">Upgrade to Pro or Ultra to unlock AI-powered topic gap analysis.</p>
                            </div>
                          )}
                        </div>

                        {/* Summary / Stats Info */}
                        <div className="flex flex-col justify-center p-6 rounded-[24px] border border-dashed border-gray-200 bg-gray-50/50">
                           <div className="flex items-center gap-3 mb-6">
                              <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-500">
                                <span className="material-symbols-outlined text-[20px]">bolt</span>
                              </div>
                              <p className="text-sm font-medium text-gray-600">This plan is ready for action. You can always edit subtopics later.</p>
                           </div>
                           <div className="flex items-center gap-4">
                              <div className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-100 text-center">
                                 <p className="text-xl font-bold text-gray-900">{draftCourse.days?.length}</p>
                                 <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Days</p>
                              </div>
                              <div className="flex-1 px-4 py-3 rounded-2xl bg-white border border-gray-100 text-center">
                                 <p className="text-xl font-bold text-gray-900">{draftCourse.hoursPerDay}h</p>
                                 <p className="text-[9px] font-bold uppercase tracking-wider text-gray-400">Daily</p>
                              </div>
                           </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center gap-4">
                        <button onClick={handleDiscardDraft}
                          className="px-8 py-4 rounded-full text-sm font-bold text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                          Start Over
                        </button>
                        <button onClick={handleSaveCourse}
                          className="group relative cursor-pointer px-10 py-4 bg-black flex gap-3 rounded-full overflow-hidden shrink-0 items-center justify-center shadow-lg">
                          <div className='absolute inset-0 bg-indigo-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500'></div>
                          <div className='relative z-10 flex gap-2 text-white font-bold items-center'>
                            <span className="material-symbols-outlined text-[18px]">rocket_launch</span>
                            Save & Start Learning
                          </div>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ) : (
                  /* ═══ STAGE 1: IMPORT URL ═══ */
                  <motion.div key="playlist-input" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="bg-white/40 backdrop-blur-2xl rounded-[48px] border border-white/60 shadow-[0_20px_64px_rgba(0,0,0,0.06)] p-10 md:p-14 relative overflow-hidden">
                    <div className="relative z-10 flex flex-col max-w-2xl">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex flex-wrap items-center gap-3">
                          <p className="font-label text-[11px] uppercase tracking-[0.25em] font-bold text-red-500">
                            <span className="inline-flex items-center gap-1.5">
                              <span className="material-symbols-outlined" style={{ fontSize: '14px' }}>smart_display</span>
                              Import YouTube Playlist
                            </span>
                          </p>
                          {usageData && (
                            <>
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-gray-100 text-gray-900">
                                {planName} PLAN
                              </span>
                              <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase bg-red-50 text-red-600 border border-red-100">
                                {playlistPermission?.activeCount ?? 0}/{playlistPermission?.maxCourses ?? usageData.limits.maxCourses} Playlist Courses
                              </span>
                            </>
                          )}
                        </div>
                      </div>
                      <h2 className="text-3xl md:text-5xl font-medium text-gray-900 mb-2 leading-tight">
                        Turn any playlist into a study plan
                      </h2>
                      <p className="text-gray-500 mb-8">
                        Paste a YouTube playlist link and we'll organize it into daily study sessions.
                      </p>

                      {/* Playlist URL Input */}
                      <div className="space-y-4">
                        <div className="flex-1 flex items-center bg-gray-50 rounded-full px-6 py-4 border border-gray-200 focus-within:border-black transition-colors">
                          <span className="material-symbols-outlined text-gray-400 mr-3">link</span>
                          <input
                            ref={playlistInputRef}
                            id="playlistUrlInput"
                            type="text"
                            className="flex-1 bg-transparent border-none outline-none text-gray-900 placeholder:text-gray-400"
                            placeholder="https://youtube.com/playlist?list=PLxxxxxx"
                            value={playlistUrl}
                            onChange={e => { setPlaylistUrl(e.target.value); setPlaylistError(''); }}
                            onKeyDown={e => e.key === 'Enter' && handleImportPlaylist()}
                          />
                        </div>

                        {/* Hours Per Day + Submit */}
                        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                          <div className="flex items-center gap-3 bg-gray-50 rounded-full px-6 py-4 border border-gray-200">
                            <span className="material-symbols-outlined text-gray-400">schedule</span>
                            <span className="text-sm font-medium text-gray-500">Hours/day:</span>
                            <input
                              type="number"
                              min="0.5"
                              max="12"
                              step="0.5"
                              value={hoursPerDay}
                              onChange={e => setHoursPerDay(parseFloat(e.target.value) || 2)}
                              className="w-16 bg-transparent border-none outline-none font-bold text-gray-900 text-center"
                            />
                          </div>

                          <button
                            onClick={handleImportPlaylist}
                            disabled={!playlistUrl.trim() || importingPlaylist || (playlistPermission && !playlistPermission.canCreate)}
                            className="group relative cursor-pointer px-8 py-4 bg-red-500 flex gap-2 rounded-full overflow-hidden shrink-0 items-center justify-center disabled:opacity-50"
                          >
                            <div className='absolute inset-0 bg-red-600 translate-y-full group-hover:translate-y-0 transition-transform duration-500'></div>
                            <div className='relative z-10 flex gap-2 text-white font-medium items-center'>
                              <span className="material-symbols-outlined text-base">download</span>
                              Build Study Plan
                            </div>
                          </button>
                        </div>
                      </div>

                      {playlistPermission && !playlistPermission.canCreate && (
                        <div className="mt-6 p-4 rounded-2xl border border-red-100 bg-red-50 flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                          <div>
                            <p className="font-bold text-red-600 text-sm">Limit Reached</p>
                            <p className="text-sm text-red-500 mt-1">{playlistPermission.message}</p>
                            {showUpgradeLink && (
                              <Link to="/#pricing" className="inline-block mt-3 px-4 py-1.5 bg-white border border-red-200 hover:bg-red-50 text-red-600 text-xs font-bold rounded-full transition-colors">
                                View Plans
                              </Link>
                            )}
                          </div>
                        </div>
                      )}

                      {/* Error Message */}
                      {playlistError && (
                        <div className="mt-6 p-4 rounded-2xl border border-red-100 bg-red-50 flex items-start gap-3">
                          <span className="material-symbols-outlined text-red-500 text-xl">error</span>
                          <p className="text-sm text-red-500 font-medium">{playlistError}</p>
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
            <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60" >
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
                        <span className="text-xl font-bold text-gray-900">{progressPct}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-gray-600 text-balance">
                        <span className="font-bold text-xl text-gray-900">{stats.completedSubtopics}</span> of {stats.totalSubtopics} topics completed
                      </p>
                      <div className="flex gap-2.5 mt-3 flex-wrap">
                        <span className="inline-block px-4 py-1 rounded-full text-[11px] font-bold bg-indigo-50 text-indigo-600 border border-indigo-100">
                          {activeCourses} active
                        </span>
                        <span className="inline-block px-4 py-1 rounded-full text-[11px] font-bold bg-green-50 text-green-600 border border-green-100">
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
            <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60" >
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[1000px] overflow-y-auto custom-scroll pr-2 -mr-2">
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
            <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60" >
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
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 max-h-[1000px] overflow-y-auto custom-scroll pr-2 -mr-2">
                  {playlistCourses.map((course, i) => {
                    const palette = { from: '#ef4444', to: '#dc2626', icon: '📺' };
                    const pct = course.progress;
                    return (
                      <motion.div
                        key={course._id}
                        initial={{ opacity: 0, y: 16 }}
                        whileHover={{ y: -8, scale: 1.02 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05, duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
                        className="relative w-full cursor-pointer group"
                      >
                        <div className="relative overflow-hidden rounded-[40px] bg-white/40 backdrop-blur-2xl border border-white/60 shadow-[0_8px_32px_rgba(0,0,0,0.04)] transition-all duration-500 group-hover:shadow-[0_20px_48px_rgba(0,0,0,0.08)] h-[260px]">
                          
                          {/* Glow effect on hover */}
                          <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
                               style={{ background: `radial-gradient(circle at 50% 0%, #ef444410, transparent 70%)` }} />

                          {/* Delete Button */}
                          <button 
                             onClick={(e) => { e.stopPropagation(); setCourseToDelete(course); }}
                             className="absolute top-6 right-6 w-9 h-9 rounded-full flex items-center justify-center bg-white/60 backdrop-blur-md border border-white/80 hover:bg-red-500 hover:text-white transition-all z-20 opacity-0 group-hover:opacity-100 text-gray-500 shadow-sm"
                          >
                             <span className="material-symbols-outlined text-[18px]">delete</span>
                          </button>

                          <div className="relative z-10 p-8 h-full flex flex-col justify-between" onClick={() => nav(`/playlist/${course._id}`)}>
                            <div>
                              <h3 className="font-bold text-[20px] text-gray-900 leading-[1.2] tracking-tight line-clamp-2 mb-4 group-hover:text-red-600 transition-colors">
                                {course.course_title}
                              </h3>
                              <div className="flex items-center gap-3">
                                <span className="px-3 py-1 rounded-full text-[9px] font-bold uppercase bg-white/50 text-gray-500 border border-white/80 tracking-wider">
                                  {course.totalDays} days
                                </span>
                                <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.4)]" />
                              </div>
                            </div>
                            <div>
                              <div className="flex items-end justify-between mb-4">
                                <div className="flex flex-col">
                                  <span className="text-gray-400 text-[10px] font-bold uppercase tracking-widest mb-1">Playlist Progress</span>
                                  <p className="text-gray-400 text-[11px] font-medium">
                                    {course.completedDays}/{course.totalDays} days completed
                                  </p>
                                </div>
                                <span className="text-3xl font-black italic tracking-tighter text-gray-900/10 group-hover:text-red-600/20 transition-all duration-500">
                                  {pct}%
                                </span>
                              </div>
                              <div className="h-2 rounded-full bg-black/5 overflow-hidden p-[1px]">
                                <motion.div className="h-full rounded-full relative" 
                                  style={{ 
                                    background: `linear-gradient(90deg, #ef4444, #f87171)`,
                                    boxShadow: `0 0 12px rgba(239,68,68,0.3)`
                                  }}
                                  initial={{ width: 0 }} 
                                  animate={{ width: `${pct}%` }} 
                                  transition={{ duration: 1, delay: i * 0.1, ease: "circOut" }} 
                                >
                                  <div className="absolute inset-0 bg-white/20 animate-[shimmer_2s_infinite]" 
                                       style={{ background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)' }} />
                                </motion.div>
                              </div>
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
              <div className="bg-white rounded-[32px] border border-gray-100 p-6 h-full shadow-sm" >
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
              <div className="bg-white rounded-[32px] border border-gray-100 p-6 h-full shadow-sm" >
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
              <div className="bg-white rounded-[32px] border border-gray-100 p-6 h-full shadow-sm" >
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
          <section className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-10">
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
