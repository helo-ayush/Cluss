import React from 'react';

const STATUS_META = {
  completed: {
    icon: 'check_circle',
    accent: '#15803d',
    chipBg: 'rgba(21, 128, 61, 0.12)',
  },
  active: {
    icon: 'play_circle',
    accent: '#4338ca',
    chipBg: 'rgba(67, 56, 202, 0.14)',
  },
  locked: {
    icon: 'lock',
    accent: '#64748b',
    chipBg: 'rgba(100, 116, 139, 0.12)',
  },
  pending: {
    icon: 'radio_button_unchecked',
    accent: '#334155',
    chipBg: 'rgba(148, 163, 184, 0.14)',
  },
};

export default function SubtopicListItem({ subtopic, index, isActive, onClick, status }) {
  const meta = STATUS_META[status] || STATUS_META.pending;
  const isLocked = status === 'locked';

  return (
    <button
      type="button"
      onClick={() => !isLocked && onClick(index)}
      disabled={isLocked}
      title={isLocked ? "Pass the previous module's quiz to unlock this lesson." : undefined}
      className={`course-rail-item flex items-center gap-3 ${
        isActive ? 'course-rail-item-active' : ''
      } ${isLocked ? 'course-rail-item-locked' : 'cursor-pointer'}`}
    >
      <div
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-2xl"
        style={{
          background: isActive ? 'rgba(255, 255, 255, 0.12)' : meta.chipBg,
          color: isActive ? '#ffffff' : meta.accent,
        }}
      >
        {status === 'completed' ? (
          <span className="material-symbols-outlined text-[18px]">check</span>
        ) : (
          <span className="font-label text-xs font-bold">{String(index + 1).padStart(2, '0')}</span>
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p
          className="truncate font-body text-sm font-semibold"
          style={{ color: isActive ? '#ffffff' : 'var(--theme-text-heading)' }}
        >
          {subtopic.subtopic_title}
        </p>
        <p
          className="mt-1 font-label text-[10px] font-bold uppercase tracking-[0.18em]"
          style={{ color: isActive ? 'rgba(255, 255, 255, 0.68)' : 'rgba(15, 23, 42, 0.44)' }}
        >
          {status === 'completed'
            ? 'Completed'
            : status === 'locked'
            ? 'Locked'
            : isActive
            ? 'Now Playing'
            : 'Ready'}
        </p>
      </div>

      <span
        className="material-symbols-outlined shrink-0 text-[18px]"
        style={{ color: isActive ? '#ffffff' : meta.accent }}
      >
        {meta.icon}
      </span>
    </button>
  );
}
