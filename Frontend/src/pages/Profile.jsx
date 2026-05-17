import React, { useState, useEffect, useCallback } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import { Flame, Book, Brain, X, CreditCard, TrendingDown, TrendingUp, Cpu } from 'lucide-react';
import { AVATARS } from '../utils/avatars';
import { useNavigate } from 'react-router-dom';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useUsage } from '../contexts/UsageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const BADGES = [
  { id: 'sorting_hat', name: "First Steps", description: "Complete your first topic.", image: '/badges/sorting_hat.png' },
  { id: 'seeker', name: "Seeker", description: "Master 10 topics.", image: '/badges/seeker.png' },
  { id: 'prefect', name: "Prefect", description: "Maintain a 10-day learning streak.", image: '/badges/prefect.png' },
  { id: 'head_boy_girl', name: "Head Boy / Head Girl", description: "Maintain a 30-day learning streak.", image: '/badges/head_boy.png' },
  { id: 'auror', name: "Auror in Training", description: "Create 5 different study plans.", image: '/badges/auror.png' },
  { id: 'triwizard', name: "Triwizard Champion", description: "Maintain a 7-day learning streak.", image: '/badges/triwizard.png' },
  { id: 'master_of_death', name: "Master of Death", description: "Unlock all other badges.", image: '/badges/master_of_death.png' },
];

