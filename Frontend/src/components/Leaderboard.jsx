import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const MEDAL_ICONS = ['🥇', '🥈', '🥉'];
const PERIOD_LABELS = { daily: 'Today', weekly: 'This Week', monthly: 'This Month' };

export default function Leaderboard() {
  const { user } = useUser();
  const [period, setPeriod] = useState('weekly');
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUserStats, setCurrentUserStats] = useState(null);

  useEffect(() => {
    if (user?.id) fetchLeaderboard();
  }, [period, user?.id]);

  const fetchLeaderboard = async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard?period=${period}&clerkId=${user.id}`);
      const json = await res.json();
      if (json.success) {
        setData(json.leaderboard);
        setCurrentUserStats(json.currentUserStats);
      }
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const isCurrentUser = (entry) => entry.clerkId === user?.id;

  return (
    <section className="mb-10">
      <div className="bg-white/40 backdrop-blur-2xl rounded-[40px] p-10 shadow-[0_8px_32px_rgba(0,0,0,0.04)] border border-white/60">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-8">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-[20px] flex items-center justify-center bg-white/60 backdrop-blur-md border border-white shadow-sm">
              <span className="material-symbols-outlined text-amber-500 text-[24px]">emoji_events</span>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 tracking-tight">Leaderboard</h3>
              <p className="text-sm text-gray-500 mt-1 font-medium">Top learners on Focus Forge</p>
            </div>
          </div>

          {/* Period Tabs */}
          <div className="flex bg-black/5 rounded-full p-1 gap-1 self-start sm:self-auto backdrop-blur-sm">
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className={`px-5 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
                  period === p ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-400 hover:text-gray-600'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
        </div>

        {/* Leaderboard List */}
        {loading ? (
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => (
              <div key={i} className="h-16 bg-gray-50 animate-pulse rounded-2xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <span className="material-symbols-outlined text-4xl mb-3 text-gray-200">leaderboard</span>
            <p className="text-sm text-gray-400 font-medium text-center">No activity yet for {PERIOD_LABELS[period].toLowerCase()}.<br/>Start learning to claim your spot!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {data.map((entry, i) => {
              const isSelf = isCurrentUser(entry);
              const isTop3 = i < 3;

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05, duration: 0.3 }}
                  className={`relative flex items-center gap-4 px-6 py-4 rounded-[20px] transition-all duration-300 ${
                    isSelf ? 'bg-indigo-50/50 border border-indigo-100' : 'hover:bg-gray-50 border border-transparent'
                  }`}
                >
                  {/* Rank */}
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 shadow-sm ${
                    isTop3 
                      ? i === 0 ? 'bg-amber-100' : i === 1 ? 'bg-slate-100' : 'bg-orange-100'
                      : 'bg-gray-100'
                  }`}>
                    {isTop3 ? (
                      <span className="text-lg">{MEDAL_ICONS[i]}</span>
                    ) : (
                      <span className="text-[11px] font-bold text-gray-500">#{entry.rank}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className={`text-sm font-semibold truncate ${isSelf ? 'text-indigo-600' : 'text-gray-900'}`}>
                        {isSelf ? `${entry.name} (You)` : entry.name}
                      </p>
                      {entry.plan === 'pro' && (
                        <span className="px-2 py-0.5 rounded text-[8px] font-bold uppercase bg-amber-100 text-amber-700">PRO</span>
                      )}
                    </div>
                    <p className="text-[10px] text-gray-500 font-medium">
                      {entry.activeDays} active day{entry.activeDays !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className={`text-lg font-bold ${isTop3 ? 'text-amber-500' : 'text-gray-900'}`}>{entry.topicsCompleted}</p>
                    <p className="text-[9px] uppercase tracking-wider text-gray-400 font-bold">topics</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Current User Stats Section */}
        {currentUserStats && !loading && (
          <div className="mt-8 pt-8 border-t border-gray-100">
            <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] mb-4 text-gray-400">Your Standing</h4>
            <div className="flex items-center justify-between p-6 rounded-[24px] bg-indigo-50/30 border border-indigo-100/50">
              <div>
                <p className="text-2xl font-bold text-indigo-600">
                  {currentUserStats.rank ? `#${currentUserStats.rank}` : 'Unranked'}
                </p>
                <p className="text-xs mt-1 text-gray-600 font-medium">
                  {currentUserStats.rank 
                    ? `Top ${Math.max(1, 100 - currentUserStats.percentile)}% of ${currentUserStats.totalParticipants} learners` 
                    : 'Complete topics to get ranked'}
                </p>
              </div>
              <div className="text-right">
                <p className="text-xl font-bold text-gray-900">
                  {currentUserStats.topicsCompleted}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-gray-400 font-bold">topics</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
