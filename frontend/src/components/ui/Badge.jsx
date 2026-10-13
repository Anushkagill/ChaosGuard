// ============================================================
// Badge Component — Phase 7
// ============================================================

import React from 'react';
import clsx from 'clsx';

const VARIANTS = {
  healthy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
  degraded: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
  failed: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
  running: 'bg-sky-500/10 text-sky-400 border-sky-500/30',
  neutral: 'bg-slate-500/10 text-slate-400 border-slate-500/30',
  primary: 'bg-blue-500/10 text-blue-400 border-blue-500/30',
};

export function Badge({ children, variant = 'neutral', className = '', size = 'md' }) {
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-[10px]' : 'px-2.5 py-1 text-xs';
  const variantClass = VARIANTS[variant] || VARIANTS.neutral;

  return (
    <span
      className={clsx(
        'inline-flex items-center gap-1.5 font-mono uppercase tracking-wider font-semibold rounded-full border',
        sizeClasses,
        variantClass,
        className
      )}
    >
      {children}
    </span>
  );
}

export default Badge;
