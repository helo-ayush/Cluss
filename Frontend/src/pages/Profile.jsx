import React, { useState, useEffect } from 'react';
import { useUser, useClerk } from '@clerk/clerk-react';
import { motion, AnimatePresence } from 'motion/react';
import { Zap, Wand2, GraduationCap, Trophy, Bird, Shield, Award, Sparkles, User as UserIcon, Flame, Book, Brain, X } from 'lucide-react';
import { AVATARS } from '../utils/avatars';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const BADGES = [
  { id: 'sorting_hat', name: "Sorting Hat's Choice", description: "Complete your first topic.", image: '/badges/sorting_hat.png' },
  { id: 'seeker', name: "Seeker", description: "Master 10 topics.", image: '/badges/seeker.png' },
  { id: 'prefect', name: "Prefect", description: "Maintain a 10-day learning streak.", image: '/badges/prefect.png' },
  { id: 'head_boy_girl', name: "Head Boy / Head Girl", description: "Maintain a 30-day learning streak.", image: '/badges/head_boy.png' },
  { id: 'auror', name: "Auror in Training", description: "Create 5 different courses.", image: '/badges/auror.png' },
  { id: 'triwizard', name: "Triwizard Champion", description: "Maintain a 7-day learning streak.", image: '/badges/triwizard.png' },
  { id: 'master_of_death', name: "Master of Death", description: "Unlock all other badges.", image: '/badges/master_of_death.png' },
];

