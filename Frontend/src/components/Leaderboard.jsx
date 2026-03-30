import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';

const API_BASE = 'http://localhost:3000';

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
      <div className="rounded-2xl p-6 md:p-8" style={{
        background: 'var(--dash-card-bg)',
        border: '1px solid var(--dash-card-border)',
        backdropFilter: 'blur(20px)',
      }}>

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'rgba(251,191,36,0.12)' }}>
              <span className="material-symbols-outlined" style={{ color: '#fbbf24', fontSize: '20px' }}>emoji_events</span>
            </div>
            <div>
              <h3 className="font-headline text-[15px] font-bold" style={{ color: 'var(--theme-text-heading)' }}>Leaderboard</h3>
              <p className="font-body text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>Top learners on Focus Forge</p>
            </div>
          </div>

          {/* Period Tabs */}
          <div className="flex rounded-xl p-1" style={{ background: 'var(--theme-border)', gap: '2px' }}>
            {['daily', 'weekly', 'monthly'].map(p => (
              <button
                key={p}
                onClick={() => setPeriod(p)}
                className="px-4 py-2 rounded-lg font-label text-[11px] font-bold uppercase tracking-wider transition-all duration-200"
                style={{
                  background: period === p ? 'var(--dash-card-bg)' : 'transparent',
                  color: period === p ? 'var(--color-primary)' : 'var(--theme-text-muted)',
                  boxShadow: period === p ? '0 2px 8px rgba(0,0,0,0.15)' : 'none',
                }}
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
              <div key={i} className="h-16 skeleton rounded-xl" />
            ))}
          </div>
        ) : data.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 opacity-60">
            <span className="material-symbols-outlined text-4xl mb-3" style={{ color: 'var(--theme-text-faint)' }}>leaderboard</span>
            <p className="font-body text-sm" style={{ color: 'var(--theme-text-muted)' }}>No activity yet for {PERIOD_LABELS[period].toLowerCase()}. Start learning to claim your spot!</p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {data.map((entry, i) => {
              const isSelf = isCurrentUser(entry);
              const isTop3 = i < 3;

              return (
                <motion.div
                  key={entry.userId}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.06, duration: 0.35 }}
                  className="relative flex items-center gap-4 px-5 py-3.5 rounded-xl transition-all duration-200"
                  style={{
                    background: isSelf
                      ? 'rgba(99,102,241,0.08)'
                      : isTop3
                        ? 'var(--theme-hover-bg)'
                        : 'transparent',
                    border: isSelf
                      ? '1px solid rgba(99,102,241,0.2)'
                      : '1px solid transparent',
                  }}
                >
                  {/* Rank */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{
                    background: isTop3
                      ? i === 0 ? 'linear-gradient(135deg, #fbbf24, #f59e0b)' : i === 1 ? 'linear-gradient(135deg, #94a3b8, #cbd5e1)' : 'linear-gradient(135deg, #d97706, #b45309)'
                      : 'var(--theme-border)',
                  }}>
                    {isTop3 ? (
                      <span className="text-lg">{MEDAL_ICONS[i]}</span>
                    ) : (
                      <span className="font-label text-xs font-bold" style={{ color: 'var(--theme-text-muted)' }}>#{entry.rank}</span>
                    )}
                  </div>

                  {/* Name */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-body text-sm font-semibold truncate" style={{ color: isSelf ? 'var(--color-primary)' : 'var(--theme-text-heading)' }}>
                        {isSelf ? `${entry.name} (You)` : entry.name}
                      </p>
                      {entry.plan === 'pro' && (
                        <span className="px-1.5 py-0.5 rounded font-label text-[8px] font-bold uppercase" style={{ background: 'rgba(99,102,241,0.12)', color: '#818cf8' }}>PRO</span>
                      )}
                    </div>
                    <p className="font-label text-[10px]" style={{ color: 'var(--theme-text-faint)' }}>
                      {entry.activeDays} active day{entry.activeDays !== 1 ? 's' : ''}
                    </p>
                  </div>

                  {/* Score */}
                  <div className="text-right shrink-0">
                    <p className="font-headline text-lg font-bold" style={{ color: isTop3 ? '#fbbf24' : 'var(--theme-text-heading)' }}>{entry.topicsCompleted}</p>
                    <p className="font-label text-[9px] uppercase tracking-wider" style={{ color: 'var(--theme-text-faint)' }}>topics</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}

        {/* Current User Stats Section */}
        {currentUserStats && !loading && (
          <div className="mt-6 pt-6 border-t" style={{ borderColor: 'var(--theme-border)' }}>
            <h4 className="font-label text-xs uppercase tracking-wider mb-4" style={{ color: 'var(--theme-text-muted)' }}>Your Standing</h4>
            <div className="flex items-center justify-between p-4 rounded-xl" style={{ background: 'rgba(99,102,241,0.05)', border: '1px solid rgba(99,102,241,0.15)' }}>
              <div>
                <p className="font-headline text-xl font-bold" style={{ color: 'var(--color-primary)' }}>
                  {currentUserStats.rank ? `#${currentUserStats.rank}` : 'Unranked'}
                </p>
                <p className="font-body text-xs mt-0.5" style={{ color: 'var(--theme-text-muted)' }}>
                  {currentUserStats.rank 
                    ? `Top ${Math.max(1, 100 - currentUserStats.percentile)}% of ${currentUserStats.totalParticipants} learners` 
                    : 'Complete topics to get ranked'}
                </p>
              </div>
              <div className="text-right">
                <p className="font-headline text-lg font-bold" style={{ color: 'var(--theme-text-heading)' }}>
                  {currentUserStats.topicsCompleted}
                </p>
                <p className="font-label text-[10px] uppercase tracking-wider" style={{ color: 'var(--theme-text-faint)' }}>topics</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
