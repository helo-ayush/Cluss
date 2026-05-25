import React, { useCallback, useEffect, useState } from 'react';
import { useUser } from '@clerk/clerk-react';
import { motion } from 'framer-motion';
import { Activity, Star, Calendar, ShieldCheck } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import ProgressWidgets from '../components/dashboard/ProgressWidgets';
import DarkLeaderboardPanel from '../components/dashboard/DarkLeaderboardPanel';

import { useUsage } from '../contexts/UsageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.5,
      ease: [0.25, 1, 0.5, 1],
    },
  },
};

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
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mx-auto max-w-[96rem] space-y-6 font-nunito"
      >
        {/* Premium Hero Panel */}
        <motion.section 
          variants={itemVariants}
          className="relative overflow-hidden rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)]"
        >
          {/* Subtle Decorative Gradient Aura */}
          <div className="absolute right-0 top-0 -z-10 h-[300px] w-[300px] rounded-full bg-gradient-to-br from-[#efff55]/10 to-transparent blur-3xl opacity-60" />
          
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="space-y-2">
              <h2 className="text-4xl md:text-5xl font-black tracking-tight text-white">
                Progress board
              </h2>
              <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                Track your active learnings, weekly consistency wave, and see where you stand on the global leaderboard.
              </p>
            </div>

            {/* Quick Hero Chip Grid */}
            <div className="grid grid-cols-2 gap-3 sm:flex sm:items-center">
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3 text-center sm:min-w-[7.5rem]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Global rank</p>
                <p className="mt-1 text-xl font-black text-white">{currentUserStats?.rank ? `#${currentUserStats.rank}` : '--'}</p>
              </div>
              <div className="rounded-2xl border border-white/[0.04] bg-white/[0.02] p-3 text-center sm:min-w-[7.5rem]">
                <p className="text-[10px] font-bold uppercase tracking-wider text-zinc-500">Percentile</p>
                <p className="mt-1 text-xl font-black text-[#efff55]">{currentUserStats?.percentile ? `${currentUserStats.percentile}%` : '--'}</p>
              </div>
            </div>
          </div>
        </motion.section>

        {/* Widgets Section */}
        <motion.div variants={itemVariants}>
          <ProgressWidgets studyPlans={studyPlans} stats={stats} clerkId={user?.id} />
        </motion.div>

        {/* Leaderboard Section */}
        <motion.div variants={itemVariants}>
          <DarkLeaderboardPanel
            leaderboard={leaderboard}
            currentUserStats={currentUserStats}
            period={leaderboardPeriod}
            onChangePeriod={setLeaderboardPeriod}
          />
        </motion.div>
      </motion.div>
    </DashboardShell>
  );
}

