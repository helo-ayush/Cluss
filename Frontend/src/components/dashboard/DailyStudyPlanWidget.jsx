import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { motion } from 'motion/react';
import { Compass, Sparkles, BookOpen, ArrowRight, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function DailyStudyPlanWidget() {
  const { getToken, userId } = useAuth();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchSchedule = async () => {
    if (!userId) return;
    try {
      setLoading(true);
      const token = await getToken();
      const res = await fetch(`${API_BASE}/api/schedule/daily/${userId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setSchedule(data.schedule);
      }
    } catch (err) {
      console.error('Failed to fetch daily schedule:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchedule();
  }, [getToken, userId]);

  const handleTaskClick = (courseId) => {
    if (courseId && courseId !== "000000000000000000000000") {
      navigate(`/study-plan/${courseId}`);
    } else {
      navigate(`/dashboard/guided`); // Fallback for "empty state" plans
    }
  };

  return (
    <section className="relative overflow-hidden flex flex-col rounded-[2.4rem] border border-white/10 bg-[#0a0a0a] shadow-[0_20px_60px_rgba(0,0,0,0.4)] min-h-[32rem]">
      {/* Background aesthetics — warm amber glow */}
      <div className="absolute -right-24 -top-10 h-[28rem] w-[28rem] rounded-full bg-amber-500/[0.04] blur-[130px] pointer-events-none" />
      <div className="absolute -left-16 bottom-0 h-64 w-64 rounded-full bg-orange-500/[0.03] blur-[100px] pointer-events-none" />

      {/* Header */}
      <div className="p-6 md:p-8 flex items-center justify-between border-b border-white/[0.06] relative z-10 shrink-0">
        <div>
          <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
            <Compass className="h-3 w-3" />
            <span>AI Flight Plan</span>
          </div>
          <h2 className="mt-2 text-2xl font-black text-white">Today's Focus</h2>
        </div>
        {schedule && schedule.plan && (
          <div className="flex items-center gap-1.5 rounded-full bg-white/5 border border-white/[0.06] px-3 py-1.5">
            <Zap className="h-3 w-3 text-amber-400" />
            <span className="text-[10px] font-black text-zinc-400">{schedule.plan.length} tasks</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-6 md:p-8 relative z-10 overflow-y-auto no-scrollbar">
        {loading ? (
          <div className="flex flex-col gap-4 animate-pulse">
            <div className="h-5 w-3/4 rounded-md bg-white/5 mb-2" />
            <div className="h-[10rem] w-full rounded-[1.6rem] bg-white/[0.03] border border-white/5" />
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="h-28 rounded-[1.2rem] bg-white/[0.03] border border-white/5" />
              ))}
            </div>
          </div>
        ) : schedule ? (
          <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col h-full">
            <p className="text-[13px] font-medium leading-relaxed text-zinc-400 mb-5">
              {schedule.greeting}
            </p>
            
            <div className="flex flex-col gap-3">
              {/* PRIMARY OBJECTIVE — Hero Card */}
              {schedule.plan.length > 0 && (
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  onClick={() => handleTaskClick(schedule.plan[0].courseId)}
                  className="group relative flex flex-col rounded-[1.6rem] border border-white/[0.08] bg-gradient-to-br from-white/[0.04] via-transparent to-amber-500/[0.03] p-5 md:p-6 text-left transition-all hover:border-amber-500/30 hover:shadow-[0_0_40px_rgba(245,158,11,0.08)] overflow-hidden"
                >
                  {/* Corner accent */}
                  <div className="absolute -top-12 -right-12 h-28 w-28 rounded-full bg-amber-500/[0.08] blur-[40px] group-hover:bg-amber-500/[0.15] transition-all duration-700" />
                  
                  <div className="relative z-10 flex items-center gap-2 mb-4">
                    <span className="flex items-center gap-1.5 rounded-full bg-amber-500/10 px-3 py-1 text-[9px] font-black uppercase tracking-[0.15em] text-amber-400/90 border border-amber-500/20">
                      <span className="h-1.5 w-1.5 rounded-full bg-amber-400 animate-pulse" />
                      Start here
                    </span>
                  </div>

                  <div className="relative z-10">
                    <span className="text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-500 block mb-1.5">
                      {schedule.plan[0].courseName}
                    </span>
                    <h3 className="text-lg md:text-xl font-black text-white leading-snug mb-2 group-hover:text-amber-50 transition-colors">
                      {schedule.plan[0].topicToLearn}
                    </h3>
                    <p className="text-xs font-medium text-zinc-500 leading-relaxed max-w-[95%] group-hover:text-zinc-400 transition-colors">
                      {schedule.plan[0].reason}
                    </p>
                  </div>

                  <div className="relative z-10 mt-5 flex items-center gap-2 text-[11px] font-black text-amber-400/80 group-hover:text-amber-300 transition-colors uppercase tracking-wider">
                    Begin <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </motion.button>
              )}

              {/* SECONDARY OBJECTIVES — Compact Grid */}
              {schedule.plan.length > 1 && (
                <div className="grid grid-cols-2 gap-3">
                  {schedule.plan.slice(1).map((task, index) => (
                    <motion.button
                      key={index}
                      whileHover={{ scale: 1.03, y: -2 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={() => handleTaskClick(task.courseId)}
                      className="group relative flex flex-col rounded-[1.2rem] border border-white/[0.05] bg-white/[0.015] p-4 text-left transition-all hover:border-white/[0.12] hover:bg-white/[0.03] overflow-hidden justify-between min-h-[120px]"
                    >
                      {/* Subtle hover glow */}
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500/[0.02] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                      
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2.5">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-white/[0.04] border border-white/[0.06] group-hover:border-amber-500/20 transition-colors">
                            <span className="text-[9px] font-black text-zinc-600 group-hover:text-amber-400 transition-colors">{index + 2}</span>
                          </div>
                        </div>
                        
                        <h3 className="text-[13px] font-black text-white/80 leading-snug group-hover:text-white transition-colors line-clamp-2 mb-2">
                          {task.topicToLearn}
                        </h3>
                        <span className="text-[9px] font-bold uppercase tracking-wider text-zinc-600 line-clamp-1 group-hover:text-zinc-500 transition-colors">
                          {task.courseName}
                        </span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        ) : (
          <div className="flex h-full items-center justify-center text-center">
            <div className="max-w-xs">
              <div className="h-14 w-14 rounded-full bg-amber-500/10 flex items-center justify-center mb-4 border border-amber-500/15 mx-auto">
                <Compass className="h-7 w-7 text-amber-400 opacity-70" />
              </div>
              <h3 className="text-base font-black text-white mb-2">No Plan Yet</h3>
              <p className="text-sm text-zinc-500">Start a guided course and your AI study plan will appear here automatically.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
