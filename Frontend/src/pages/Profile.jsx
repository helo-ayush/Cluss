import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useClerk, useUser } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import {
  ArrowUpRight,
  Bookmark,
  BookOpen,
  Cpu,
  CreditCard,
  Eye,
  Heart,
  LineChart,
  Loader2,
  LogOut,
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

function TabbedAnalyticsChart({ chartData }) {
  const [activeTab, setActiveTab] = useState('views'); // 'views' or 'followers'

  const title = activeTab === 'views' ? 'Views over time' : 'Followers per day';
  const subtitle = activeTab === 'views' ? 'YouTube-style reach' : 'Audience growth';
  const metric = activeTab;
  const max = Math.max(...chartData.map((item) => Number(item[metric]) || 0), 1);
  
  const points = chartData.map((item, index) => {
    const x = chartData.length <= 1 ? 0 : (index / (chartData.length - 1)) * 100;
    const y = 100 - ((Number(item[metric]) || 0) / max) * 78 - 10;
    return `${x},${y}`;
  }).join(' ');

  return (
    <motion.div 
      whileHover={{ 
        y: -6, 
        borderColor: "rgba(239,255,85,0.15)",
        boxShadow: "0 30px 60px -15px rgba(0,0,0,0.7), 0 0 25px 2px rgba(239,255,85,0.03)" 
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] relative overflow-hidden group flex flex-col h-[23rem] transition-all duration-300"
    >
      <div className="absolute right-0 bottom-0 -z-10 h-48 w-48 rounded-full bg-[#efff55]/5 blur-3xl opacity-50 group-hover:scale-110 transition-all duration-500" />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/[0.06] pb-4 mb-5">
        <div>
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">{subtitle}</span>
          <h2 className="text-xl font-black tracking-tight text-white mt-0.5">{title}</h2>
        </div>
        <div className="flex bg-white/[0.03] p-1 rounded-xl border border-white/5 shrink-0">
          <button
            onClick={() => setActiveTab('views')}
            className={`px-4 py-2 text-xs font-black rounded-lg transition-all duration-300 ${
              activeTab === 'views' 
                ? 'bg-[#efff55] text-black shadow-[0_0_12px_rgba(239,255,85,0.25)]' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Views
          </button>
          <button
            onClick={() => setActiveTab('followers')}
            className={`px-4 py-2 text-xs font-black rounded-lg transition-all duration-300 ${
              activeTab === 'followers' 
                ? 'bg-[#efff55] text-black shadow-[0_0_12px_rgba(239,255,85,0.25)]' 
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            Followers
          </button>
        </div>
      </div>

      <div className="flex-1 relative mt-4 select-none min-h-0">
        <svg className="h-full w-full overflow-visible text-[#efff55]" viewBox="0 0 100 100" preserveAspectRatio="none">
          <defs>
            <linearGradient id="chart-area-glow-profile" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#efff55" stopOpacity="0.12" />
              <stop offset="100%" stopColor="#efff55" stopOpacity="0.0" />
            </linearGradient>
          </defs>
          {[20, 40, 60, 80].map((line) => (
            <line key={line} x1="0" x2="100" y1={line} y2={line} stroke="rgba(255,255,255,0.03)" strokeWidth="0.35" />
          ))}
          
          {chartData.length > 0 && (
            <path
              d={`M 0,100 L ${points} L 100,100 Z`}
              fill="url(#chart-area-glow-profile)"
              vectorEffect="non-scaling-stroke"
            />
          )}

          <polyline points={points} fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" vectorEffect="non-scaling-stroke" className="drop-shadow-[0_0_8px_rgba(239,255,85,0.4)]" />
          {chartData.map((item, index) => {
            const x = chartData.length <= 1 ? 0 : (index / (chartData.length - 1)) * 100;
            const y = 100 - ((Number(item[metric]) || 0) / max) * 78 - 10;
            return <circle key={`${item.date}-${metric}`} cx={x} cy={y} r="1.2" className="fill-[#efff55] stroke-[#1b1b1b] stroke-[0.7px]" vectorEffect="non-scaling-stroke" />;
          })}
        </svg>
      </div>

      <div className="mt-4 grid grid-cols-6 gap-2 text-[9px] font-black uppercase tracking-wider text-zinc-500 border-t border-white/[0.04] pt-3 shrink-0">
        {chartData.filter((_, index) => index % Math.ceil(Math.max(chartData.length, 1) / 6) === 0).slice(0, 6).map((item) => (
          <span key={`${metric}-${item.date}`} className="truncate">{compactDate(item.date)}</span>
        ))}
      </div>
    </motion.div>
  );
}

function CourseRow({ course, index }) {
  return (
    <Link to={`/courses/${course.slug}`} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] px-4 py-3.5 transition-all duration-300 hover:bg-white/[0.04] hover:border-[#efff55]/30 hover:-translate-y-0.5 group">
      <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/5 border border-white/10 text-xs font-black text-zinc-400 transition-colors duration-300 group-hover:border-[#efff55]/30 group-hover:text-[#efff55]">
        {index + 1}
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-bold text-white transition-colors duration-300 group-hover:text-[#efff55]">{course.title}</p>
        <p className="mt-0.5 text-xs text-zinc-500 font-semibold">{formatNumber(course.metrics?.views)} views · {formatNumber(course.metrics?.likes)} likes</p>
      </div>
      <ArrowUpRight className="h-4 w-4 text-zinc-500 transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 group-hover:text-[#efff55]" />
    </Link>
  );
}

function CostLedger() {
  return (
    <motion.section 
      whileHover={{ 
        y: -6, 
        borderColor: "rgba(239,255,85,0.15)",
        boxShadow: "0 30px 60px -15px rgba(0,0,0,0.7), 0 0 25px 2px rgba(239,255,85,0.03)" 
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300"
    >
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">System Economics</span>
      <h2 className="text-xl font-black tracking-tight text-white mt-0.5">Cost Reference</h2>
      <p className="mt-1 flex items-center gap-2 text-xs font-bold text-zinc-500">
        <Cpu className="h-3.5 w-3.5 text-[#efff55]" />
        Advanced AI models consume higher credits for superior reasoning.
      </p>
      <div className="mt-6 overflow-x-auto select-none">
        <table className="w-full min-w-[30rem]">
          <thead>
            <tr className="border-b border-white/[0.06] text-[10px] font-black uppercase tracking-wider text-zinc-500">
              <th className="px-4 py-3 text-left">Action</th>
              <th className="px-4 py-3 text-center">Standard AI</th>
              <th className="px-4 py-3 text-center text-[#efff55]">Advanced AI</th>
            </tr>
          </thead>
          <tbody>
            {costRows.map(([action, standard, advanced]) => (
              <tr key={action} className="border-b border-white/[0.04] transition-all hover:bg-white/[0.01]">
                <td className="px-4 py-3.5 text-xs font-bold text-zinc-300">{action}</td>
                <td className="px-4 py-3.5 text-center text-xs font-bold text-zinc-500">{standard}</td>
                <td className="px-4 py-3.5 text-center text-xs font-black text-white">{advanced}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.section>
  );
}

function RecentActivity({ transactions, txPage, txTotalPages, setTxPage }) {
  return (
    <motion.section 
      whileHover={{ 
        y: -6, 
        borderColor: "rgba(239,255,85,0.15)",
        boxShadow: "0 30px 60px -15px rgba(0,0,0,0.7), 0 0 25px 2px rgba(239,255,85,0.03)" 
      }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="flex flex-col rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300"
    >
      <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Ledger Streams</span>
      <h2 className="text-xl font-black tracking-tight text-white mt-0.5">Recent Activity</h2>
      <div className="mt-6 min-h-[16rem] flex-1 space-y-3 overflow-y-auto pr-1 custom-scroll max-h-96">
        {transactions.length ? transactions.map((tx) => {
          const spend = tx.type === 'spend';
          return (
            <div key={tx._id} className="grid grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-4 rounded-2xl border border-white/[0.04] bg-white/[0.02] p-4 transition-all duration-300 hover:bg-white/[0.04] hover:border-[#efff55]/20">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.04] border border-white/5 text-zinc-400">
                {spend ? <TrendingDown className="h-4.5 w-4.5 text-zinc-500" /> : <TrendingUp className="h-4.5 w-4.5 text-[#efff55]" />}
              </div>
              <div className="min-w-0">
                <p className="line-clamp-2 text-xs font-bold text-white leading-normal">{tx.description}</p>
                <p className="mt-0.5 text-[10px] font-semibold text-zinc-500">{new Date(tx.createdAt).toLocaleString()}</p>
              </div>
              <span className={`text-sm font-black ${spend ? 'text-zinc-500' : 'text-[#efff55]'}`}>
                {spend ? '-' : '+'}{Math.abs(tx.amount)}
              </span>
            </div>
          );
        }) : (
          <div className="flex h-full min-h-[12rem] items-center justify-center rounded-2xl border border-dashed border-white/[0.08] text-center text-xs font-bold text-zinc-500">
            No credit activity yet.
          </div>
        )}
      </div>
      {txTotalPages > 1 && (
        <div className="mt-6 flex items-center justify-between border-t border-white/[0.06] pt-4 shrink-0">
          <button type="button" onClick={() => setTxPage((page) => Math.max(1, page - 1))} disabled={txPage <= 1} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white hover:border-white/20 transition-all disabled:opacity-30">
            Prev
          </button>
          <span className="text-[10px] font-black text-zinc-500">{txPage} / {txTotalPages}</span>
          <button type="button" onClick={() => setTxPage((page) => Math.min(txTotalPages, page + 1))} disabled={txPage >= txTotalPages} className="rounded-xl border border-white/10 px-4 py-2 text-xs font-black text-white hover:border-white/20 transition-all disabled:opacity-30">
            Next
          </button>
        </div>
      )}
    </motion.section>
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
      <div className="mx-auto max-w-[112rem] space-y-6 pb-8 font-nunito text-white">
        
        {/* Row 1: Profile Main Hero & Actions */}
        <motion.section 
          initial={{ opacity: 0, y: 15 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          whileHover={{ y: -4, borderColor: "rgba(239,255,85,0.2)", boxShadow: "0 30px 60px -15px rgba(0,0,0,0.8), 0 0 30px 2px rgba(239,255,85,0.04)" }}
          transition={{ duration: 0.3, ease: "easeOut" }}
          className="relative overflow-hidden rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-8 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group transition-all duration-300"
        >
          {/* Subtle backglow overlay */}
          <div className="absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-[#efff55]/5 blur-3xl group-hover:bg-[#efff55]/8 transition-all duration-300 animate-pulse" />
          

          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 text-center sm:text-left">
              
              {/* Premium double-bordered squircle Avatar */}
              <div className="relative shrink-0 group/avatar">
                <div className="absolute inset-0 rounded-[1.6rem] bg-gradient-to-br from-[#efff55]/30 to-transparent blur-sm opacity-45 group-hover/avatar:opacity-100 transition-opacity duration-300 pointer-events-none" />
                <img src={user.imageUrl} alt={user.fullName || 'Profile'} className="relative h-20 w-20 rounded-[1.4rem] border-2 border-white/10 object-cover shadow-[0_12px_30px_rgba(0,0,0,0.4)] transition-transform duration-300 group-hover/avatar:scale-[1.03]" />
                <div className="absolute inset-0 rounded-[1.4rem] border-2 border-[#efff55]/30 opacity-0 group-hover/avatar:opacity-100 transition-opacity duration-300 pointer-events-none" />
              </div>

              <div className="space-y-2 flex-1">
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                  <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">{user.fullName || user.username || 'Creator'}</h1>
                  <span className="inline-flex items-center rounded-full bg-[#efff55]/10 border border-[#efff55]/20 px-3 py-0.5 text-[9px] font-black text-[#efff55] uppercase tracking-widest shadow-sm">
                    Creator Mode
                  </span>
                  <span className="inline-flex items-center rounded-full bg-white/[0.04] border border-white/[0.08] px-3 py-0.5 text-[9px] font-black text-zinc-300 uppercase tracking-widest">
                    🏆 Rank #{analytics.rankings?.influence || 1}
                  </span>
                </div>
                
                <p className="text-xs text-zinc-400 font-semibold">{user.primaryEmailAddress?.emailAddress} · <span className="text-zinc-500">Welcome back to your focus studio</span></p>
                
                <div className="mt-4 flex flex-wrap items-center justify-center sm:justify-start gap-5 text-xs font-black text-zinc-400 select-none">
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-2 hover:border-white/[0.08] transition duration-200">
                    <Users className="h-4 w-4 text-zinc-500" />
                    <span>{formatNumber(analytics.followers)} <span className="text-zinc-500 font-bold">followers</span></span>
                  </div>
                  <div className="flex items-center gap-2 rounded-xl bg-white/[0.02] border border-white/[0.04] px-3.5 py-2 hover:border-white/[0.08] transition duration-200">
                    <BookOpen className="h-4 w-4 text-zinc-500" />
                    <span>{analytics.publishedCourses} <span className="text-zinc-500 font-bold">courses</span></span>
                  </div>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-center lg:justify-end shrink-0">
              <button
                type="button"
                onClick={() => signOut(() => navigate('/'))}
                className="flex h-11 items-center justify-center gap-2.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-6 text-xs font-black text-[#efff55] hover:bg-[#efff55] hover:text-black hover:border-[#efff55] transition-all duration-300 shadow-lg hover:shadow-[0_0_20px_rgba(239,255,85,0.25)] hover:scale-[1.02]"
              >
                <LogOut className="h-4 w-4" />
                Sign Out
              </button>
            </div>
          </div>
        </motion.section>

        {/* Row 2: Resources Box (Left) & Achievements 2x2 Grid (Right) */}
        <div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          
          {/* Left Column: AI Credit Station / Resources Box */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -6, borderColor: "rgba(239,255,85,0.25)", boxShadow: "0 35px 70px -10px rgba(0,0,0,0.85), 0 0 30px 4px rgba(239,255,85,0.06)" }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="relative overflow-hidden rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group min-h-[22rem] flex flex-col justify-between transition-all duration-300"
          >
            <div className="absolute -right-10 -top-10 -z-10 h-40 w-40 rounded-full bg-[#efff55]/5 blur-3xl opacity-50 pointer-events-none" />

            <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 mb-2 shrink-0">
              <div>
                <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Resource Station</span>
                <h2 className="text-lg font-black tracking-tight text-white mt-0.5">AI Credits</h2>
              </div>
            </div>

            {usageData ? (
              <div className="flex-1 flex flex-col justify-between mt-4">
                <div className="space-y-1">
                  <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500 block">Available Power</span>
                  
                  {/* Superb showcasing of current credits */}
                  <div className="relative inline-flex items-baseline mt-1">
                    <span className="text-5xl font-black tracking-tight text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.08)]">
                      {formatNumber(usageData.balance)}
                    </span>
                    <span className="text-[9px] font-black text-[#efff55] uppercase tracking-widest ml-3.5 bg-[#efff55]/10 border border-[#efff55]/20 px-2.5 py-1 rounded-lg">
                      {usageData.plan} Tier
                    </span>
                  </div>
                </div>

                {/* Highly structured, superb showcase of refill & renewal rules */}
                <div className="mt-6 space-y-3.5 border-t border-white/[0.06] pt-5 select-none text-xs">
                  <div className="flex justify-between items-center bg-white/[0.01] border border-white/[0.03] rounded-xl px-4 py-3 hover:border-white/[0.06] transition duration-200">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Credit Allocation</span>
                    <span className="font-black text-white">+{usageData.allowance} credits / {usageData.plan === 'free' ? 'week' : 'day'}</span>
                  </div>
                  
                  <div className="flex justify-between items-center bg-white/[0.01] border border-white/[0.03] rounded-xl px-4 py-3 hover:border-white/[0.06] transition duration-200">
                    <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Next Refill</span>
                    <span className="font-black text-[#efff55] flex items-center gap-1.5">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#efff55] animate-pulse" />
                      Refills Daily (00:00 UTC)
                    </span>
                  </div>

                  {usageData.billingCycleEnd && (
                    <div className="flex justify-between items-center bg-white/[0.01] border border-white/[0.03] rounded-xl px-4 py-3 hover:border-white/[0.06] transition duration-200">
                      <span className="text-zinc-500 font-bold uppercase tracking-wider text-[9px]">Cycle Renewal</span>
                      <span className="font-black text-white">
                        {new Date(usageData.billingCycleEnd).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                        <span className="text-[#efff55] ml-1.5 font-black">({Math.max(0, Math.ceil((new Date(usageData.billingCycleEnd) - new Date()) / (1000 * 60 * 60 * 24)))} days left)</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 flex-1">
                <Loader2 className="h-6 w-6 animate-spin text-zinc-500" />
              </div>
            )}
          </motion.div>

          {/* Right Column: Achievements & Metric Blocks in a 2x2 grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 h-full">
            {/* Followers */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, borderColor: "rgba(239,255,85,0.25)", boxShadow: "0 30px 60px -10px rgba(0,0,0,0.8), 0 0 25px 2px rgba(239,255,85,0.05)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group cursor-pointer relative overflow-hidden flex flex-col justify-between transition-all duration-300"
            >
              <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#efff55]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 mb-2 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Learners Following</span>
                <Users className="h-4 w-4 text-zinc-500 group-hover:text-[#efff55] transition-colors duration-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white leading-none">{formatNumber(analytics.followers)}</span>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Followers</span>
              </div>
              <p className="mt-3 text-[10px] font-semibold text-zinc-500 border-t border-white/[0.03] pt-2 leading-relaxed shrink-0">
                Learning from <span className="font-bold text-white group-hover:text-[#efff55] transition-colors">{analytics.following}</span> creators.
              </p>
            </motion.div>

            {/* Views */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, borderColor: "rgba(239,255,85,0.25)", boxShadow: "0 30px 60px -10px rgba(0,0,0,0.8), 0 0 25px 2px rgba(239,255,85,0.05)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group cursor-pointer relative overflow-hidden flex flex-col justify-between transition-all duration-300"
            >
              <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#efff55]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 mb-2 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Total Readership</span>
                <Eye className="h-4 w-4 text-zinc-500 group-hover:text-[#efff55] transition-colors duration-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white leading-none">{formatNumber(analytics.totals?.views)}</span>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Views</span>
              </div>
              <p className="mt-3 text-[10px] font-semibold text-zinc-500 border-t border-white/[0.03] pt-2 leading-relaxed shrink-0">
                <span className="font-bold text-white group-hover:text-[#efff55] transition-colors">{formatNumber(analytics.totals?.readStarts)}</span> study starts tracked.
              </p>
            </motion.div>

            {/* Likes */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, borderColor: "rgba(239,255,85,0.25)", boxShadow: "0 30px 60px -10px rgba(0,0,0,0.8), 0 0 25px 2px rgba(239,255,85,0.05)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group cursor-pointer relative overflow-hidden flex flex-col justify-between transition-all duration-300"
            >
              <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#efff55]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 mb-2 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Community Reaction</span>
                <Heart className="h-4 w-4 text-zinc-500 group-hover:text-[#efff55] transition-colors duration-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white leading-none">{formatNumber(analytics.totals?.likes)}</span>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Likes</span>
              </div>
              <p className="mt-3 text-[10px] font-semibold text-zinc-500 border-t border-white/[0.03] pt-2 leading-relaxed shrink-0">
                <span className="font-bold text-white group-hover:text-[#efff55] transition-colors">{engagementRate}%</span> positive student interactions.
              </p>
            </motion.div>

            {/* Created Courses */}
            <motion.div 
              initial={{ opacity: 0, y: 15 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              whileHover={{ y: -6, borderColor: "rgba(239,255,85,0.25)", boxShadow: "0 30px 60px -10px rgba(0,0,0,0.8), 0 0 25px 2px rgba(239,255,85,0.05)" }}
              transition={{ duration: 0.25, ease: "easeOut" }}
              className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 shadow-[0_20px_50px_rgba(0,0,0,0.5)] group cursor-pointer relative overflow-hidden flex flex-col justify-between transition-all duration-300"
            >
              <div className="absolute left-0 top-0 h-[2px] w-full bg-gradient-to-r from-transparent via-[#efff55]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
              <div className="flex items-center justify-between border-b border-white/[0.03] pb-2 mb-2 shrink-0">
                <span className="text-[10px] font-black uppercase tracking-wider text-zinc-500">Created Courses</span>
                <BookOpen className="h-4 w-4 text-zinc-500 group-hover:text-[#efff55] transition-colors duration-300" />
              </div>
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-3xl font-black text-white leading-none">{analytics.publishedCourses}</span>
                <span className="text-[10px] text-zinc-500 font-black uppercase tracking-wider">Published</span>
              </div>
              <p className="mt-3 text-[10px] font-semibold text-zinc-500 border-t border-white/[0.03] pt-2 leading-relaxed shrink-0">
                <span className="font-bold text-white group-hover:text-[#efff55] transition-colors">{formatNumber(analytics.totals?.completions)}</span> completions tracked.
              </p>
            </motion.div>
          </div>

        </div>

        {error && <div className="rounded-xl border border-rose-500/20 bg-rose-500/10 px-4 py-3 text-xs font-bold text-rose-200">{error}</div>}

        {!loading && (
          <>
            {/* Row 4: Published Courses (Creation Studio) & Tabbed Graph */}
            <section className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              
              {/* Published Top Courses list */}
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ 
                  y: -6, 
                  borderColor: "rgba(239,255,85,0.15)",
                  boxShadow: "0 30px 60px -15px rgba(0,0,0,0.7), 0 0 25px 2px rgba(239,255,85,0.03)" 
                }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="rounded-[2.2rem] border border-white/[0.06] bg-[#1b1b1b] p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300"
              >
                <div className="mb-5 flex items-center justify-between gap-4 border-b border-white/[0.06] pb-4">
                  <div>
                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500 block">Public Performance</span>
                    <h2 className="text-xl font-black tracking-tight text-white mt-0.5">Top Courses</h2>
                  </div>
                  <Link to="/courses" className="inline-flex items-center gap-1.5 rounded-full border border-white/[0.06] bg-white/[0.04] px-4 py-2 text-xs font-black text-[#efff55] hover:bg-[#efff55] hover:text-black hover:border-[#efff55] transition-all duration-300">
                    Explore <ArrowUpRight className="h-3.5 w-3.5" />
                  </Link>
                </div>
                <div className="space-y-3">
                  {analytics.topCourses?.length ? analytics.topCourses.slice(0, 4).map((course, index) => (
                    <CourseRow key={course._id} course={course} index={index} />
                  )) : (
                    <div className="rounded-2xl border border-dashed border-white/[0.08] bg-white/[0.01] p-8 text-center select-none">
                      <Sparkles className="mx-auto h-7 w-7 text-zinc-600 mb-2" />
                      <p className="text-xs font-bold text-zinc-500">Publish a guided course to start collecting public statistics.</p>
                    </div>
                  )}
                </div>
              </motion.div>

              {/* Combined Tabbed Graph */}
              <TabbedAnalyticsChart chartData={chartData} />
            </section>

            {/* Row 5: Cost Reference & Activity Ledgers */}
            <section id="profile-activity" className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
              <CostLedger />
              <RecentActivity transactions={transactions} txPage={txPage} txTotalPages={txTotalPages} setTxPage={setTxPage} />
            </section>
          </>
        )}
      </div>
    </DashboardShell>
  );
}
