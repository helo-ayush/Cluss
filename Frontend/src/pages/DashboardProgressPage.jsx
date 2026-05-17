import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import ProgressWidgets, { MomentumPanel } from '../components/dashboard/ProgressWidgets';
import DarkLeaderboardPanel from '../components/dashboard/DarkLeaderboardPanel';

import { useUsage } from '../contexts/UsageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function DashboardProgressPage() {
  const { user, isLoaded } = useUser();
  const { usageData } = useUsage();
  const [studyPlans, setStudyPlans] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, completedSubtopics: 0, totalSubtopics: 0 });
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState('weekly');
  const [currentUserStats, setCurrentUserStats] = useState(null);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      const [plansRes] = await Promise.all([
        fetch(`${API_BASE}/api/study-plans/user/${user.id}`),
      ]);
      const plansData = await plansRes.json();
      if (plansData.success) {
        setStudyPlans(plansData.courses || []);
        setStats(plansData.stats || { totalCourses: 0, completedSubtopics: 0, totalSubtopics: 0 });
      }
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  const fetchLeaderboard = useCallback(async (period) => {
    if (!user?.id) return;
    try {
      const res = await fetch(`${API_BASE}/api/leaderboard?period=${period}&clerkId=${user.id}`);
      const data = await res.json();
      if (data.success) {
        setLeaderboard(data.leaderboard || []);
        setCurrentUserStats(data.currentUserStats || null);
      }
    } catch (error) {
      console.error(error);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    fetchAll();
  }, [fetchAll, isLoaded, user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    fetchLeaderboard(leaderboardPeriod);
  }, [fetchLeaderboard, leaderboardPeriod, user?.id]);

  return (
    <DashboardShell title="Progress" usageData={usageData}>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <section className="rounded-[2.6rem] border border-white/10 bg-[#111111] bg-gradient-to-br from-indigo-500/10 via-transparent to-transparent p-6 md:p-8">
          <p className="text-[11px] font-black uppercase tracking-[0.3em] text-zinc-500">Monitoring</p>
          <h2 className="mt-4 text-5xl font-black tracking-tight text-white">Progress board</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-zinc-400">
            The dashboard home stays focused. Detailed stats, momentum, and leaderboard live here.
          </p>
        </section>

        <ProgressWidgets studyPlans={studyPlans} stats={stats} />
        <div className="grid gap-5 xl:grid-cols-[24rem_minmax(0,1fr)]">
          <MomentumPanel stats={stats} clerkId={user?.id} />
          <DarkLeaderboardPanel
            leaderboard={leaderboard}
            currentUserStats={currentUserStats}
            period={leaderboardPeriod}
            onChangePeriod={setLeaderboardPeriod}
          />
        </div>
      </div>
    </DashboardShell>
  );
}
