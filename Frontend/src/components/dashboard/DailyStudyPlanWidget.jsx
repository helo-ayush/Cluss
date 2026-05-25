import React, { useEffect, useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { Compass, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000';

export default function DailyStudyPlanWidget() {
  const { getToken, userId } = useAuth();
  const navigate = useNavigate();
  const [schedule, setSchedule] = useState(null);
  const [loading, setLoading] = useState(true);
  const [completedStops, setCompletedStops] = useState({});

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
      navigate(`/dashboard/guided/study-plan/${courseId}`);
    } else {
      navigate(`/dashboard/guided`);
    }
  };

  const toggleStop = (index, e) => {
    e.stopPropagation();
    setCompletedStops(prev => ({
      ...prev,
      [index]: !prev[index]
    }));
  };

  // Mock static time slots for delivery stops timeline aesthetic
  const mockTimeSlots = [
    { start: "09:00", end: "10:15", saveBadge: "Save 15 min" },
    { start: "10:45", end: "12:00", saveBadge: "Save 20 min" },
    { start: "13:30", end: "14:45", saveBadge: "On Track" },
    { start: "15:15", end: "16:30", saveBadge: "Fastest path" },
  ];

  return (
    <motion.section 
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.45 }}
      whileHover={{ y: -2 }}
      className="h-[25.5rem] flex flex-col rounded-[2rem] border border-white/[0.06] bg-[#1b1b1b] p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] hover:shadow-[0_20px_50px_rgba(0,0,0,0.7)] transition-all duration-300 font-nunito antialiased text-white" 
      id="timeline"
    >
      {/* Header inside stops container */}
      <div className="flex items-center justify-between gap-4 pb-3 border-b border-white/[0.04] shrink-0">
        <h2 className="text-sm font-bold text-white tracking-tight">Today's Aim</h2>
      </div>

      {loading ? (
        <div className="flex-1 flex flex-col gap-4 py-6 animate-pulse mt-4">
          <div className="h-4 w-1/2 rounded bg-white/5" />
          <div className="h-16 w-full rounded-2xl bg-white/5" />
          <div className="h-16 w-full rounded-2xl bg-white/5" />
        </div>
      ) : schedule && schedule.plan && schedule.plan.length > 0 ? (
        <div className="flex-1 overflow-y-auto custom-scroll pr-1 mt-4 min-h-0">
          <div className="relative">
            {/* The vertical timeline track */}
            <div 
              className="absolute left-2.5 top-2 bottom-8 w-px border-l border-dashed"
              style={{ borderColor: 'rgba(239, 255, 85, 0.6)' }}
            />

            <div className="space-y-6 relative">
              {schedule.plan.map((task, index) => {
                const isCompleted = !!completedStops[index];
                const slot = mockTimeSlots[index % mockTimeSlots.length];

                return (
                  <div 
                    key={index}
                    onClick={() => handleTaskClick(task.courseId)}
                    className="group relative flex items-start gap-5 cursor-pointer pl-6 transition"
                  >
                    {/* Node Dot Indicator on track */}
                    <div 
                      onClick={(e) => toggleStop(index, e)}
                      className="absolute left-1.5 top-1.5 h-2.5 w-2.5 rounded-full border border-black transition-all duration-300 z-10 group-hover:scale-125"
                      style={{ 
                        backgroundColor: isCompleted ? '#34d399' : '#efff55',
                        boxShadow: isCompleted 
                          ? '0 0 8px rgba(52, 211, 153, 0.4)' 
                          : '0 0 8px rgba(239, 255, 85, 0.5)'
                      }}
                    />

                    {/* Timeline stops card details with micro-animation hover slide */}
                    <div className="flex-1 flex items-start justify-between gap-4 group-hover:translate-x-1.5 transition-transform duration-300">
                      <div className="space-y-1.5 min-w-0">
                        {/* Time slot metadata */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
                            {slot.start} - {slot.end}
                          </span>
                          {isCompleted && (
                            <span 
                              className="px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider border"
                              style={{
                                backgroundColor: 'rgba(52, 211, 153, 0.12)',
                                color: '#34d399',
                                borderColor: 'rgba(52, 211, 153, 0.15)'
                              }}
                            >
                              Finished
                            </span>
                          )}
                        </div>

                        {/* Title of stop (Topic to learn) */}
                        <h4 
                          className="text-[13.5px] font-extrabold leading-relaxed transition-colors duration-250 text-white"
                          style={{
                            color: isCompleted ? '#71717a' : '#ffffff',
                            textDecoration: isCompleted ? 'line-through' : 'none'
                          }}
                        >
                          {task.topicToLearn}
                        </h4>

                        {/* Sub-text (Course name) */}
                        <p className="text-xs text-zinc-400 font-semibold truncate">
                          {task.courseName}
                        </p>
                      </div>

                      {/* Circle checkbox status indicator */}
                      <button
                        type="button"
                        onClick={(e) => toggleStop(index, e)}
                        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border transition duration-250"
                        style={{
                          borderColor: isCompleted ? '#34d399' : 'rgba(255,255,255,0.1)',
                          backgroundColor: isCompleted ? 'rgba(52, 211, 153, 0.1)' : 'transparent',
                          color: isCompleted ? '#34d399' : '#71717a'
                        }}
                      >
                        {isCompleted ? (
                          <CheckCircle className="h-3.5 w-3.5 fill-current" />
                        ) : (
                          <span className="h-1.5 w-1.5 rounded-full bg-transparent border border-zinc-650 transition" />
                        )}
                      </button>
                    </div>

                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex flex-col justify-center items-center py-8 text-center text-xs text-zinc-400">
          No focus agenda scheduled for today. Start a plan to dispatch nodes!
        </div>
      )}
    </motion.section>
  );
}
