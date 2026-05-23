import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  BarChart3,
  Bookmark,
  BookOpen,
  Cpu,
  CreditCard,
  Eye,
  Heart,
  LineChart,
  Loader2,
  LogOut,
  Medal,
  PlayCircle,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Trophy,
  Users,
} from 'lucide-react';
import DashboardShell from '../components/dashboard/DashboardShell';
import { useUsage } from '../contexts/UsageContext';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

const emptyAnalytics = {
  followers: 0,
  following: 0,
  publishedCourses: 0,
  totals: { views: 0, likes: 0, bookmarks: 0, readStarts: 0, completions: 0 },
  rankings: { followers: 1, views: 1, influence: 1, totalCreators: 1 },
  charts: [],
  topCourses: [],
  continueReading: [],
};

const costRows = [
  ['Generate Course Map', 5, 15],
  ['Import YouTube Playlist', 5, 15],
  ['Generate Lesson Notes', 10, 30],
  ['Regenerate Notes', 10, 30],
  ['Practice Grading', 5, 15],
  ['Explain / Simplify / Quiz', 2, 6],
  ['Tutor Chat Message', 1, 3],
];

function formatNumber(value) {
  const number = Number(value) || 0;
  if (number >= 1000000) return `${(number / 1000000).toFixed(1)}M`;
  if (number >= 1000) return `${(number / 1000).toFixed(1)}K`;
  return String(number);
}

function compactDate(value) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
}

function SmallStat({ icon: Icon, label, value, detail }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#111111] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.35)]"
    >
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
      <div className="flex items-start justify-between gap-5">
        <div>
          <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">{label}</p>
          <p className="mt-4 text-5xl font-black tracking-[-0.06em] text-white">{formatNumber(value)}</p>
        </div>
        <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-zinc-200">
          <Icon className="h-6 w-6" />
        </div>
      </div>
      <p className="mt-6 text-sm font-bold leading-6 text-zinc-500">{detail}</p>
    </motion.div>
  );
}

function RankCard({ icon: Icon, title, rank, total, description }) {
  const percentile = total > 1 ? Math.max(1, Math.round(((total - rank + 1) / total) * 100)) : 100;
  return (
    <div className="rounded-[2rem] border border-white/10 bg-[#111111] p-6 shadow-[0_20px_70px_rgba(0,0,0,0.32)]">
      <div className="flex items-start gap-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{title}</p>
          <div className="mt-2 flex items-end gap-2">
            <span className="text-4xl font-black tracking-[-0.04em] text-white">#{rank}</span>
            <span className="pb-1 text-sm font-bold text-zinc-600">of {total}</span>
          </div>
        </div>
      </div>
      <div className="mt-5 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-white" style={{ width: `${percentile}%` }} />
      </div>
      <p className="mt-4 text-sm font-semibold leading-6 text-zinc-500">{description}</p>
    </div>
  );
}

