import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';

const STATUS_META = {
  completed: {
    label: 'Completed',
    icon: 'check_circle',
    accent: '#15803d',
    chipBg: 'rgba(21, 128, 61, 0.12)',
    border: 'rgba(21, 128, 61, 0.16)',
  },
  active: {
    label: 'In Progress',
    icon: 'play_circle',
    accent: '#4338ca',
    chipBg: 'rgba(67, 56, 202, 0.12)',
    border: 'rgba(67, 56, 202, 0.16)',
  },
  locked: {
    label: 'Locked',
    icon: 'lock',
    accent: '#64748b',
    chipBg: 'rgba(100, 116, 139, 0.12)',
    border: 'rgba(100, 116, 139, 0.16)',
  },
};

export default function TopicNode({ module, moduleIndex, courseId, status }) {
  const navigate = useNavigate();
  const meta = STATUS_META[status] || STATUS_META.locked;
  const isLocked = status === 'locked';
  const subtopics = module.subtopics || [];
  const completedCount = subtopics.filter((subtopic) => subtopic.status === 'completed').length;
  const progressPct = subtopics.length > 0 ? Math.round((completedCount / subtopics.length) * 100) : 0;

  const handleClick = () => {
    if (isLocked) return;
    navigate(`/course/${courseId}/learn/${moduleIndex}`);
  };

  return (
    <motion.button
      type="button"
      onClick={handleClick}
      disabled={isLocked}
      initial={{ opacity: 0, y: 28 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: moduleIndex * 0.06, duration: 0.45, ease: 'easeOut' }}
      className={`course-surface relative w-full overflow-hidden rounded-[2rem] p-6 text-left ${
        isLocked ? 'course-rail-item-locked' : 'cursor-pointer'
      }`}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className="absolute inset-x-0 top-0 h-28"
          style={{
            background: `linear-gradient(180deg, ${meta.chipBg}, transparent)`,
          }}
        />
        <div
          className="absolute -right-10 top-6 h-28 w-28 rounded-full blur-3xl"
          style={{ background: meta.chipBg }}
        />
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-start gap-4">
            <div
              className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[1.35rem] text-lg font-black"
              style={{
                background: meta.chipBg,
                color: meta.accent,
                border: `1px solid ${meta.border}`,
              }}
            >
              {String(moduleIndex + 1).padStart(2, '0')}
            </div>
            <div>
              <p
                className="font-label text-[11px] font-bold uppercase tracking-[0.24em]"
                style={{ color: 'rgba(15, 23, 42, 0.48)' }}
              >
                Module {moduleIndex + 1}
              </p>
              <h3
                className="mt-2 font-serif text-2xl font-semibold leading-tight md:text-[2rem]"
                style={{ color: 'var(--theme-text-heading)' }}
              >
                {module.module_title}
              </h3>
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 rounded-full px-3 py-2"
            style={{
              background: meta.chipBg,
              color: meta.accent,
              border: `1px solid ${meta.border}`,
            }}
          >
            <span className="material-symbols-outlined text-[16px]">{meta.icon}</span>
            <span className="font-label text-[11px] font-bold uppercase tracking-[0.18em]">
              {meta.label}
            </span>
          </div>
        </div>

        <p
          className="max-w-3xl font-body text-sm leading-7 md:text-[15px]"
          style={{ color: 'var(--theme-text-body)' }}
        >
          {isLocked
            ? 'Finish the previous checkpoint to unlock this module and start learning.'
            : `A guided sequence of ${subtopics.length} lesson${subtopics.length === 1 ? '' : 's'} designed to move from intuition to application.`}
        </p>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="course-surface-soft rounded-[1.35rem] px-4 py-4">
            <p
              className="font-label text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'rgba(15, 23, 42, 0.46)' }}
            >
              Lessons
            </p>
            <p className="mt-2 font-headline text-2xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
              {subtopics.length}
            </p>
          </div>

          <div className="course-surface-soft rounded-[1.35rem] px-4 py-4">
            <p
              className="font-label text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'rgba(15, 23, 42, 0.46)' }}
            >
              Completed
            </p>
            <p className="mt-2 font-headline text-2xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
              {completedCount}
            </p>
          </div>

          <div className="course-surface-soft rounded-[1.35rem] px-4 py-4">
            <p
              className="font-label text-[10px] font-bold uppercase tracking-[0.2em]"
              style={{ color: 'rgba(15, 23, 42, 0.46)' }}
            >
              Progress
            </p>
            <p className="mt-2 font-headline text-2xl font-bold" style={{ color: 'var(--theme-text-heading)' }}>
              {progressPct}%
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-2 flex items-center justify-between">
              <span
                className="font-label text-[10px] font-bold uppercase tracking-[0.2em]"
                style={{ color: 'rgba(15, 23, 42, 0.48)' }}
              >
                Module Progress
              </span>
              <span className="font-label text-xs font-bold" style={{ color: meta.accent }}>
                {progressPct}%
              </span>
            </div>
            <div className="course-progress-track">
              <div className="course-progress-fill" style={{ width: `${progressPct}%` }} />
            </div>
          </div>

          <div
            className="inline-flex items-center gap-2 self-start rounded-full px-4 py-2.5"
            style={{
              background: isLocked ? 'rgba(255, 255, 255, 0.5)' : meta.chipBg,
              color: isLocked ? 'rgba(15, 23, 42, 0.45)' : meta.accent,
            }}
          >
            <span className="font-label text-[11px] font-bold uppercase tracking-[0.18em]">
              {isLocked ? 'Locked' : status === 'completed' ? 'Review Module' : 'Open Module'}
            </span>
            <span className="material-symbols-outlined text-[16px]">
              {isLocked ? 'lock' : 'arrow_outward'}
            </span>
          </div>
        </div>
      </div>
    </motion.button>
  );
}