function ActivityBars({ activityData }) {
  if (!activityData || activityData.length === 0) return <div className="text-sm text-zinc-500 mt-4">No activity data available yet.</div>;
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
          <motion.div key={i} whileHover={{ y: -4 }} className="flex-1 flex flex-col items-center gap-2 group/bar cursor-default">
            {day.subtopicsCompleted > 0 ? (
              <span className={`text-[10px] font-black transition-colors ${isToday ? 'text-white' : 'text-zinc-500 group-hover/bar:text-white'}`}>
                {day.subtopicsCompleted}
              </span>
            ) : (
              <span className="text-[10px] font-black opacity-0">0</span>
            )}
            <div className="w-full relative rounded-md overflow-hidden bg-white/[0.04] h-24 border border-white/[0.02] transition-colors group-hover/bar:bg-white/[0.08]">
              <motion.div className={`absolute bottom-0 left-0 right-0 rounded-t-md transition-colors ${isToday ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.5)]' : 'bg-zinc-600 group-hover/bar:bg-zinc-400'}`}
                initial={{ height: 0 }} animate={{ height: `${Math.max(pct, day.subtopicsCompleted > 0 ? 10 : 0)}%` }}
                transition={{ duration: 0.7, delay: i * 0.07, ease: 'easeOut' }}
              />
            </div>
            <span className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isToday ? 'text-white' : 'text-zinc-500 group-hover/bar:text-zinc-300'}`}>
              {dayLabel}
            </span>
          </motion.div>
        );
      })}
    </div>
  );
}

function MiniCalendar({ activityData }) {
  const [date, setDate] = useState(new Date());
  const today = new Date();
  const year = date.getFullYear(), month = date.getMonth();
  const monthName = date.toLocaleString('default', { month: 'long' });
  const firstDay = (new Date(year, month, 1).getDay() + 6) % 7;
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const activityByDate = {};
  if (activityData) {
    activityData.forEach(d => { activityByDate[d.date] = d.subtopicsCompleted > 0; });
  }

  return (
    <div className="mt-4">
      <div className="flex items-center justify-between mb-6 border-b border-white/10 pb-4">
        <span className="text-sm font-black text-white">{monthName} {year}</span>
        <div className="flex gap-2">
          <button onClick={() => setDate(new Date(year, month - 1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white">
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>
          <button onClick={() => setDate(new Date(year, month + 1))} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-white">
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center">
        {['M','T','W','T','F','S','S'].map((d, i) => <span key={`${d}-${i}`} className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">{d}</span>)}
        {Array.from({ length: firstDay }).map((_, i) => <div key={`empty-${i}`} className="h-8" />)}
        {Array.from({ length: daysInMonth }, (_, i) => {
          const d = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
          const active = activityByDate[dateStr];
          const isT = today.getFullYear() === year && today.getMonth() === month && today.getDate() === d;
          return (
            <motion.div 
              key={d} 
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: i * 0.01 }}
              whileHover={{ scale: 1.15, zIndex: 10 }}
              className={`h-8 w-8 mx-auto flex items-center justify-center rounded-full text-[11px] font-black transition-colors cursor-pointer border ${
                isT ? 'bg-white text-black border-white shadow-[0_0_15px_rgba(255,255,255,0.4)] hover:shadow-[0_0_25px_rgba(255,255,255,0.7)]' : active ? 'bg-white/15 text-white border-white/20 hover:bg-white hover:text-black' : 'text-zinc-500 border-transparent hover:border-white/20 hover:bg-white/5 hover:text-white'
              }`}
            >
              {d}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { usageData } = useUsage();
  const [selectedAvatar, setSelectedAvatar] = useState('none');
  
  const [stats, setStats] = useState(() => {
    if (!user) return { totalCourses: 0, completedSubtopics: 0, totalSubtopics: 0 };
    const cached = localStorage.getItem(`cluss_stats_${user.id}`);
    return cached ? JSON.parse(cached) : { totalCourses: 0, completedSubtopics: 0, totalSubtopics: 0 };
  });
  
  const [activityMeta, setActivityMeta] = useState(() => {
    if (!user) return { streak: 0, totalThisWeek: 0 };
    const cached = localStorage.getItem(`cluss_actMeta_${user.id}`);
    return cached ? JSON.parse(cached) : { streak: 0, totalThisWeek: 0 };
  });
  
  const [activityData, setActivityData] = useState(() => {
    if (!user) return [];
    const cached = localStorage.getItem(`cluss_actData_${user.id}`);
    return cached ? JSON.parse(cached) : [];
  });
  
  const [loading, setLoading] = useState(false);
  const [newlyUnlockedBadges, setNewlyUnlockedBadges] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);

  useEffect(() => {
    if (!user) return;
    const currentUnlocked = BADGES.filter(badge => {
      if (badge.id === 'sorting_hat') return stats.completedSubtopics >= 1;
      if (badge.id === 'seeker') return stats.completedSubtopics >= 10;
      if (badge.id === 'prefect') return activityMeta.streak >= 10;
      if (badge.id === 'head_boy_girl') return activityMeta.streak >= 30;
      if (badge.id === 'auror') return stats.totalCourses >= 5;
      if (badge.id === 'triwizard') return activityMeta.streak >= 7;
      if (badge.id === 'master_of_death') return (stats.completedSubtopics >= 10 && activityMeta.streak >= 30 && stats.totalCourses >= 5);
      return false;
    }).map(b => b.id);

    const cachedUnlocked = JSON.parse(localStorage.getItem(`cluss_unlocked_${user.id}`) || '[]');
    
    const newly = currentUnlocked.filter(id => !cachedUnlocked.includes(id));
    if (newly.length > 0) {
      if (cachedUnlocked.length > 0) {
        const fullBadges = BADGES.filter(b => newly.includes(b.id));
        setNewlyUnlockedBadges(fullBadges);
        setTimeout(() => setNewlyUnlockedBadges([]), 5000);
      }
      localStorage.setItem(`cluss_unlocked_${user.id}`, JSON.stringify(currentUnlocked));
    }
  }, [stats, activityMeta, user]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    try {
      setLoading(true);
      const timestamp = Date.now();
      const [courseRes, activityRes, avatarRes] = await Promise.all([
        fetch(`${API_BASE}/api/study-plans/user/${user.id}?t=${timestamp}`),
        fetch(`${API_BASE}/api/activity/${user.id}?days=30&t=${timestamp}`),
        fetch(`${API_BASE}/api/user/${user.id}/avatar?t=${timestamp}`)
      ]);
      
      const courseData = await courseRes.json();
      const activityDataRes = await activityRes.json();
      const avatarData = await avatarRes.json();

      if (courseData.success) {
         setStats(courseData.stats);
         localStorage.setItem(`cluss_stats_${user.id}`, JSON.stringify(courseData.stats));
      }
      if (activityDataRes.success) {
        setActivityData(activityDataRes.activity);
        setActivityMeta({ streak: activityDataRes.streak, totalThisWeek: activityDataRes.totalThisWeek });
        localStorage.setItem(`cluss_actData_${user.id}`, JSON.stringify(activityDataRes.activity));
        localStorage.setItem(`cluss_actMeta_${user.id}`, JSON.stringify({ streak: activityDataRes.streak, totalThisWeek: activityDataRes.totalThisWeek }));
      }
      if (avatarData.success && avatarData.avatar) {
        setSelectedAvatar(avatarData.avatar);
        localStorage.setItem(`cluss_avatar_${user.id}`, avatarData.avatar);
      }
    } catch (error) {
      console.error("Error fetching profile data:", error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (!user) return;
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/${user.id}/transactions?page=${txPage}&limit=20`);
        const txData = await res.json();
        if (txData.success) {
          setTransactions(txData.transactions);
          setTxTotalPages(txData.totalPages);
        }
      } catch (err) { console.error(err); }
    };
    fetchTransactions();
  }, [user, txPage]);

  const handleAvatarSelect = async (avatarId) => {
    setSelectedAvatar(avatarId);
    if (user?.id) localStorage.setItem(`cluss_avatar_${user.id}`, avatarId);
    
    try {
      await fetch(`${API_BASE}/api/user/${user.id}/avatar`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar: avatarId })
      });
      window.dispatchEvent(new Event('avatarChanged'));
    } catch (err) { console.error("Error saving avatar:", err); }
  };

  const handleSignOut = () => {
    signOut(() => navigate('/'));
  };

  if (!user) return null;

  const selectedAvatarData = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[0];
  const isNone = selectedAvatar === 'none';

  return (
    <DashboardShell title="Profile" eyebrow="Settings & Identity">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* ══ PREMIUM HEADER ══ */}
        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#111111] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent shadow-[0_30px_100px_rgba(0,0,0,0.35)] p-8 md:p-12">
          <div className="absolute -left-16 top-0 h-80 w-80 rounded-full bg-white/[0.04] blur-[100px] pointer-events-none" />
          <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-zinc-500/[0.04] blur-[100px] pointer-events-none" />
          
          <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8">
            <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
              <div className="relative group">
                <div className="absolute -inset-1 rounded-full bg-gradient-to-br from-white/20 to-transparent opacity-50 blur-md transition-opacity duration-500 group-hover:opacity-100" />
                <div className="relative w-32 h-32 rounded-full overflow-hidden border border-white/10 shadow-2xl bg-[#16181d] flex items-center justify-center">
                  {isNone ? (
                    <img src={user.imageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} alt="Profile" className="w-full h-full object-cover" />
                  ) : (
                    <img src={selectedAvatarData.image} alt={selectedAvatarData.name} className="w-full h-full object-cover" />
                  )}
                </div>
              </div>
              <div className="text-center md:text-left mt-2 md:mt-4">
                <h1 className="text-4xl md:text-5xl font-black text-white tracking-tight">{user.fullName || 'Wizard'}</h1>
                <p className="text-zinc-400 font-medium tracking-wide mt-2">{user.primaryEmailAddress?.emailAddress}</p>
              </div>
            </div>
            
            <button 
              onClick={handleSignOut}
              className="relative overflow-hidden rounded-full bg-white/[0.05] border border-white/10 px-8 py-3.5 transition-all duration-300 hover:bg-white hover:text-black group"
            >
              <span className="relative z-10 text-sm font-black uppercase tracking-wider text-white transition-colors duration-300 group-hover:text-black">
                Sign Out
              </span>
            </button>
          </div>
        </section>

        {/* ══ CREDIT BALANCE (HIGH-CONTRAST MONOCHROME) ══ */}
        {usageData && (
          <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#141414] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-8 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/30 group">
            <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
            
            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex items-center gap-6">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.05] shadow-[0_10px_30px_rgba(0,0,0,0.2)]">
                  <CreditCard className="h-7 w-7 text-white" />
                </div>
                <div>
                  <p className="text-[11px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-1">Credit Balance</p>
                  <p className="text-4xl md:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-white to-zinc-400">
                    {usageData.balance}
                    {usageData.plan === 'free' && (
                      <span className="text-xl font-bold text-zinc-600"> / {usageData.allowance}</span>
                    )}
                  </p>
                </div>
              </div>

              <div className="flex flex-wrap items-center justify-center md:justify-end gap-3">
                <div className="rounded-full border border-white/10 bg-white/[0.05] px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-white backdrop-blur-md">
                  {usageData.plan} Plan
                </div>
                <div className="rounded-full border border-zinc-700 bg-zinc-900 px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-zinc-300">
                  {usageData.plan === 'free'
                    ? `🔄 Resets to ${usageData.allowance} weekly`
                    : `⚡ +${usageData.allowance} credits / day`
                  }
                </div>
                {usageData.plan !== 'free' && (
                  <div className="rounded-full border border-white/20 bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-black flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-[13px]">timer</span>
                    {usageData.billingCycleEnd
                      ? `${Math.max(0, Math.ceil((new Date(usageData.billingCycleEnd) - new Date()) / (1000 * 60 * 60 * 24)))} Days Left`
                      : 'No Expiry'
                    }
                  </div>
                )}
              </div>
            </div>
          </section>
        )}

        {/* ══ SPLIT VIEW: STATS & CALENDAR ══ */}
        <div className="grid grid-cols-1 xl:grid-cols-[22rem_1fr] gap-8">
          
          <div className="flex flex-col gap-5">
            {[
              { icon: Flame, value: activityMeta.streak, label: "Daily Streak" },
              { icon: Book, value: stats.totalCourses, label: "Plans Built" },
              { icon: Brain, value: stats.completedSubtopics, label: "Topics Learned" }
            ].map((stat, idx) => (
              <motion.div 
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: idx * 0.1, ease: 'easeOut' }}
                whileHover={{ scale: 1.02, backgroundColor: 'rgba(255,255,255,0.02)' }}
                key={idx} 
                className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#161616] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-6 shadow-[0_10px_40px_rgba(0,0,0,0.5)] flex items-center gap-6 group hover:border-white/30 transition-colors cursor-default"
              >
                <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03] text-white transition-all duration-300 group-hover:scale-110 group-hover:bg-white group-hover:text-black">
                  <stat.icon className="h-6 w-6" />
                </div>
                <div>
                  <p className="text-3xl font-black text-white">{loading ? '-' : stat.value}</p>
                  <p className="text-[11px] font-black text-zinc-500 uppercase tracking-widest mt-1">{stat.label}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#141414] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-colors hover:border-white/20"
            >
              <h3 className="text-xl font-black tracking-tight text-white mb-2">Momentum</h3>
              <p className="text-xs font-semibold text-zinc-500">Lessons past 7 days</p>
              <ActivityBars activityData={activityData} />
            </motion.div>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 }}
              whileHover={{ scale: 1.01 }}
              className="relative overflow-hidden rounded-[2.4rem] border border-white/10 bg-[#141414] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-8 shadow-[0_20px_60px_rgba(0,0,0,0.4)] transition-colors hover:border-white/20"
            >
              <h3 className="text-xl font-black tracking-tight text-white mb-2">Heatmap</h3>
              <MiniCalendar activityData={activityData} />
            </motion.div>
          </div>
        </div>

        {/* ══ AVATARS & BADGES ══ */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Avatar Selection */}
          <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#141414] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-8 shadow-xl">
            <h2 className="text-2xl font-black tracking-tight text-white mb-8">Identity</h2>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-4">
              {AVATARS.map((avatar) => {
                const isSelected = selectedAvatar === avatar.id;
                return (
                  <button
                    key={avatar.id}
                    onClick={() => handleAvatarSelect(avatar.id)}
                    className={`relative p-4 rounded-[1.5rem] flex flex-col items-center gap-4 transition-all duration-300 border ${
                      isSelected 
                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)] scale-105' 
                        : 'bg-white/[0.02] text-zinc-400 hover:bg-white/[0.08] hover:text-white border-white/10 hover:border-white/20'
                    }`}
                  >
                    {avatar.id === 'none' ? (
                       <avatar.icon className="w-10 h-10" />
                    ) : (
                       <div className={`w-12 h-12 rounded-full overflow-hidden ${isSelected ? 'border border-black/10' : 'border border-white/10'}`}>
                         <img src={avatar.image} alt={avatar.name} className="w-full h-full object-cover" />
                       </div>
                    )}
                    <span className="text-[10px] font-black uppercase tracking-widest">{avatar.name}</span>
                  </button>
                );
              })}
            </div>
          </section>

          {/* Badges Selection */}
          <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#141414] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-8 shadow-xl">
            <h2 className="text-2xl font-black tracking-tight text-white mb-8">Achievements</h2>
            <div className="custom-scroll max-h-[340px] overflow-y-auto pr-4 grid grid-cols-1 gap-4">
              {BADGES.map((badge, index) => {
                let unlocked = false;
                if (badge.id === 'sorting_hat') unlocked = stats.completedSubtopics >= 1;
                if (badge.id === 'seeker') unlocked = stats.completedSubtopics >= 10;
                if (badge.id === 'prefect') unlocked = activityMeta.streak >= 10;
                if (badge.id === 'head_boy_girl') unlocked = activityMeta.streak >= 30;
                if (badge.id === 'auror') unlocked = stats.totalCourses >= 5;
                if (badge.id === 'triwizard') unlocked = activityMeta.streak >= 7;
                if (badge.id === 'master_of_death') unlocked = (stats.completedSubtopics >= 10 && activityMeta.streak >= 30 && stats.totalCourses >= 5);
                
                return (
                  <motion.div
                    key={badge.id}
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.05 * index }}
                    className={`p-5 rounded-[1.5rem] border ${
                      unlocked 
                        ? 'bg-gradient-to-r from-white/10 to-transparent border-white/20' 
                        : 'bg-[#16181d] border-white/5 opacity-50 grayscale'
                    } flex items-center gap-5 transition-all duration-300 hover:border-white/30`}
                  >
                    <div className={`w-14 h-14 shrink-0 rounded-[1.2rem] flex items-center justify-center p-2 border ${unlocked ? 'border-white/10 bg-black/50 shadow-inner' : 'border-transparent bg-transparent'}`}>
                      <img src={badge.image} alt={badge.name} className="w-full h-full object-contain" />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className={`font-black text-sm tracking-wide ${unlocked ? 'text-white' : 'text-zinc-500'}`}>{badge.name}</h3>
                        {unlocked && <span className="px-2 py-0.5 rounded-full bg-white text-black text-[9px] font-black uppercase tracking-widest">Unlocked</span>}
                      </div>
                      <p className="text-xs font-medium text-zinc-400">{badge.description}</p>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </section>
        </div>

        {/* ══ COSTS & LEDGER ══ */}
        <div className="grid grid-cols-1 xl:grid-cols-[1.5fr_1fr] gap-8">
          
          <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#111111] p-8 shadow-xl">
            <h2 className="text-2xl font-black tracking-tight text-white mb-2">Cost Ledger</h2>
            <p className="text-xs font-semibold text-zinc-500 flex items-center gap-2 mb-8">
              <Cpu className="w-4 h-4" /> Advanced AI models consume higher credits for superior reasoning.
            </p>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-4 px-4 font-black text-zinc-500 text-[10px] uppercase tracking-widest">Action</th>
                    <th className="text-center py-4 px-4 font-black text-zinc-500 text-[10px] uppercase tracking-widest">Standard AI</th>
                    <th className="text-center py-4 px-4 font-black text-white text-[10px] uppercase tracking-widest bg-white/5 rounded-t-xl">Advanced AI</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    ['Generate Course Map', 5, 15],
                    ['Import YouTube Playlist', 5, 15],
                    ['Generate Lesson Notes', 10, 30],
                    ['Regenerate Notes', 10, 30],
                    ['Practice Grading', 5, 15],
                    ['Explain / Simplify / Quiz', 2, 6],
                    ['Tutor Chat Message', 1, 3],
                  ].map(([action, standard, advanced], i) => (
                    <tr key={i} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                      <td className="py-4 px-4 font-bold text-sm text-zinc-300">{action}</td>
                      <td className="py-4 px-4 text-center font-bold text-zinc-500">{standard}</td>
                      <td className="py-4 px-4 text-center font-black text-white bg-white/5">{advanced}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#111111] p-8 shadow-xl flex flex-col">
            <h2 className="text-2xl font-black tracking-tight text-white mb-6">Recent Activity</h2>
            
            {transactions.length === 0 ? (
              <div className="flex-1 flex items-center justify-center rounded-2xl border border-dashed border-white/10 p-6 text-center text-xs font-semibold text-zinc-500">
                No transactions yet. Start learning to see history!
              </div>
            ) : (
              <div className="relative flex-1">
                <div className="absolute inset-0 custom-scroll overflow-y-auto pr-2 space-y-3">
                  {transactions.map((tx, i) => (
                    <div key={tx._id || i} className="flex items-center justify-between p-4 rounded-2xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.05] transition-colors">
                      <div className="flex items-center gap-4">
                        <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[1rem] ${tx.type === 'spend' ? 'bg-red-500/10 text-red-500' : 'bg-emerald-500/10 text-emerald-500'}`}>
                          {tx.type === 'spend' ? <TrendingDown className="h-4 w-4" /> : <TrendingUp className="h-4 w-4" />}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white tracking-wide">{tx.description}</p>
                          <p className="text-[10px] font-semibold text-zinc-500 mt-1">{new Date(tx.createdAt).toLocaleString()}</p>
                        </div>
                      </div>
                      <span className={`text-base font-black ${tx.type === 'spend' ? 'text-red-500' : 'text-emerald-500'}`}>
                        {tx.type === 'spend' ? '' : '+'}{tx.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
            
            {txTotalPages > 1 && (
              <div className="flex items-center justify-between mt-6 pt-6 border-t border-white/10">
                <button onClick={() => setTxPage(p => Math.max(1, p - 1))} disabled={txPage <= 1} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-30 hover:bg-white/10">
                  Prev
                </button>
                <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">{txPage} / {txTotalPages}</span>
                <button onClick={() => setTxPage(p => Math.min(txTotalPages, p + 1))} disabled={txPage >= txTotalPages} className="rounded-full border border-white/10 px-4 py-2 text-xs font-bold text-white disabled:opacity-30 hover:bg-white/10">
                  Next
                </button>
              </div>
            )}
          </section>
        </div>

      </div>
      
      {/* Badge Unlock Popup */}
      <AnimatePresence>
        {newlyUnlockedBadges.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-10 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-3"
          >
            {newlyUnlockedBadges.map(badge => (
              <div key={badge.id} className="bg-black text-white p-4 rounded-2xl shadow-2xl border border-white/20 flex items-center gap-4">
                <div className="w-12 h-12 shrink-0 rounded-full border border-white/10 bg-[#111] flex items-center justify-center overflow-hidden p-1">
                  <img src={badge.image} alt={badge.name} className="w-full h-full object-contain" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-zinc-400 mb-0.5">Badge Unlocked!</p>
                  <p className="font-bold text-lg tracking-tight">{badge.name}</p>
                </div>
                <button onClick={() => setNewlyUnlockedBadges(prev => prev.filter(b => b.id !== badge.id))} className="ml-4 text-zinc-500 hover:text-white transition">
                  <X className="w-5 h-5" />
                </button>
              </div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </DashboardShell>
  );
};

export default Profile;
