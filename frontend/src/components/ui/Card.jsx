// ============================================================
// Card Component — Phase 7
// ============================================================

import React from 'react';
import clsx from 'clsx';

export function Card({
  children,
  className = '',
  elevated = false,
  glow = null, // 'healthy' | 'degraded' | 'failed' | 'running'
  onClick,
  ...props
}) {
  const glowClasses = {
    healthy: 'glow-healthy border-emerald-500/40',
    degraded: 'glow-degraded border-amber-500/40',
    failed: 'glow-failed border-rose-500/50',
    running: 'glow-running border-sky-500/40',
  };

  return (
    <div
      onClick={onClick}
      className={clsx(
        'rounded-xl border transition-all duration-200',
        elevated ? 'bg-surface-elevated' : 'bg-surface',
        glow ? glowClasses[glow] : 'border-border-subtle hover:border-border-hover',
        onClick && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({ title, subtitle, icon: Icon, action, className = '' }) {
  return (
    <div className={clsx('flex items-center justify-between p-4 border-b border-border-subtle/80', className)}>
      <div className="flex items-center gap-2.5">
        {Icon && (
          <div className="p-1.5 rounded-md bg-slate-800/80 text-blue-400 border border-slate-700/50">
            <Icon className="w-4 h-4" />
          </div>
        )}
        <div>
          <h3 className="text-sm font-semibold text-text-primary tracking-tight">{title}</h3>
          {subtitle && <p className="text-xs text-text-secondary">{subtitle}</p>}
        </div>
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

export default Card;