function AnalyticsChart({ title, subtitle, data, metric, color, icon: Icon }) {
  const max = Math.max(...data.map((item) => Number(item[metric]) || 0), 1);
  const points = data.map((item, index) => {
    const x = data.length <= 1 ? 0 : (index / (data.length - 1)) * 100;
    const y = 100 - ((Number(item[metric]) || 0) / max) * 82 - 8;
    return `${x},${y}`;
  }).join(' ');

  return (
    <section className="rounded-[2.4rem] border border-white/10 bg-[#111111] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.34)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Icon className="h-4 w-4 text-zinc-500" />
            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">{subtitle}</p>
          </div>
          <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">{title}</h2>
        </div>
        <span className="rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-black text-zinc-400">30 days</span>
      </div>

      <div className="mt-7 h-60">
        <svg viewBox="0 0 100 100" preserveAspectRatio="none" className="h-full w-full overflow-visible">
          {[20, 40, 60, 80].map((line) => (
            <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="rgba(255,255,255,0.08)" strokeWidth="0.35" />
          ))}
          <polyline points={points} fill="none" stroke={color} strokeWidth="2.8" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
          {data.map((item, index) => {
            const x = data.length <= 1 ? 0 : (index / (data.length - 1)) * 100;
            const y = 100 - ((Number(item[metric]) || 0) / max) * 82 - 8;
            return <circle key={`${item.date}-${metric}`} cx={x} cy={y} r="1.6" fill={color} vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
      </div>

      <div className="mt-5 grid grid-cols-6 gap-2 text-[10px] font-black uppercase tracking-wide text-zinc-600">
        {data.filter((_, index) => index % Math.ceil(Math.max(data.length, 1) / 6) === 0).slice(0, 6).map((item) => (
          <span key={`${metric}-${item.date}`} className="truncate">{compactDate(item.date)}</span>
        ))}
      </div>
    </section>
  );
}

function CreditBalance({ usageData }) {
  if (!usageData) return null;
  const daysLeft = usageData.billingCycleEnd
    ? Math.max(0, Math.ceil((new Date(usageData.billingCycleEnd) - new Date()) / (1000 * 60 * 60 * 24)))
    : null;

  return (
    <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#151515] p-7 shadow-[0_26px_80px_rgba(0,0,0,0.45)] md:p-10">
      <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(99,102,241,0.09),transparent_38%),radial-gradient(circle_at_20%_0%,rgba(255,255,255,0.08),transparent_28%)]" />
      <div className="relative flex flex-col gap-7 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-6">
          <div className="flex h-20 w-20 items-center justify-center rounded-3xl border border-white/10 bg-white/[0.06] text-white shadow-[0_16px_40px_rgba(0,0,0,0.25)]">
            <CreditCard className="h-9 w-9" />
          </div>
          <div>
            <p className="text-[12px] font-black uppercase tracking-[0.28em] text-zinc-500">Credit Balance</p>
            <p className="mt-2 text-6xl font-black leading-none tracking-[-0.06em] text-white">{formatNumber(usageData.balance)}</p>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <span className="inline-flex min-h-12 items-center rounded-full border border-white/15 bg-white/[0.06] px-6 text-sm font-black uppercase tracking-wide text-white">
            {usageData.plan} plan
          </span>
          <span className="inline-flex min-h-12 items-center rounded-full border border-indigo-200/15 bg-indigo-200/[0.06] px-6 text-sm font-black uppercase tracking-wide text-zinc-200">
            +{usageData.allowance} credits / {usageData.plan === 'free' ? 'week' : 'day'}
          </span>
          {daysLeft !== null && (
            <span className="inline-flex min-h-12 items-center rounded-full bg-white px-6 text-sm font-black uppercase tracking-wide text-black">
              {daysLeft} days left
            </span>
          )}
        </div>
      </div>
    </section>
  );
}

function CostLedger() {
  return (
    <section className="rounded-[2.8rem] border border-white/10 bg-[#111111] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)] md:p-10">
      <h2 className="text-3xl font-black tracking-[-0.03em] text-white">Cost Ledger</h2>
      <p className="mt-4 flex items-center gap-2 text-sm font-bold text-zinc-600">
        <Cpu className="h-4 w-4" />
        Advanced AI models consume higher credits for superior reasoning.
      </p>
      <div className="mt-8 overflow-x-auto">
        <table className="w-full min-w-[40rem]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="px-4 py-4 text-left text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600">Action</th>
              <th className="px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-zinc-600">Standard AI</th>
              <th className="rounded-t-2xl bg-white/[0.06] px-4 py-4 text-center text-[11px] font-black uppercase tracking-[0.2em] text-white">Advanced AI</th>
            </tr>
          </thead>
          <tbody>
            {costRows.map(([action, standard, advanced]) => (
              <tr key={action} className="border-b border-white/[0.06]">
                <td className="px-4 py-5 text-sm font-black text-zinc-300">{action}</td>
                <td className="px-4 py-5 text-center text-lg font-black text-zinc-600">{standard}</td>
                <td className="bg-white/[0.06] px-4 py-5 text-center text-lg font-black text-white">{advanced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

function RecentActivity({ transactions, txPage, txTotalPages, setTxPage }) {
  return (
    <section className="flex min-h-[36rem] flex-col rounded-[2.8rem] border border-white/10 bg-[#111111] p-7 shadow-[0_24px_80px_rgba(0,0,0,0.42)] md:p-10">
      <h2 className="text-3xl font-black tracking-[-0.03em] text-white">Recent Activity</h2>
      <div className="mt-8 min-h-0 flex-1 space-y-4 overflow-y-auto pr-1 custom-scroll">
        {transactions.length ? transactions.map((tx) => {
          const spend = tx.type === 'spend';
          return (
            <div key={tx._id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-[1.4rem] border border-white/10 bg-white/[0.035] p-5">
              <div className={`flex h-14 w-14 items-center justify-center rounded-2xl ${spend ? 'bg-red-500/10 text-red-400' : 'bg-emerald-500/10 text-emerald-400'}`}>
                {spend ? <TrendingDown className="h-5 w-5" /> : <TrendingUp className="h-5 w-5" />}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-sm font-black text-white">{tx.description}</p>
                <p className="mt-1 text-xs font-bold text-zinc-600">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>
              <span className={`text-2xl font-black ${spend ? 'text-red-400' : 'text-emerald-400'}`}>
                {spend ? '' : '+'}{tx.amount}
              </span>
            </div>
          );
        }) : (
          <div className="flex h-full min-h-60 items-center justify-center rounded-2xl border border-dashed border-white/10 text-center text-sm font-bold text-zinc-600">
            No credit activity yet.
          </div>
        )}
      </div>
      {txTotalPages > 1 && (
        <div className="mt-8 flex items-center justify-between border-t border-white/10 pt-6">
          <button type="button" onClick={() => setTxPage((page) => Math.max(1, page - 1))} disabled={txPage <= 1} className="rounded-full border border-white/10 px-5 py-2 text-sm font-black text-white disabled:opacity-30">
            Prev
          </button>
          <span className="text-xs font-black text-zinc-600">{txPage} / {txTotalPages}</span>
          <button type="button" onClick={() => setTxPage((page) => Math.min(txTotalPages, page + 1))} disabled={txPage >= txTotalPages} className="rounded-full border border-white/10 px-5 py-2 text-sm font-black text-white disabled:opacity-30">
            Next
          </button>
        </div>
      )}
    </section>
  );
}

function CourseRow({ course, index }) {
  return (
    <Link to={`/courses/${course.slug}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-white/10 bg-white/[0.035] px-4 py-3 transition hover:-translate-y-0.5 hover:bg-white/[0.06]">
      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white text-sm font-black text-black">{index + 1}</div>
      <div className="min-w-0">
        <p className="truncate text-sm font-black text-white">{course.title}</p>
        <p className="mt-1 text-xs font-bold text-zinc-600">{formatNumber(course.metrics?.views)} views · {formatNumber(course.metrics?.likes)} likes</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-zinc-500" />
    </Link>
  );
}

function ContinueRow({ item }) {
  return (
    <Link to={`/courses/${item.slug}?m=${item.moduleIndex || 0}&s=${item.subtopicIndex || 0}`} className="block rounded-2xl border border-white/10 bg-white/[0.035] p-4 transition hover:-translate-y-0.5 hover:bg-white/[0.06]">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0">
          <p className="truncate text-sm font-black text-white">{item.title}</p>
          <p className="mt-1 text-xs font-bold text-zinc-600">{item.percent || 0}% completed</p>
        </div>
        <PlayCircle className="h-5 w-5 shrink-0 text-zinc-500" />
      </div>
      <div className="mt-3 h-2 overflow-hidden rounded-full bg-white/[0.08]">
        <div className="h-full rounded-full bg-white" style={{ width: `${item.percent || 0}%` }} />
      </div>
    </Link>
  );
}

export default function Profile() {
  const { user } = useUser();
  const { signOut } = useClerk();
  const navigate = useNavigate();
  const { usageData } = useUsage();
  const [analytics, setAnalytics] = useState(emptyAnalytics);
  const [transactions, setTransactions] = useState([]);
  const [txPage, setTxPage] = useState(1);
  const [txTotalPages, setTxTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchAnalytics = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    setError('');
    try {
      const params = new URLSearchParams({ days: '30' });
      const res = await fetch(`${API_BASE}/api/public-courses/profile/${user.id}/analytics?${params.toString()}`);
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Could not load profile analytics.');
      setAnalytics(data.profile || emptyAnalytics);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [user?.id]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    if (!user?.id) return;
    const fetchTransactions = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/user/${user.id}/transactions?page=${txPage}&limit=20`);
        const data = await res.json();
        if (data.success) {
          setTransactions(data.transactions || []);
          setTxTotalPages(data.totalPages || 1);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchTransactions();
  }, [txPage, user?.id]);

  const chartData = analytics.charts?.length ? analytics.charts : Array.from({ length: 30 }, (_, index) => {
    const date = new Date();
    date.setDate(date.getDate() - (29 - index));
    return { date: date.toISOString().slice(0, 10), views: 0, followers: 0 };
  });

  const engagementRate = useMemo(() => {
    const views = analytics.totals?.views || 0;
    const interactions = (analytics.totals?.likes || 0) + (analytics.totals?.bookmarks || 0);
    return views ? Math.round((interactions / views) * 100) : 0;
  }, [analytics]);

  if (!user) return null;

  return (
    <DashboardShell title="Profile" eyebrow="Creator Studio">
      <div className="mx-auto max-w-[112rem] space-y-6 pb-8">
        <section className="relative overflow-hidden rounded-[2.8rem] border border-white/10 bg-[#111111] p-7 shadow-[0_28px_90px_rgba(0,0,0,0.45)] md:p-10">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_35%),radial-gradient(circle_at_80%_0%,rgba(34,211,238,0.08),transparent_30%)]" />
          <div className="relative grid gap-8 xl:grid-cols-[minmax(0,1fr)_29rem] xl:items-center">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-zinc-300">Creator profile</span>
                <span className="rounded-full border border-cyan-200/20 bg-cyan-200/10 px-4 py-2 text-[11px] font-black uppercase tracking-[0.22em] text-cyan-100">Worldwide rank #{analytics.rankings?.influence || 1}</span>
              </div>

              <div className="mt-8 flex flex-col gap-6 md:flex-row md:items-center">
                <img src={user.imageUrl} alt={user.fullName || 'Profile'} className="h-28 w-28 rounded-[2rem] border-4 border-white/10 object-cover shadow-[0_18px_50px_rgba(0,0,0,0.35)]" />
                <div className="min-w-0">
                  <h1 className="break-words text-5xl font-black leading-none tracking-[-0.055em] text-white md:text-7xl">
                    {user.fullName || user.username || 'Creator'}
                  </h1>
                  <p className="mt-3 text-sm font-bold text-zinc-500">{user.primaryEmailAddress?.emailAddress}</p>
                </div>
              </div>
            </div>

            <div className="rounded-[2rem] border border-white/10 bg-black/35 p-6">
              <p className="text-[11px] font-black uppercase tracking-[0.22em] text-zinc-500">Learners following you</p>
              <div className="mt-4 flex items-end gap-4">
                <span className="text-8xl font-black leading-none tracking-[-0.07em] text-white">{formatNumber(analytics.followers)}</span>
                <span className="pb-3 text-sm font-black uppercase tracking-[0.18em] text-zinc-500">followers</span>
              </div>
              <p className="mt-5 text-sm font-semibold leading-6 text-zinc-500">
                Every follower is someone who wants more of your public courses. Keep publishing useful paths.
              </p>
              <button
                type="button"
                onClick={() => signOut(() => navigate('/'))}
                className="mt-6 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-full bg-white px-5 text-sm font-black text-black transition hover:bg-zinc-200"
              >
                <LogOut className="h-4 w-4" />
                Sign out
              </button>
            </div>
          </div>
        </section>

        <CreditBalance usageData={usageData} />

        {error && <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm font-bold text-rose-200">{error}</div>}

        {loading ? (
          <div className="flex min-h-96 items-center justify-center rounded-[2rem] border border-white/10 bg-[#111111]">
            <Loader2 className="h-8 w-8 animate-spin text-white" />
          </div>
        ) : (
          <>
            <section id="profile-stats" className="scroll-mt-28 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SmallStat icon={Users} label="Following" value={analytics.following} detail="Creators you are learning from." />
              <SmallStat icon={Eye} label="Views" value={analytics.totals?.views} detail={`${formatNumber(analytics.totals?.readStarts)} public reading starts.`} />
              <SmallStat icon={Heart} label="Likes" value={analytics.totals?.likes} detail={`${engagementRate}% engagement from views.`} />
              <SmallStat icon={BookOpen} label="Courses" value={analytics.publishedCourses} detail={`${formatNumber(analytics.totals?.completions)} completions tracked.`} />
            </section>

            <section className="grid gap-4 lg:grid-cols-3">
              <RankCard icon={Trophy} title="Follower rank" rank={analytics.rankings?.followers || 1} total={analytics.rankings?.totalCreators || 1} description="Your follower position among public course creators." />
              <RankCard icon={BarChart3} title="Views rank" rank={analytics.rankings?.views || 1} total={analytics.rankings?.totalCreators || 1} description="A competitive view of your public course reach." />
              <RankCard icon={Medal} title="Influence rank" rank={analytics.rankings?.influence || 1} total={analytics.rankings?.totalCreators || 1} description="Weighted by followers, views, likes, saves, and completions." />
            </section>

            <section id="profile-graphs" className="scroll-mt-28 grid gap-6 xl:grid-cols-2">
              <AnalyticsChart title="Views over time" subtitle="YouTube-style reach" data={chartData} metric="views" color="#60a5fa" icon={LineChart} />
              <AnalyticsChart title="Followers per day" subtitle="Audience growth" data={chartData} metric="followers" color="#34d399" icon={Users} />
            </section>

            <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
              <div className="rounded-[2.4rem] border border-white/10 bg-[#111111] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.34)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Public performance</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">Top courses</h2>
                  </div>
                  <Link to="/courses" className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-black text-black">
                    Explore <ArrowUpRight className="h-4 w-4" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {analytics.topCourses?.length ? analytics.topCourses.map((course, index) => (
                    <CourseRow key={course._id} course={course} index={index} />
                  )) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
                      <Sparkles className="mx-auto h-8 w-8 text-zinc-500" />
                      <p className="mt-3 text-sm font-bold text-zinc-500">Publish a guided course to start collecting public analytics.</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-[2.4rem] border border-white/10 bg-[#111111] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.34)]">
                <div className="mb-5 flex items-center justify-between gap-4">
                  <div>
                    <p className="text-[10px] font-black uppercase tracking-[0.22em] text-zinc-500">Your reading</p>
                    <h2 className="mt-2 text-3xl font-black tracking-[-0.03em] text-white">Continue learning</h2>
                  </div>
                  <Bookmark className="h-5 w-5 text-zinc-500" />
                </div>
                <div className="space-y-3">
                  {analytics.continueReading?.length ? analytics.continueReading.map((item) => (
                    <ContinueRow key={`${item.courseId}-${item.lastReadAt}`} item={item} />
                  )) : (
                    <div className="rounded-2xl border border-dashed border-white/10 bg-white/[0.025] p-8 text-center">
                      <PlayCircle className="mx-auto h-8 w-8 text-zinc-500" />
                      <p className="mt-3 text-sm font-bold text-zinc-500">Courses you read from the public library will appear here.</p>
                    </div>
                  )}
                </div>
              </div>
            </section>

            <section id="profile-activity" className="scroll-mt-28 grid gap-6 xl:grid-cols-[1.45fr_1fr]">
              <CostLedger />
              <RecentActivity transactions={transactions} txPage={txPage} txTotalPages={txTotalPages} setTxPage={setTxPage} />
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
