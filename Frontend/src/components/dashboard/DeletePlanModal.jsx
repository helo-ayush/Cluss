import React from 'react';
import ReactDOM from 'react-dom';
import { X } from 'lucide-react';

export default function DeletePlanModal({ plan, onCancel, onConfirm }) {
  if (!plan) return null;

  const modalContent = (
    <div 
      className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 px-4 backdrop-blur-xl" 
      onClick={onCancel}
    >
      <div 
        className="w-full max-w-lg rounded-[2.2rem] border border-white/10 bg-[#171717] p-7 shadow-[0_30px_90px_rgba(0,0,0,0.7)] font-nunito antialiased text-white" 
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF9F1C]">Delete study plan</p>
            <h3 className="mt-3 break-words text-2.5xl font-extrabold text-white leading-tight">{plan.course_title}</h3>
          </div>
          
          {/* Circular close button with centered Lucide X vector icon */}
          <button 
            type="button" 
            onClick={onCancel} 
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.06] text-zinc-400 hover:text-white hover:bg-white/10 hover:border-white/20 transition-all duration-200"
            title="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        
        <p className="mt-4 text-sm leading-6.5 text-zinc-400">
          This removes the plan and its saved progress from your library. Your activity history can still remain in stats.
        </p>
        
        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button 
            type="button" 
            onClick={onCancel} 
            className="rounded-full border border-white/10 bg-white/5 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-zinc-300 hover:bg-white/10 transition"
          >
            Keep it
          </button>
          <button 
            type="button" 
            onClick={onConfirm} 
            className="rounded-full bg-red-600 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white hover:bg-red-500 transition shadow-[0_0_15px_rgba(220,38,38,0.2)]"
          >
            Delete plan
          </button>
        </div>
      </div>
    </div>
  );

  return ReactDOM.createPortal(modalContent, document.body);
}
