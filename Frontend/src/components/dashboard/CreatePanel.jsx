import React from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';

const options = [
  {
    title: 'Guided Study Plan',
    label: 'GUIDED',
    body: 'Start from a topic and let Cluss build a structured study path.',
    to: '/create/guided',
    accent: '#f5f5f5',
  },
  {
    title: 'YouTube Playlist',
    label: 'PLAYLIST',
    body: 'Convert a trusted playlist into daily blocks and checkpoints.',
    to: '/create/playlist',
    accent: '#FF9F1C',
  },
];

export default function CreatePanel({ open, onClose }) {
  const navigate = useNavigate();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-[1200] bg-black/70 backdrop-blur-xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          <motion.aside
            className="h-full w-full max-w-[25rem] overflow-y-auto border-r border-white/10 bg-black p-5 shadow-[30px_0_100px_rgba(0,0,0,0.62)]"
            initial={{ x: -420 }}
            animate={{ x: 0 }}
            exit={{ x: -420 }}
            transition={{ type: 'spring', stiffness: 230, damping: 28 }}
            onClick={(event) => event.stopPropagation()}
          >
        <div className="flex items-center justify-between">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-zinc-500">Create</p>
            <h2 className="mt-2 text-3xl font-black text-white">New workspace</h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-12 w-12 items-center justify-center rounded-full bg-[#1d1d1d] text-2xl leading-none text-white transition hover:bg-white hover:text-black"
          >
            x
          </button>
        </div>

        <div className="mt-8 space-y-4">
          {options.map((option, index) => (
            <motion.button
              key={option.to}
              type="button"
              onClick={() => {
                onClose();
                navigate(option.to);
              }}
              initial={{ opacity: 0, x: -18 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.08 + index * 0.06 }}
              className="group w-full overflow-hidden rounded-[2rem] border border-white/10 bg-[#171717] p-5 text-left transition hover:-translate-y-1 hover:border-white/20 hover:bg-[#202020]"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.24em]" style={{ color: option.accent }}>
                    {option.label}
                  </p>
                  <h3 className="mt-4 text-2xl font-black leading-tight text-white">{option.title}</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-500">{option.body}</p>
                </div>
                <div
                  className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-lg font-black text-black"
                  style={{ backgroundColor: option.accent }}
                >
                  {index + 1}
                </div>
              </div>
              <div className="mt-5 h-1.5 overflow-hidden rounded-full bg-white/[0.08]">
                <div className="h-full w-1/2 rounded-full transition group-hover:w-full" style={{ backgroundColor: option.accent }} />
              </div>
            </motion.button>
          ))}
        </div>

        <div className="mt-8 rounded-[1.6rem] border border-white/10 bg-[#111111] p-4">
          <p className="text-sm font-bold leading-6 text-zinc-400">
            Keep it intentional: create only when you are ready to study. Existing plans stay in the Guided and Playlist libraries.
          </p>
        </div>
          </motion.aside>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
