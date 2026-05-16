import React from 'react';

const periods = [
  { key: 'daily', label: 'Today' },
  { key: 'weekly', label: 'This Week' },
  { key: 'monthly', label: 'This Month' },
];

export default function DarkLeaderboardPanel({ leaderboard, currentUserStats, period, onChangePeriod }) {
  return (
    <section className="rounded-[2.4rem] border border-white/10 bg-[#111111] p-5 md:p-6">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white text-sm font-black text-black">
            01
          </div>
          <h2 className="mt-4 text-3xl font-black text-white">Leaderboard</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">A clean view of learning movement across Cluss.</p>
        </div>
        <div className="flex rounded-full border border-white/10 bg-black/35 p-1">
          {periods.map((item) => (
            <button
              key={item.key}
              type="button"
              onClick={() => onChangePeriod(item.key)}
              className={`rounded-full px-3 py-2 text-xs font-black transition ${
                period === item.key ? 'bg-white text-black' : 'text-zinc-500 hover:text-white'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 grid gap-5 xl:grid-cols-[1fr_18rem]">
        <div className="space-y-3">
          {leaderboard.length === 0 ? (
            <div className="rounded-[1.8rem] border border-dashed border-white/10 bg-black/25 px-5 py-10 text-center">
              <p className="font-black text-white">No activity yet</p>
              <p className="mt-2 text-sm leading-6 text-zinc-500">Complete lessons or checkpoints to wake this board up.</p>
            </div>
          ) : (
            leaderboard.slice(0, 6).map((entry, index) => (
              <div key={`${entry.userId}-${index}`} className="flex items-center gap-4 rounded-[1.5rem] border border-white/10 bg-[#171717] px-4 py-3">
                <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-black ${
                  entry.rank === 1 ? 'bg-white text-black' : 'bg-white/[0.08] text-white'
                }`}>
                  {entry.rank}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-black text-white">{entry.name}</p>
                  <p className="mt-1 text-xs text-zinc-500">{entry.topicsCompleted} units / {entry.activeDays} active days</p>
                </div>
                <span className="rounded-full bg-white/[0.08] px-3 py-1 text-[10px] font-black uppercase tracking-[0.18em] text-zinc-300">
                  {entry.plan}
                </span>
              </div>
            ))
          )}
        </div>

        <div className="rounded-[1.8rem] border border-white/10 bg-[#171717] p-5">
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Your snapshot</p>
          <div className="mt-5 grid grid-cols-2 gap-3 xl:grid-cols-1">
            <div className="rounded-[1.4rem] bg-black/25 p-4">
              <p className="text-xs font-bold text-zinc-500">Rank</p>
              <p className="mt-2 text-3xl font-black text-white">{currentUserStats?.rank || '--'}</p>
            </div>
            <div className="rounded-[1.4rem] bg-black/25 p-4">
              <p className="text-xs font-bold text-zinc-500">Percentile</p>
              <p className="mt-2 text-3xl font-black text-white">{currentUserStats?.percentile ?? '--'}</p>
            </div>
          </div>
          <p className="mt-4 text-sm leading-6 text-zinc-400">
            {currentUserStats?.topicsCompleted
              ? `${currentUserStats.topicsCompleted} units completed in this period.`
              : 'Start completing checkpoints to get ranked.'}
          </p>
        </div>
      </div>
    </section>
  );
}
