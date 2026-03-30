import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const CARD_PALETTES = [
  { from: '#1e1b4b', to: '#4338ca', icon: '⚡' },
  { from: '#0f172a', to: '#3730a3', icon: '🔮' },
  { from: '#022c22', to: '#059669', icon: '🌿' },
  { from: '#2e1065', to: '#6d28d9', icon: '✨' },
  { from: '#0f172a', to: '#0284c7', icon: '🚀' },
  { from: '#3b0764', to: '#7e22ce', icon: '💎' },
];

export default function TopicNode({ module, moduleIndex, courseId, status, isLeft = true }) {
  const navigate = useNavigate();

  const isCompleted = status === 'completed';
  const isActive = status === 'active';
  const isLocked = status === 'locked';

  const palette = isActive || isCompleted 
    ? CARD_PALETTES[moduleIndex % CARD_PALETTES.length]
    : { from: '#1e293b', to: '#0f172a', icon: '🔒' };

  const subtopicCount = module.subtopics?.length || 0;
  const completedCount = module.subtopics?.filter(s => s.status === 'completed').length || 0;
  const progressPct = subtopicCount > 0 ? Math.round((completedCount / subtopicCount) * 100) : 0;

  const handleClick = () => {
    if (isLocked) return;
    navigate(`/course/${courseId}/learn/${moduleIndex}`);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95, x: isLeft ? -30 : 30, y: 15 }}
      animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
      transition={{ delay: moduleIndex * 0.1, duration: 0.5, ease: 'easeOut' }}
      onClick={handleClick}
      className={`relative w-full max-w-lg mx-auto group ${!isLocked ? 'cursor-pointer' : ''}`}
    >
      {/* Custom Tooltip for Locked Nodes */}
      {isLocked && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full mb-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none z-50 px-4 py-2.5 rounded-xl text-xs font-label font-bold tracking-wide w-max max-w-[250px] text-center shadow-xl"
             style={{ background: 'rgba(15,23,42,0.95)', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', color: 'var(--theme-text-body)' }}>
          Please complete the above topic quiz to unlock
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-[6px] border-transparent border-t-[rgba(15,23,42,0.95)]"></div>
        </div>
      )}
      <div 
        className={`relative overflow-hidden rounded-[2rem] transition-all duration-300 ${!isLocked ? 'hover:-translate-y-2' : ''}`}
        style={{
          background: `linear-gradient(145deg, ${palette.from} 0%, ${palette.to} 100%)`,
          boxShadow: isActive ? `0 16px 40px ${palette.from}50` : isCompleted ? `0 12px 32px ${palette.from}30` : '0 8px 16px rgba(0,0,0,0.2)',
          border: isActive ? `1px solid ${palette.from}90` : '1px solid rgba(255,255,255,0.05)',
          opacity: isLocked ? 0.75 : 1
        }}
      >
        {/* Subtle decorative elements matching Dashboard cards */}
        <div className="absolute inset-0" style={{
          backgroundImage: 'radial-gradient(circle at 80% 20%, rgba(255,255,255,0.08) 0%, transparent 50%)',
        }} />
        {!isLocked && <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full pointer-events-none" style={{ background: 'rgba(255,255,255,0.05)', filter: 'blur(24px)' }} />}
        <div className="absolute -bottom-10 -left-10 w-44 h-44 rounded-full pointer-events-none" style={{ background: 'rgba(0,0,0,0.2)', filter: 'blur(20px)' }} />

        {/* Large watermark number */}
        <div className={`absolute top-4 ${isLeft ? 'right-6' : 'left-6'} font-headline text-8xl italic font-black pointer-events-none select-none transition-all duration-500 group-hover:scale-110 group-hover:-translate-y-3`}
          style={{
            color: 'rgba(255,255,255,0.02)',
            WebkitTextStroke: '1px rgba(255,255,255,0.08)'
          }}>
          {String(moduleIndex + 1).padStart(2, '0')}
        </div>

        <div className="relative z-10 p-7 md:p-9 flex flex-col justify-between min-h-[240px]">
          
          {/* Header area */}
          <div>
            <div className="flex flex-wrap items-center gap-3 justify-between mb-5">
              <div className="flex items-center gap-3">
                <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl shadow-lg"
                  style={{ background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  {palette.icon}
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                {isActive && (
                  <div className="px-3.5 py-1.5 rounded-full flex items-center gap-2 shadow-sm" style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(10px)' }}>
                    <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-white">Current</span>
                  </div>
                )}
                {isCompleted && (
                  <div className="px-3.5 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm" style={{ background: 'rgba(34,197,94,0.2)', border: '1px solid rgba(34,197,94,0.3)' }}>
                    <span className="material-symbols-outlined text-[14px] text-emerald-400">check_circle</span>
                    <span className="font-label text-[10px] font-bold uppercase tracking-widest text-emerald-400">Mastered</span>
                  </div>
                )}
              </div>
            </div>

            <h3 className="font-headline text-2xl md:text-3xl font-bold text-white italic leading-tight drop-shadow-md pr-10">
              {module.module_title}
            </h3>
          </div>

          {/* Footer stats and progress */}
          <div className="mt-8">
             <div className="flex items-center justify-between mb-3.5">
               <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1.5 text-white/70 font-label text-[11px] uppercase tracking-wider font-semibold">
                    <span className="material-symbols-outlined text-[16px]">topic</span>
                    {subtopicCount} topics
                  </span>
                  {!isLocked && completedCount > 0 && (
                     <span className="flex items-center gap-1.5 text-white/90 font-label text-[11px] uppercase tracking-wider font-semibold">
                       <span className="material-symbols-outlined text-[16px]">done_all</span>
                       {completedCount} done
                     </span>
                  )}
               </div>
               {(!isLocked && progressPct > 0) && (
                 <span className="text-white font-label text-[13px] font-black tracking-wide">{progressPct}%</span>
               )}
               {isLocked && <span className="text-white/40 font-label text-[11px] uppercase tracking-widest font-black flex items-center gap-1"><span className="material-symbols-outlined text-[14px]">lock</span>Locked</span>}
             </div>

             {/* Progress Bar */}
             {!isLocked && (
               <div className="h-2 rounded-full overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)' }}>
                 <motion.div 
                   className="h-full rounded-full bg-white relative"
                   initial={{ width: 0 }}
                   animate={{ width: `${progressPct}%` }}
                   transition={{ duration: 1.2, delay: 0.3 + (moduleIndex * 0.1), ease: 'easeOut' }}
                 >
                   {isActive && <div className="absolute inset-0 bg-white opacity-40 animate-pulse"></div>}
                 </motion.div>
               </div>
             )}
          </div>

        </div>
      </div>
    </motion.div>
  );
}
