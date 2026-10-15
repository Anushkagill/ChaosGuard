// ============================================================
// StatusDot Component — Phase 7
// ============================================================

import React from 'react';
import clsx from 'clsx';

const COLORS = {
  healthy: 'bg-emerald-400',
  degraded: 'bg-amber-400',
  failed: 'bg-rose-400',
  running: 'bg-sky-400',
  neutral: 'bg-slate-500',
};

const PING_COLORS = {
  healthy: 'bg-emerald-400/75',
  degraded: 'bg-amber-400/75',
  failed: 'bg-rose-400/75',
  running: 'bg-sky-400/75',
  neutral: 'bg-slate-400/50',
};

export function StatusDot({ status = 'neutral', pulse = true, size = 'md', className = '' }) {
  const sizeClasses = size === 'sm' ? 'w-2 h-2' : size === 'lg' ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5';
  const color = COLORS[status] || COLORS.neutral;
  const pingColor = PING_COLORS[status] || PING_COLORS.neutral;

  return (
    <span className={clsx('relative inline-flex flex-shrink-0 items-center justify-center', sizeClasses, className)}>
      {pulse && (
        <span
          className={clsx(
            'animate-ping absolute inline-flex h-full w-full rounded-full opacity-75',
            pingColor
          )}
        />
      )}
      <span className={clsx('relative inline-flex rounded-full', sizeClasses, color)} />
    </span>
  );
}

export default StatusDot;
