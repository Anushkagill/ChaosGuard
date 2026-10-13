// ============================================================
// Button Component — Phase 7
// ============================================================

import React from 'react';
import clsx from 'clsx';
import { Loader2 } from 'lucide-react';

const VARIANTS = {
  primary: 'bg-blue-600 hover:bg-blue-500 text-white font-medium shadow-sm hover:shadow-blue-500/20 active:bg-blue-700 border border-blue-500/40',
  secondary: 'bg-surface-elevated hover:bg-slate-700 text-slate-200 border border-border-subtle hover:border-border-hover',
  danger: 'bg-rose-600/90 hover:bg-rose-500 text-white font-medium border border-rose-500/30 hover:shadow-rose-500/20',
  ghost: 'bg-transparent hover:bg-slate-800/60 text-slate-400 hover:text-slate-100 border border-transparent',
  outline: 'bg-transparent border border-border-subtle hover:border-border-hover text-slate-300 hover:text-white',
};

const SIZES = {
  sm: 'px-2.5 py-1.5 text-xs rounded',
  md: 'px-3.5 py-2 text-sm rounded-md',
  lg: 'px-5 py-2.5 text-base rounded-lg',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  ...props
}) {
  return (
    <button
      disabled={disabled || loading}
      className={clsx(
        'inline-flex items-center justify-center gap-2 font-medium transition-all duration-150 select-none cursor-pointer',
        'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
        VARIANTS[variant] || VARIANTS.primary,
        SIZES[size] || SIZES.md,
        className
      )}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" />
      ) : Icon ? (
        <Icon className="w-4 h-4 flex-shrink-0" />
      ) : null}
      {children}
    </button>
  );
}

export default Button;
