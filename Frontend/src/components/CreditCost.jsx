import React from 'react';

export default function CreditCost({ cost, className = '' }) {
  if (!cost) return null;
  return (
    <span className={`inline-flex items-center gap-1 font-bold text-amber-500 ${className}`}>
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-[1.1em] w-[1.1em]">
        <path d="M13 2L4.09 12.5h6.41L9 22l8.91-10.5h-6.41L13 2z"/>
      </svg>
      {cost}
    </span>
  );
}