// ─── Activity Bars ───
function ActivityBars({ activityData }) {
  if (!activityData || activityData.length === 0) return <div className="text-sm text-gray-500 mt-4">No activity data available yet.</div>;
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
  if (activityData) {
    activityData.forEach(d => { activityByDate[d.date] = d.subtopicsCompleted > 0; });
  }

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

const Profile = () => {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
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

  // Check for newly unlocked badges
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
      // Only show popup if it's not the very first time they are loading the app (to avoid spamming all their existing badges)
      if (cachedUnlocked.length > 0) {
        const fullBadges = BADGES.filter(b => newly.includes(b.id));
        setNewlyUnlockedBadges(fullBadges);
        
        // Auto-hide popup after 5 seconds
        setTimeout(() => {
          setNewlyUnlockedBadges([]);
        }, 5000);
      }
      localStorage.setItem(`cluss_unlocked_${user.id}`, JSON.stringify(currentUnlocked));
    }
  }, [stats, activityMeta, user]);

  useEffect(() => {
    if (!user) return;
    
    // Instant load from cache
    const cachedAvatar = localStorage.getItem(`cluss_avatar_${user.id}`);
    if (cachedAvatar) setSelectedAvatar(cachedAvatar);

    const fetchData = async () => {
      try {
        const timestamp = Date.now();
        const [courseRes, activityRes, avatarRes] = await Promise.all([
          fetch(`${API_BASE}/api/course/user/${user.id}?t=${timestamp}`),
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
    };
    fetchData();
  }, [user]);

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
    } catch (err) {
      console.error("Error saving avatar:", err);
    }
  };

  const handleSignOut = () => {
    signOut(() => navigate('/'));
  };

  if (!user) return null;

  const selectedAvatarData = AVATARS.find(a => a.id === selectedAvatar) || AVATARS[0];
  const isNone = selectedAvatar === 'none';

  return (
    <div className="min-h-screen pt-28 pb-20 px-4 md:px-10 lg:px-15" style={{ fontFamily: 'Outfit, sans-serif' }}>
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/40 backdrop-blur-3xl border border-white/50 p-8 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col md:flex-row items-center justify-between gap-6"
        >
          <div className="flex items-center gap-6">
            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-100 flex items-center justify-center">
              {isNone ? (
                <img src={user.imageUrl || "https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_1280.png"} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <img src={selectedAvatarData.image} alt={selectedAvatarData.name} className="w-full h-full object-cover" />
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{user.fullName || 'Wizard'}</h1>
              <p className="text-gray-500 font-medium">{user.primaryEmailAddress?.emailAddress}</p>
            </div>
          </div>
          <button 
            onClick={handleSignOut}
            className="px-6 py-3 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700 transition-colors duration-300 rounded-full font-semibold"
          >
            Sign Out
          </button>
        </motion.div>

        {/* Avatar Selection */}
        <motion.div 
          id="profile-avatars"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/40 backdrop-blur-3xl border border-white/50 p-8 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Choose Your Avatar</h2>
          <div className="flex flex-wrap gap-4">
            {AVATARS.map((avatar) => {
              const isSelected = selectedAvatar === avatar.id;
              return (
                <button
                  key={avatar.id}
                  onClick={() => handleAvatarSelect(avatar.id)}
                  className={`relative p-4 rounded-2xl flex flex-col items-center gap-3 transition-all duration-300 ${
                    isSelected 
                      ? 'bg-black text-white shadow-xl scale-105' 
                      : 'bg-white text-gray-600 hover:bg-gray-50 hover:scale-105 border border-gray-100'
                  }`}
                >
                  {avatar.id === 'none' ? (
                     <avatar.icon className="w-10 h-10" />
                  ) : (
                     <div className="w-10 h-10 rounded-full overflow-hidden bg-gray-100">
                       <img src={avatar.image} alt={avatar.name} className="w-full h-full object-cover" />
                     </div>
                  )}
                  <span className="text-sm font-medium">{avatar.name}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Badges Section */}
        <motion.div 
          id="profile-badges"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white/40 backdrop-blur-3xl border border-white/50 p-8 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)]"
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">My Badges</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {BADGES.map((badge, index) => {
              // Real data logic for badges
              let unlocked = false;
              if (badge.id === 'sorting_hat') unlocked = stats.completedSubtopics >= 1;
              if (badge.id === 'seeker') unlocked = stats.completedSubtopics >= 10;
              if (badge.id === 'prefect') unlocked = activityMeta.streak >= 10;
              if (badge.id === 'head_boy_girl') unlocked = activityMeta.streak >= 30;
              if (badge.id === 'auror') unlocked = stats.totalCourses >= 5;
              if (badge.id === 'triwizard') unlocked = activityMeta.streak >= 7;
              
              // Master of death requires all other conditions to be met
              if (badge.id === 'master_of_death') {
                unlocked = (stats.completedSubtopics >= 10 && activityMeta.streak >= 30 && stats.totalCourses >= 5);
              }
              
              return (
                <motion.div
                  key={badge.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * index }}
                  className={`p-6 rounded-3xl border ${
                    unlocked 
                      ? 'bg-gradient-to-br from-white to-gray-50 border-gray-200 shadow-sm' 
                      : 'bg-gray-50/50 border-gray-100 opacity-60 grayscale'
                  } flex items-start gap-4 transition-all duration-300 hover:shadow-md hover:scale-[1.02]`}
                >
                  <div className={`w-14 h-14 shrink-0 rounded-2xl overflow-hidden flex items-center justify-center p-1 ${unlocked ? 'bg-black/5' : 'bg-gray-200/50'}`}>
                    <img src={badge.image} alt={badge.name} className="w-full h-full object-contain drop-shadow-sm" />
                  </div>
                  <div>
                    <h3 className={`font-bold ${unlocked ? 'text-gray-900' : 'text-gray-500'} mb-1`}>{badge.name}</h3>
                    <p className="text-sm text-gray-500 leading-relaxed">{badge.description}</p>
                    {unlocked && (
                      <span className="inline-block mt-3 px-3 py-1 bg-green-100 text-green-700 text-xs font-bold rounded-full">
                        Unlocked
                      </span>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        </motion.div>

        {/* Stats Section & Heatmap (Moved to bottom) */}
        <motion.div 
          id="profile-stats"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="grid grid-cols-1 md:grid-cols-[1fr_1.5fr_1fr] gap-6"
        >
           {/* Small Stats */}
           <div className="flex flex-col gap-4">
              <div className="bg-white/40 backdrop-blur-3xl border border-white/50 p-6 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-orange-50 text-orange-500 flex items-center justify-center">
                  <Flame className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{loading ? '-' : activityMeta.streak}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Daily Streak</p>
                </div>
              </div>
              <div className="bg-white/40 backdrop-blur-3xl border border-white/50 p-6 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center">
                  <Book className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{loading ? '-' : stats.totalCourses}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Courses Designed</p>
                </div>
              </div>
              <div className="bg-white/40 backdrop-blur-3xl border border-white/50 p-6 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex items-center gap-5">
                <div className="w-12 h-12 rounded-2xl bg-emerald-50 text-emerald-500 flex items-center justify-center">
                  <Brain className="w-6 h-6" />
                </div>
                <div>
                  <p className="text-2xl font-black text-gray-900">{loading ? '-' : stats.completedSubtopics}</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">Topics Learned</p>
                </div>
              </div>
           </div>

           {/* Learning Activity Heatmap */}
           <div className="bg-white/40 backdrop-blur-3xl border border-white/50 p-8 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Recent Momentum</h3>
                <p className="text-sm text-gray-500 mt-1">Lessons completed over the past 7 days</p>
              </div>
              <ActivityBars activityData={activityData} />
           </div>

           {/* Activity Calendar */}
           <div className="bg-white/40 backdrop-blur-3xl border border-white/50 p-8 rounded-[32px] shadow-[0_8px_32px_rgba(0,0,0,0.04)] flex flex-col justify-between">
              <div>
                <h3 className="text-xl font-bold text-gray-900 tracking-tight">Study Heatmap</h3>
              </div>
              <MiniCalendar activityData={activityData} />
           </div>
        </motion.div>

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
            {newlyUnlockedBadges.map(badge => {
              return (
                <div key={badge.id} className="bg-gray-900 text-white px-6 py-4 rounded-2xl shadow-2xl border border-gray-700 flex items-center gap-4">
                  <div className="w-12 h-12 shrink-0 rounded-full bg-white/10 flex items-center justify-center overflow-hidden p-1">
                    <img src={badge.image} alt={badge.name} className="w-full h-full object-contain" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wider text-indigo-400 mb-0.5">Badge Unlocked!</p>
                    <p className="font-bold text-lg">{badge.name}</p>
                  </div>
                  <button onClick={() => setNewlyUnlockedBadges(prev => prev.filter(b => b.id !== badge.id))} className="ml-4 text-gray-400 hover:text-white transition">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default Profile;
