// ============================================================
// Navigation Tabs Component — Phase 7
// ============================================================

import React from 'react';
import { Network, Server, FlaskConical, Terminal } from 'lucide-react';
import clsx from 'clsx';

const TABS = [
  { id: 'topology', label: 'Topology & Overview', icon: Network },
  { id: 'services', label: 'Services Catalog', icon: Server },
  { id: 'experiments', label: 'Experiments & Audit', icon: FlaskConical },
  { id: 'events', label: 'System Events', icon: Terminal },
];

export function Navigation({
  activeTab,
  currentTab,
  onChangeTab,
  onTabChange,
  experimentsCount,
  counts = {},
}) {
  const current = currentTab || activeTab || 'topology';
  const handleChange = onTabChange || onChangeTab || (() => {});
  const expCount = counts.experiments ?? experimentsCount ?? 0;

  return (
    <div className="border-b border-border-subtle bg-surface/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto" aria-label="Tabs">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = current === tab.id;

            return (
              <button
                key={tab.id}
                onClick={() => handleChange(tab.id)}
                className={clsx(
                  'flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-all whitespace-nowrap cursor-pointer',
                  isActive
                    ? 'bg-blue-600/15 text-blue-400 border border-blue-500/30 shadow-sm'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40 border border-transparent'
                )}
              >
                <Icon className={clsx('w-4 h-4', isActive ? 'text-blue-400' : 'text-slate-400')} />
                <span>{tab.label}</span>
                {tab.id === 'experiments' && expCount > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-300 border border-slate-700">
                    {expCount}
                  </span>
                )}
                {tab.id === 'events' && counts.events > 0 && (
                  <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] font-mono bg-slate-800 text-slate-400 border border-slate-700/60">
                    {counts.events}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </div>
  );
}

export default Navigation;
