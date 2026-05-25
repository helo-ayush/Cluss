import React from 'react';
import { motion } from 'framer-motion';
import { Youtube, Compass, Trash2, ArrowRight, PlayCircle, BookOpen } from 'lucide-react';

export default function DarkPlanCard({ plan, onOpen, onDelete, compact = false }) {
  const isPlaylist = plan.sourceType === 'playlist';
  const label = isPlaylist ? 'Video Learning' : 'Guided Plan';
  const Icon = isPlaylist ? Youtube : Compass;
  const ProgressIcon = isPlaylist ? PlayCircle : BookOpen;
  
  const total = isPlaylist ? plan.totalDays || 0 : plan.totalSubtopics || 0;
  const done = isPlaylist ? plan.completedDays || 0 : plan.completedSubtopics || 0;
  const progress = plan.progress || 0;

  return (
    <motion.article
      initial={{ opacity: 0, y: 15 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-40px' }}
      whileHover={{ y: -6 }}
      transition={{ duration: 0.35 }}
      className="group relative flex flex-col h-full min-w-0 overflow-hidden rounded-[2.2rem] bg-[#1b1b1b] border border-white/[0.06] shadow-[0_20px_50px_rgba(0,0,0,0.5)] transition-all duration-300 hover:border-[#efff55]/30 hover:shadow-[0_20px_50px_rgba(239,255,85,0.06)] font-nunito antialiased text-white"
      onClick={() => onOpen(plan)}
      style={{ cursor: 'pointer' }}
    >
      {/* Intense Ambient Lime Glow */}
      <div 
        className="absolute -top-32 -right-32 h-64 w-64 rounded-full opacity-[0.05] blur-[80px] transition-all duration-500 group-hover:opacity-[0.12] group-hover:scale-150 pointer-events-none bg-[#efff55]" 
      />
      
      {/* Top Border Shine Effect */}
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#efff55]/30 to-transparent opacity-0 transition-opacity duration-500 group-hover:opacity-100 pointer-events-none" />
      
      <div className="relative flex flex-col h-full p-6 md:p-7.5 z-10">
        
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 mb-6 shrink-0">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/[0.05] bg-white/[0.03] px-3.5 py-1.5 backdrop-blur-md transition-all group-hover:bg-white/[0.06] group-hover:border-[#efff55]/20">
            <Icon className="h-3.5 w-3.5 text-zinc-300 group-hover:text-[#efff55] transition-colors" />
            <span className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-zinc-300 group-hover:text-white transition-colors">
              {label}
            </span>
          </div>

          {onDelete && (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onDelete(plan); }}
              className="flex h-8.5 w-8.5 items-center justify-center rounded-full border border-white/10 bg-white/5 text-zinc-500 transition-all hover:bg-red-500/10 hover:text-red-400 hover:border-red-500/20 md:opacity-0 md:group-hover:opacity-100"
              aria-label="Delete plan"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Title */}
        <h3 className={`line-clamp-3 font-extrabold leading-[1.15] tracking-tight mb-8 ${compact ? 'text-xl' : 'text-2xl'} text-white group-hover:text-[#efff55] transition-colors duration-300`}>
          {plan.course_title}
        </h3>

        {/* Bottom Section pushes to bottom */}
        <div className="mt-auto space-y-6 shrink-0">
          
          {/* Progress Details */}
          <div>
            <div className="flex items-end justify-between gap-3 mb-2.5">
              <div className="flex items-center gap-2 text-zinc-400">
                <ProgressIcon className="h-4 w-4 text-zinc-400" />
                <span className="text-[11px] font-bold uppercase tracking-wider text-zinc-400">
                  {done} / {total} {isPlaylist ? 'Days' : 'Lessons'}
                </span>
              </div>
              <span className="text-lg font-black text-white">
                {progress}%
              </span>
            </div>
            
            {/* Custom Sleek Progress Bar */}
            <div className="relative h-2 w-full overflow-hidden rounded-full bg-white/[0.04] border border-white/[0.04] shadow-inner">
              <motion.div 
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(progress, 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                className="absolute inset-y-0 left-0 rounded-full" 
                style={{ 
                  background: 'linear-gradient(90deg, #71717a, #efff55)',
                  boxShadow: '0 0 10px rgba(239, 255, 85, 0.4)'
                }} 
              />
            </div>
          </div>

          {/* Action Button */}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onOpen(plan); }}
            className="group/btn relative w-full overflow-hidden rounded-2xl bg-white/[0.03] border border-white/[0.08] px-5 py-3.5 transition-all duration-300 hover:bg-white hover:border-transparent hover:shadow-[0_10px_30px_rgba(255,255,255,0.05)]"
          >
            <div className="relative z-10 flex items-center justify-between">
              <span className="text-xs font-extrabold tracking-wider uppercase text-zinc-300 transition-colors duration-300 group-hover/btn:text-black">
                Resume Learning
              </span>
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white text-black transition-all duration-300 group-hover/btn:bg-black group-hover/btn:text-white group-hover/btn:translate-x-0.5">
                <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </div>
          </button>

        </div>
      </div>
    </motion.article>
  );
}
