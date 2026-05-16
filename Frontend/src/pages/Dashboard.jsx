import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { ArrowRight } from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useUsage } from '../contexts/UsageContext';
import RecentPlansPanel from '../components/dashboard/RecentPlansPanel';
import ProgressWidgets from '../components/dashboard/ProgressWidgets';
import DashboardFlashcardsPanel from '../components/dashboard/DashboardFlashcardsPanel';
import DailyStudyPlanWidget from '../components/dashboard/DailyStudyPlanWidget';
import DeletePlanModal from '../components/dashboard/DeletePlanModal';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

function DashboardHero({ userName, recentPlan, onOpen }) {
  return (
    <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-black p-6 shadow-[0_30px_100px_rgba(0,0,0,0.35)] md:p-8 xl:p-10">
      <div className="absolute -left-16 top-0 h-80 w-80 rounded-full bg-white/[0.08] blur-[100px]" />
      <div className="absolute right-0 top-10 h-72 w-72 rounded-full bg-zinc-400/[0.08] blur-[110px]" />
      <div className="relative grid gap-8 xl:grid-cols-[1fr_25rem] xl:items-end">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.32em] text-zinc-500">Study command center</p>
          <h2 className="mt-5 max-w-4xl text-[3.2rem] font-black leading-[0.9] tracking-tight text-white sm:text-[4.8rem] xl:text-[6rem]">
            Build your next study system.
          </h2>
          <p className="mt-6 max-w-2xl text-base leading-8 text-zinc-400">
            Welcome back{userName ? `, ${userName}` : ''}. Continue what matters, check progress, and create only when you are ready.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to="/dashboard/guided" className="rounded-full bg-white px-5 py-3 text-sm font-black text-black">
              Guided library
            </Link>
            <Link to="/dashboard/playlists" className="rounded-full border border-white/10 bg-white/[0.08] px-5 py-3 text-sm font-black text-white">
              Playlist library
            </Link>
          </div>
        </div>

        <div className="group relative rounded-[2.4rem] border border-white/10 bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] p-6 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/30 hover:shadow-[0_30px_80px_rgba(255,255,255,0.1)]">
          {/* Top Border Shine Effect */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
          
          <div className="relative z-10">
            <p className="text-[11px] font-black uppercase tracking-[0.2em] text-zinc-400">Continue</p>
            {recentPlan ? (
              <>
                <h3 className="mt-4 line-clamp-3 text-2xl font-black leading-[1.1] tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-white to-white group-hover:to-zinc-400 transition-all duration-300">
                  {recentPlan.course_title}
                </h3>
                
                <div className="mt-6">
                  <div className="flex items-center justify-between gap-3 text-sm mb-3">
                    <span className="font-black text-zinc-300 uppercase tracking-wider text-[11px]">{recentPlan.progress || 0}% complete</span>
                  </div>
                  <div className="relative h-2 w-full overflow-hidden rounded-full bg-black border border-white/10 shadow-inner">
                    <div 
                      className="absolute inset-y-0 left-0 rounded-full" 
                      style={{ 
                        width: `${Math.min(recentPlan.progress || 0, 100)}%`,
                        background: `linear-gradient(90deg, #71717a, #ffffff)`,
                        boxShadow: `0 0 12px rgba(255,255,255,0.8)`
                      }} 
                    />
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => onOpen(recentPlan)}
                  className="group/btn relative mt-6 w-full overflow-hidden rounded-2xl bg-white/[0.05] border border-white/10 px-5 py-4 transition-all duration-300 hover:bg-white hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
                >
                  <div className="relative z-10 flex items-center justify-between">
                    <span className="text-sm font-black tracking-wide uppercase text-white transition-colors duration-300 group-hover/btn:text-black">
                      Resume Learning
                    </span>
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-black transition-all duration-300 group-hover/btn:bg-black group-hover/btn:text-white group-hover/btn:translate-x-1">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </button>
              </>
            ) : (
              <div className="mt-4 rounded-[1.5rem] border border-dashed border-white/10 bg-black/30 p-5 text-sm leading-6 text-zinc-500">
                No recent plan yet. Create one and your shortcut appears here.
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

export default function Dashboard() {
  const { user, isLoaded } = useUser();
  const { usageData } = useUsage();
  const navigate = useNavigate();
  const [studyPlans, setStudyPlans] = useState([]);
  const [stats, setStats] = useState({ totalCourses: 0, completedSubtopics: 0, totalSubtopics: 0 });
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAll = useCallback(async () => {
    if (!user?.id) return;
    try {
      const plansRes = await fetch(`${API_BASE}/api/study-plans/user/${user.id}`);
      const plansData = await plansRes.json();
      if (plansData.success) {
        setStudyPlans(plansData.courses || []);
        setStats(plansData.stats || { totalCourses: 0, completedSubtopics: 0, totalSubtopics: 0 });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    if (!isLoaded || !user?.id) return;
    fetchAll();
  }, [fetchAll, isLoaded, user?.id]);

  const recentPlans = useMemo(() => (
    [...studyPlans].sort((left, right) => {
      const leftActive = left.progress > 0 && left.progress < 100 ? 1 : 0;
      const rightActive = right.progress > 0 && right.progress < 100 ? 1 : 0;
      if (leftActive !== rightActive) return rightActive - leftActive;
      return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
    }).slice(0, 3)
  ), [studyPlans]);

  const openPlan = (plan) => {
    if (plan.sourceType === 'playlist') navigate(`/playlist/${plan._id}`);
    else navigate(`/study-plan/${plan._id}`);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await fetch(`${API_BASE}/api/study-plans/${deleteTarget._id}`, { method: 'DELETE' });
      setDeleteTarget(null);
      await fetchAll();
    } catch (error) {
      console.error(error);
    }
  };

  if (!isLoaded || loading) {
    return (
      <DashboardShell title="Dashboard" usageData={usageData}>
        <div className="mx-auto grid max-w-[96rem] gap-5">
          <div className="h-[24rem] animate-pulse rounded-[2.8rem] border border-white/10 bg-white/[0.045]" />
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
            {[1, 2, 3, 4].map((item) => (
              <div key={item} className="h-44 animate-pulse rounded-[2rem] border border-white/10 bg-white/[0.045]" />
            ))}
          </div>
          <div className="h-72 animate-pulse rounded-[2.4rem] border border-white/10 bg-white/[0.045]" />
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Dashboard" usageData={usageData}>
      <div className="mx-auto max-w-[96rem] space-y-5">
        <DashboardHero userName={user?.firstName || user?.fullName} recentPlan={recentPlans[0]} onOpen={openPlan} />

        <ProgressWidgets studyPlans={studyPlans} stats={stats} />

        <RecentPlansPanel plans={recentPlans} onOpen={openPlan} onDelete={setDeleteTarget} />

        <div className="grid gap-5 xl:grid-cols-2">
          <DashboardFlashcardsPanel />
          <DailyStudyPlanWidget />
        </div>
      </div>

      <DeletePlanModal plan={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </DashboardShell>
  );
}
