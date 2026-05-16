import React from 'react';
import { Link } from 'react-router-dom';
import DarkPlanCard from './DarkPlanCard';

export default function RecentPlansPanel({ plans, onOpen, onDelete }) {
  return (
    <section className="rounded-[2.4rem] border border-white/10 bg-[#111111] p-5 md:p-6" id="library">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="inline-flex rounded-full bg-white/5 px-3 py-1.5 text-xs font-black uppercase tracking-[0.18em] text-zinc-400">
            Recent
          </div>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-white">Jump back in</h2>
          <p className="mt-2 text-sm leading-6 text-zinc-400">Your latest three study plans, trimmed for momentum.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/dashboard/guided" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white">
            Guided
          </Link>
          <Link to="/dashboard/playlists" className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm font-bold text-zinc-300 transition hover:bg-white/10 hover:text-white">
            Playlists
          </Link>
        </div>
      </div>

      {plans.length === 0 ? (
        <div className="mt-6 rounded-[2rem] border border-dashed border-white/10 bg-black/25 px-6 py-12 text-center">
          <p className="text-lg font-black text-white">No study plans yet</p>
          <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-zinc-500">Use the Create button to start a guided plan or convert a playlist.</p>
        </div>
      ) : (
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {plans.slice(0, 3).map((plan) => (
            <DarkPlanCard key={plan._id} plan={plan} onOpen={onOpen} onDelete={onDelete} compact />
          ))}
        </div>
      )}

      <Link to="/dashboard/guided" className="mt-5 inline-flex items-center gap-2 text-sm font-black text-white">
        Open full libraries <span aria-hidden="true">-&gt;</span>
      </Link>
    </section>
  );
}
