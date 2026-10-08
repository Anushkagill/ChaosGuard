// ============================================================
// Header Component — Phase 7
// ============================================================

import React from 'react';
import { ShieldAlert, Zap, Plus, Activity, RefreshCw } from 'lucide-react';
import { Button } from '../ui/Button';
import { StatusDot } from '../ui/StatusDot';
import { Badge } from '../ui/Badge';

export function Header({
  services = {},
  activeExperiment = null,
  healthyCount: propHealthyCount,
  totalCount: propTotalCount,
  faultCount: propFaultCount,
  onOpenCreateModal,
  onNewExperiment,
  onRunProbe,
  onRefresh,
  refreshing = false,
  probeRunning = false,
}) {
  const serviceList = Object.values(services);
  const totalServices = propTotalCount ?? serviceList.length;
  const healthyCount = propHealthyCount ?? serviceList.filter((s) => s.healthy && !s.activeFault).length;
  const faultedCount = propFaultCount ?? serviceList.filter((s) => s.activeFault).length;
  const handleOpenModal = onOpenCreateModal || onNewExperiment;

  const clusterState =
    totalServices === 0
      ? 'neutral'
      : faultedCount > 0
      ? 'degraded'
      : healthyCount === totalServices
      ? 'healthy'
      : 'failed';

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border-subtle bg-canvas/90 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left: Brand & Cluster Health */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-blue-500/20 border border-blue-400/30">
              <ShieldAlert className="w-5 h-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base tracking-tight text-white">ChaosGuard</span>
                <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-semibold bg-slate-800 text-slate-300 border border-slate-700">
                  v0.7.0
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400 tracking-wide">RESILIENCE & TOPOLOGY OBSERVABILITY</p>
            </div>
          </div>

          <div className="h-6 w-px bg-border-subtle mx-1 hidden sm:block" />

          {/* Cluster Health Pill */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 rounded-full bg-surface-elevated/80 border border-border-subtle text-xs font-mono">
            <StatusDot status={clusterState} pulse={faultedCount > 0} size="sm" />
            <span className="text-slate-300">
              Cluster: <strong className="text-white">{healthyCount}/{totalServices || 4}</strong> Healthy
            </span>
            {faultedCount > 0 && (
              <span className="ml-1 px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-400 text-[10px] border border-amber-500/30">
                {faultedCount} Chaos Active
              </span>
            )}
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2.5">
          <button
            onClick={onRefresh}
            title="Refresh Cluster State"
            disabled={refreshing}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 border border-transparent hover:border-slate-700 transition-colors"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin text-blue-400' : ''}`} />
          </button>

          <Button
            variant="outline"
            size="sm"
            onClick={onRunProbe}
            loading={probeRunning}
            icon={Zap}
            className="text-amber-400 border-amber-500/30 hover:bg-amber-500/10 hover:border-amber-500/50"
          >
            Test Order Probe
          </Button>

          <Button
            variant="primary"
            size="sm"
            onClick={handleOpenModal}
            icon={Plus}
          >
            New Experiment
          </Button>
        </div>
      </div>
    </header>
  );
}

export default Header;
