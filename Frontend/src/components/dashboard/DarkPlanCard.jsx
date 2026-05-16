import React from 'react';
import { motion } from 'motion/react';
import { Youtube, Compass, Trash2, ArrowRight, PlayCircle, BookOpen } from 'lucide-react';

export default function DarkPlanCard({ plan, onOpen, onDelete, compact = false }) {
  const isPlaylist = plan.sourceType === 'playlist';
  const accent = '#ffffff'; // Pure bright white for intense contrast
  const label = isPlaylist ? 'Video Learning' : 'Guided Plan';
  const Icon = isPlaylist ? Youtube : Compass;
  const ProgressIcon = isPlaylist ? PlayCircle : BookOpen;
  
  const total = isPlaylist ? plan.totalDays || 0 : plan.totalSubtopics || 0;
  const done = isPlaylist ? plan.completedDays || 0 : plan.completedSubtopics || 0;
  const progress = plan.progress || 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      whileHover={{ y: -8, scale: 1.02 }}
      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
      className="group relative flex flex-col min-w-0 overflow-hidden rounded-[2.4rem] bg-gradient-to-b from-[#1a1a1a] to-[#0a0a0a] border border-white/10 shadow-[0_20px_60px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-white/30 hover:shadow-[0_30px_80px_rgba(255,255,255,0.1)]"
      onClick={() => onOpen(plan)}
      style={{ cursor: 'pointer' }}
    >
      {/* Intense Ambient White Glow */}
      <div 
        className="absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-[0.25] blur-[80px] transition-all duration-500 group-hover:opacity-[0.4] group-hover:scale-150 pointer-events-none" 
        style={{ backgroundColor: accent }} 
      />
      
      {/* Top Border Shine Effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/50 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      
      <div className="relative flex flex-col h-full p-6 md:p-8 z-10">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1.5 backdrop-blur-md shadow-[0_0_15px_rgba(255,255,255,0.1)] transition-all group-hover:bg-white/15">
            <Icon className="h-3.5 w-3.5 text-white" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">
              {label}
            </span>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(plan); }}
              className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-400 opacity-100 transition-all hover:bg-red-500 hover:text-white hover:border-red-500 hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] md:opacity-0 md:group-hover:opacity-100"
              aria-label="Delete plan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className={`line-clamp-3 font-black leading-[1.1] tracking-tight mb-8 ${compact ? 'text-2xl' : 'text-3xl'} text-transparent bg-clip-text bg-gradient-to-r from-white to-white group-hover:to-zinc-400 transition-all duration-300`}>
          {plan.course_title}
        </h3>

        {/* Bottom Section pushes to bottom */}
        <div className="mt-auto space-y-6">
          
          {/* Progress Details */}
          <div>
            <div className="flex items-end justify-between gap-3 mb-3">
              <div className="flex items-center gap-2 text-zinc-300">
                <ProgressIcon className="h-4 w-4 text-white" />
                <span className="text-[11px] font-black uppercase tracking-wider text-white">
                  {done} / {total} {isPlaylist ? 'Days' : 'Lessons'}
                </span>
              </div>
              <span className="text-xl font-black text-white drop-shadow-[0_0_8px_rgba(255,255,255,0.5)]">
                {progress}%
              </span>
            </div>
            
            {/* Custom Sleek Progress Bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-black border border-white/10 shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(progress, 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="absolute inset-y-0 left-0 rounded-full" 
                style={{ 
                  background: `linear-gradient(90deg, #71717a, #ffffff)`,
                  boxShadow: `0 0 12px rgba(255,255,255,0.8)`
                }} 
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(plan); }}
            className="group/btn relative w-full overflow-hidden rounded-2xl bg-white/[0.05] border border-white/10 px-5 py-4 transition-all duration-300 hover:bg-white hover:border-white hover:shadow-[0_0_30px_rgba(255,255,255,0.3)]"
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

        </div>
      </div>
    </motion.article>
  );
}
