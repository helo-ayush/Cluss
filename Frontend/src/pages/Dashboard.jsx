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

  const sortedPlans = useMemo(() => (
    [...studyPlans].sort((left, right) => {
      const leftActive = left.progress > 0 && left.progress < 100 ? 1 : 0;
      const rightActive = right.progress > 0 && right.progress < 100 ? 1 : 0;
      if (leftActive !== rightActive) return rightActive - leftActive;
      return new Date(right.updatedAt || right.createdAt || 0) - new Date(left.updatedAt || left.createdAt || 0);
    })
  ), [studyPlans]);

  const openPlan = (plan) => {
    if (plan.sourceType === 'playlist') navigate(`/playlist/${plan._id}`);
    else navigate(`/dashboard/guided/study-plan/${plan._id}`);
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
        <div className="mx-auto max-w-[96rem] grid gap-6 lg:grid-cols-[1fr_26rem] items-start">
          <div className="space-y-6">
            <div className="h-[28rem] animate-pulse rounded-[2.4rem] border border-white/10 bg-white/[0.04]" />
            <div className="h-44 animate-pulse rounded-[2.4rem] border border-white/10 bg-white/[0.04]" />
          </div>
          <div className="space-y-6">
            <div className="h-[20rem] animate-pulse rounded-[2.4rem] border border-white/10 bg-white/[0.04]" />
            <div className="h-[20rem] animate-pulse rounded-[2.4rem] border border-white/10 bg-white/[0.04]" />
          </div>
        </div>
      </DashboardShell>
    );
  }

  return (
    <DashboardShell title="Dashboard" usageData={usageData}>
      <div className="mx-auto max-w-[96rem] font-nunito antialiased text-white">
        <div className="grid gap-6 lg:grid-cols-[1fr_26rem] items-start">
          {/* Left Column: Workstation Table & Active Momentum Highlight */}
          <div className="space-y-6 min-w-0">
            <RecentPlansPanel plans={sortedPlans} onOpen={openPlan} onDelete={setDeleteTarget} />
            <ProgressWidgets studyPlans={studyPlans} stats={stats} clerkId={user?.id} isDashboard={true} />
          </div>

          {/* Right Column: AI Focus Timeline Stop & Habits */}
          <div className="space-y-6">
            <DailyStudyPlanWidget />
            <DashboardFlashcardsPanel />
          </div>
        </div>
      </div>

      <DeletePlanModal plan={deleteTarget} onCancel={() => setDeleteTarget(null)} onConfirm={handleDelete} />
    </DashboardShell>
  );
}
