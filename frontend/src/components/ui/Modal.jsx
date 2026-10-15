// ============================================================
// Modal Component — Phase 7
// ============================================================

import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import clsx from 'clsx';

export function Modal({ isOpen, onClose, title, description, icon: Icon, children, maxWidth = 'max-w-lg' }) {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/75 backdrop-blur-sm transition-opacity duration-200"
      />

      {/* Dialog Window */}
      <div
        className={clsx(
          'relative w-full rounded-2xl bg-surface-elevated border border-border-hover shadow-2xl z-10 overflow-hidden animate-in fade-in zoom-in-95 duration-150',
          maxWidth
        )}
      >
        {/* Header */}
        <div className="flex items-start justify-between p-5 border-b border-border-subtle bg-slate-900/40">
          <div className="flex items-center gap-3">
            {Icon && (
              <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 border border-blue-500/20">
                <Icon className="w-5 h-5" />
              </div>
            )}
            <div>
              <h2 className="text-base font-semibold text-text-primary tracking-tight">{title}</h2>
              {description && <p className="text-xs text-text-secondary mt-0.5">{description}</p>}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
}

export default Modal;
