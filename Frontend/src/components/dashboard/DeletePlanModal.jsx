import React from 'react';

export default function DeletePlanModal({ plan, onCancel, onConfirm }) {
  if (!plan) return null;

  return (
    <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/70 px-4 backdrop-blur-xl" onClick={onCancel}>
      <div className="w-full max-w-lg rounded-[2rem] border border-white/10 bg-[#171717] p-6 shadow-[0_30px_90px_rgba(0,0,0,0.55)]" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-[11px] font-black uppercase tracking-[0.24em] text-[#FF9F1C]">Delete study plan</p>
            <h3 className="mt-3 break-words text-3xl font-black text-white">{plan.course_title}</h3>
          </div>
          <button type="button" onClick={onCancel} className="flex h-10 w-10 items-center justify-center rounded-full bg-white/[0.08] text-zinc-400 hover:text-white">
            x
          </button>
        </div>
        <p className="mt-4 text-sm leading-7 text-zinc-400">
          This removes the plan and its saved progress from your library. Your activity history can still remain in stats.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} className="rounded-full border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-zinc-300">
            Keep it
          </button>
          <button type="button" onClick={onConfirm} className="rounded-full bg-red-500 px-5 py-3 text-sm font-black text-white">
            Delete plan
          </button>
        </div>
      </div>
    </div>
  );
}
