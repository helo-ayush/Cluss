import React, { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { useUsage } from '../contexts/UsageContext';
import DashboardShell from '../components/dashboard/DashboardShell';
import CreditCost from '../components/CreditCost';
import { getCostForAction } from '../config/creditCosts';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function PlaylistCreatePage() {
  const { user } = useUser();
  const navigate = useNavigate();
  const { usageData, fetchUsage } = useUsage();
  const [playlistUrl, setPlaylistUrl] = useState('');
  const [hoursPerDay, setHoursPerDay] = useState(2);
  const [error, setError] = useState('');
  const [submitting, setSubmitting] = useState(false);



  const handleSubmit = async () => {
    if (!playlistUrl.trim() || !user?.id) return;
    setError('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/api/course/from-playlist`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clerkId: user.id,
          playlistUrl: playlistUrl.trim(),
          hoursPerDay,
          userName: user.fullName || user.firstName || 'Learner',
        }),
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || data.error || 'Failed to import playlist.');
      
      fetchUsage(); // Update global credits
      navigate(`/playlist/${data.course._id}`);
    } catch (err) {
      setError(err.message || 'Failed to import playlist.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <DashboardShell title="Playlist Setup" usageData={usageData}>
      <div className="mx-auto max-w-[78rem] space-y-5">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="flex h-14 w-14 items-center justify-center rounded-full bg-[#1b1b1b] text-2xl text-white transition hover:bg-white hover:text-black"
        >
          x
        </button>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="rounded-[2.4rem] border border-white/10 bg-[#111111] p-5 md:p-7">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">YouTube playlist</p>
            <h2 className="mt-4 text-4xl font-black tracking-tight text-white md:text-5xl">Import a source</h2>
            <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-500">
              Playlist plans stay source-driven: daily blocks, checkpoint, progress.
            </p>

            <label className="mt-8 block rounded-[1.8rem] border border-white/10 bg-black p-5">
              <span className="text-sm font-black text-white">Playlist URL</span>
              <input
                value={playlistUrl}
                onChange={(event) => setPlaylistUrl(event.target.value)}
                placeholder="https://www.youtube.com/playlist?list=..."
                className="mt-3 w-full bg-transparent text-lg font-bold text-white outline-none placeholder:text-zinc-700"
              />
            </label>

            <div className="mt-5 rounded-[1.8rem] border border-white/10 bg-black p-5">
              <p className="text-sm font-black text-white">Daily study budget</p>
              <div className="mt-4 flex flex-wrap gap-2">
                {[1, 2, 3, 4].map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setHoursPerDay(hours)}
                    className={`rounded-full px-5 py-3 text-sm font-black transition ${
                      hoursPerDay === hours ? 'bg-white text-black' : 'bg-[#1b1b1b] text-zinc-400 hover:text-white'
                    }`}
                  >
                    {hours}h/day
                  </button>
                ))}
              </div>
            </div>
          </div>

          <aside className="rounded-[2.4rem] border border-white/10 bg-[#111111] p-5">
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Output</p>
            <div className="mt-5 space-y-3">
              {[
                ['01', 'Read playlist videos'],
                ['02', `${hoursPerDay}h/day sessions`],
                ['03', 'Daily checkpoints'],
              ].map(([step, label]) => (
                <div key={step} className="flex items-center gap-4 rounded-[1.4rem] bg-black p-4">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-xs font-black text-black">{step}</span>
                  <p className="font-black text-white">{label}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>

        {error && <div className="rounded-[1.4rem] border border-white/10 bg-[#1b1b1b] px-5 py-4 text-sm font-bold text-white">{error}</div>}

        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !playlistUrl.trim()}
          className="fixed bottom-24 right-6 z-50 rounded-full bg-white px-6 py-4 text-sm font-black text-black shadow-[0_20px_50px_rgba(0,0,0,0.45)] transition hover:-translate-y-0.5 disabled:opacity-45 lg:bottom-6"
        >
          {submitting ? 'Importing...' : 'Create playlist plan'}
          <CreditCost cost={getCostForAction(usageData?.plan, 'playlistImport')} className="ml-2 text-black" />
        </button>
      </div>
    </DashboardShell>
  );
}
