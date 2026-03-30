import React from 'react';

export default function SubtopicListItem({ subtopic, index, isActive, onClick, status }) {
  const statusIcon = status === 'completed'
    ? 'check_circle'
    : isActive
    ? 'play_circle'
    : status === 'locked'
    ? 'lock'
    : 'radio_button_unchecked';

  const statusColor = status === 'completed'
    ? '#22c55e'
    : isActive
    ? '#8b5cf6'
    : status === 'locked'
    ? 'var(--theme-text-faint)'
    : 'var(--theme-text-muted)';

  const isLocked = status === 'locked';

  return (
    <div 
      className="relative w-full" 
      title={isLocked ? "Pass the previous module's quiz to unlock this lesson." : undefined}
    >
      <button
        onClick={() => !isLocked && onClick(index)}
        disabled={isLocked}
        className={`subtopic-item w-full text-left px-4 py-3 rounded-xl flex items-center gap-3 group ${
          isActive ? 'subtopic-active-item' : ''
        } ${isLocked ? 'subtopic-locked' : 'cursor-pointer'}`}
      >
        {/* Index badge */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 font-label text-xs font-bold"
          style={{
            background: isActive ? 'rgba(139,92,246,0.15)' : status === 'completed' ? 'rgba(34,197,94,0.12)' : 'var(--theme-glass-bg)',
            color: statusColor
          }}>
          {status === 'completed' ? '✓' : index + 1}
        </div>

        {/* Title */}
        <span className="flex-1 text-sm font-body truncate transition-colors"
          style={{
            color: isActive ? 'var(--theme-text-heading)' : status === 'completed' ? 'var(--theme-text-body-strong)' : 'var(--theme-text-body)',
            fontWeight: isActive ? 600 : 400
          }}>
          {subtopic.subtopic_title}
        </span>

        {/* Status icon */}
        <span className="material-symbols-outlined text-lg shrink-0 transition-colors" style={{ color: statusColor }}>
          {statusIcon}
        </span>
      </button>
    </div>
  );
}
