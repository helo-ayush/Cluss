import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, Crown, Medal, Award, Flame, User, Sparkles, Calendar } from 'lucide-react';

const periods = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
];

export default function DarkLeaderboardPanel({ leaderboard, currentUserStats, period, onChangePeriod }) {
  // SVG circular properties for Percentile Snap Gauge
  const radius = 45;
  const strokeWidth = 6;
  const circumference = 2 * Math.PI * radius;
  const rawPercentile = currentUserStats?.percentile ?? 0;
  // Fallback to 0 if not a number or not present
  const percentile = typeof rawPercentile === 'number' ? rawPercentile : parseFloat(rawPercentile) || 0;
  const strokeDashoffset = circumference - (percentile / 100) * circumference;

  // Helper to render user initials for profile avatar fallback
  const getInitials = (name) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase();
  };

  // Helper to map plan names to beautiful high-contrast visual pills aligning with primary colors
  const getPlanBadgeClass = (planName) => {
    const p = String(planName).toUpperCase();
    if (p.includes('ULTRA')) {
      return 'border-[#efff55]/30 text-[#efff55] bg-[#efff55]/5';
    } else if (p.includes('PRO')) {
      return 'border-white/20 text-white bg-white/5';
    } else {
      return 'border-white/10 text-zinc-500 bg-white/[0.02]';
    }
  };

  // Helper for rank colors/glows aligned with signature monochrome and parrot green colors
  const getRankStyles = (rank) => {
    switch (rank) {
      case 1:
        return {
          bg: 'bg-gradient-to-r from-[#efff55]/[0.05] to-transparent',
          border: 'border-[#efff55]/20',
          text: 'text-[#efff55]',
          avatarBg: 'bg-[#efff55] text-black font-black',
          glow: 'shadow-[0_0_15px_rgba(239,255,85,0.05)]',
          icon: <Crown className="h-4 w-4 text-[#efff55] fill-[#efff55]/10" />,
        };
      case 2:
        return {
          bg: 'bg-gradient-to-r from-white/[0.03] to-transparent',
          border: 'border-white/10',
          text: 'text-white',
          avatarBg: 'bg-white text-black font-bold',
          glow: '',
          icon: <Medal className="h-4 w-4 text-white" />,
        };
      case 3:
        return {
          bg: 'bg-gradient-to-r from-zinc-300/[0.02] to-transparent',
          border: 'border-white/[0.06]',
          text: 'text-zinc-300',
          avatarBg: 'bg-zinc-700 text-white font-bold',
          glow: '',
          icon: <Award className="h-4 w-4 text-zinc-300" />,
        };
      default:
        return {
          bg: 'bg-white/[0.005]',
          border: 'border-white/[0.04]',
          text: 'text-zinc-500',
          avatarBg: 'bg-zinc-800 text-zinc-400',
          glow: '',
          icon: null,
        };
    }
  };

  return (
    <section className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group">
      
      {/* Subtle floating glow in top right corner */}
      <div className="absolute right-0 top-0 -z-10 h-64 w-64 rounded-full bg-white/[0.01] blur-3xl" />

      {/* Header section with toggles - Clean and extremely minimal */}
      <div className="flex flex-col gap-5 md:flex-row md:items-center md:justify-between border-b border-white/[0.04] pb-6">
        <div>
          <h2 className="text-2xl font-black text-white tracking-tight">Leaderboard</h2>
        </div>

        {/* Sliding toggle button group */}
        <div className="flex rounded-full border border-white/[0.06] bg-black/40 p-1 self-start md:self-auto">
          {periods.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onChangePeriod(item.key)}
              className={`relative rounded-full px-4.5 py-2 text-xs font-black transition-all duration-300 ${
                period === item.key 
                  ? 'bg-white text-black shadow-md' 
                  : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main interactive grid */}
      <div className="mt-6 grid gap-6 xl:grid-cols-[1fr_20rem]">
        
        {/* Left Side: Upgraded Rank Lists */}
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="rounded-[2rem] border border-dashed border-white/10 bg-black/15 px-6 py-12 text-center flex flex-col items-center justify-center">
              <Sparkles className="h-10 w-10 text-zinc-600 mb-3 animate-pulse" />
              <p className="font-black text-white text-base">No active signals yet</p>
              <p className="mt-1 max-w-sm text-xs leading-5 text-zinc-500">
                Complete lessons, watch playlists, or verify plans to wake this global ranking panel up!
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {leaderboard.slice(0, 6).map((entry, index) => {
                const styles = getRankStyles(entry.rank);
                return (
                  <motion.div 
                    key={`${entry.userId}-${index}`} 
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05, duration: 0.4 }}
                    className={`flex items-center gap-4 rounded-[1.6rem] border ${styles.border} ${styles.bg} ${styles.glow} px-4 py-3.5 transition-all duration-300 hover:scale-[1.008] hover:border-white/10`}
                  >
                    {/* Rank Circle */}
                    <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl font-black text-sm border border-white/[0.04] bg-white/[0.02] ${
                      entry.rank <= 3 ? styles.text : 'text-zinc-500'
                    }`}>
                      {styles.icon ? styles.icon : entry.rank}
                    </div>

                    {/* Gradient Fallback User Avatar */}
                    <div className={`h-10 w-10 shrink-0 rounded-full flex items-center justify-center font-black text-xs border border-white/[0.06] ${styles.avatarBg}`}>
                      {getInitials(entry.name)}
                    </div>

                    {/* Player Info */}
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate font-black text-white text-sm tracking-tight">{entry.name}</p>
                        {entry.rank === 1 && (
                          <span className="flex h-1.5 w-1.5 rounded-full bg-[#efff55] animate-ping" />
                        )}
                      </div>
                      <p className="mt-0.5 text-[11px] font-bold text-zinc-500 flex items-center gap-1">
                        <Flame className="h-3.5 w-3.5 text-zinc-600" />
                        {entry.topicsCompleted} units completed · {entry.activeDays} active days
                      </p>
                    </div>

                    {/* Custom Plan Tag */}
                    <span className={`rounded-full px-3.5 py-1 text-[9px] font-black uppercase tracking-[0.15em] border ${getPlanBadgeClass(entry.plan)}`}>
                      {entry.plan}
                    </span>
                  </motion.div>
                );
              })}
            </div>
          )}
        </div>

        {/* Right Side: Futuristic Glass Snapshot Dial */}
        <div className="rounded-[2rem] border border-white/[0.06] bg-[#171717]/40 p-6 flex flex-col items-center justify-between shadow-[inset_0_1px_1px_rgba(255,255,255,0.03)] min-h-[300px]">
          
          <div className="w-full text-left">
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-[#efff55] animate-pulse" />
              Your Snapshot
            </span>
          </div>

          {/* Interactive Dial Gauge */}
          <div className="relative my-4 flex items-center justify-center">
            <svg className="transform -rotate-90 w-32 h-32" viewBox="0 0 110 110">
              {/* Back track */}
              <circle
                cx="55"
                cy="55"
                r={radius}
                className="stroke-white/[0.03] fill-transparent"
                strokeWidth={strokeWidth}
              />
              {/* Progress Arc */}
              <motion.circle
                cx="55"
                cy="55"
                r={radius}
                className="stroke-[#efff55] fill-transparent drop-shadow-[0_0_6px_rgba(239,255,85,0.2)]"
                strokeWidth={strokeWidth}
                strokeDasharray={circumference}
                initial={{ strokeDashoffset: circumference }}
                animate={{ strokeDashoffset }}
                transition={{ duration: 0.8, ease: 'easeOut' }}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white leading-none">
                {currentUserStats?.rank ? `#${currentUserStats.rank}` : '--'}
              </span>
              <span className="text-[9px] font-black uppercase tracking-wider text-zinc-500 mt-1">
                Global Rank
              </span>
            </div>
          </div>

          {/* Stat Details */}
          <div className="w-full space-y-4">
            <div className="grid grid-cols-2 gap-2 border-t border-white/[0.04] pt-4">
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Percentile</span>
                <p className="text-base font-black text-[#efff55] mt-0.5">{percentile}%</p>
              </div>
              <div className="bg-white/[0.02] border border-white/[0.04] rounded-xl p-2.5 text-center">
                <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-500">Active Days</span>
                <p className="text-base font-black text-white mt-0.5">{currentUserStats?.activeDays ?? 0}</p>
              </div>
            </div>
            
            <p className="text-[11.5px] leading-relaxed text-zinc-400 text-center font-medium">
              {currentUserStats?.topicsCompleted
                ? `You completed ${currentUserStats.topicsCompleted} units in this period. Keep pushing to climb higher!`
                : 'Start completing subtopics or practice sheets to enter the global ranking.'}
            </p>
          </div>
        </div>

      </div>
    </section>
  );
}
