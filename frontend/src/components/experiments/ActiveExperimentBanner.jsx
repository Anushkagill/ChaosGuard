// ============================================================
// ActiveExperimentBanner Component — Phase 7
// ============================================================

import React, { useState } from 'react';
import { Flame, Clock, StopCircle, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import Button from '../ui/Button';
import Badge from '../ui/Badge';
import { formatDuration } from '../../utils/formatters';

export function ActiveExperimentBanner({
  activeExperiment,
  remainingSec,
  countdown,
  progressPercent,
  progress,
  onStop,
}) {
  const [stopping, setStopping] = useState(false);

  if (!activeExperiment) return null;

  const seconds = remainingSec ?? countdown ?? 0;
  const percent = progressPercent ?? progress ?? 0;
  const target = activeExperiment.targetService || activeExperiment.target || 'unknown';
  const fault = activeExperiment.faultType || activeExperiment.fault || 'fault';
  const delay = activeExperiment.faultConfig?.delayMs || activeExperiment.parameters?.latencyMs;

  const isQueued = activeExperiment.status === 'QUEUED';
  const isRunning = activeExperiment.status === 'RUNNING';

  const handleStop = async () => {
    setStopping(true);
    try {
      if (onStop) {
        await onStop(activeExperiment.id);
      }
    } finally {
      setStopping(false);
    }
  };

  return (
    <div className="w-full bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/70 border-b border-blue-500/30 shadow-lg relative overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
      {/* Top progress bar */}
      <div className="w-full bg-slate-800/80 h-1">
        <div
          className="bg-gradient-to-r from-blue-500 via-sky-400 to-indigo-400 h-1 transition-all duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        {/* Left: Active info */}
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-blue-500/20 text-blue-400 border border-blue-500/30 flex-shrink-0 animate-pulse">
            <Flame className="w-5 h-5 text-amber-400" />
          </div>

          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-xs font-mono font-bold text-white uppercase tracking-wider">
                Active Chaos Experiment:
              </span>
              <span className="text-sm font-bold text-blue-300 font-mono">
                {activeExperiment.id}
              </span>
              <Badge variant={isQueued ? 'neutral' : 'running'} size="sm">
                {activeExperiment.status}
              </Badge>
              <span className="text-xs text-slate-300 font-mono">
                Target: <strong className="text-white">{target}</strong>
              </span>
              <span className="text-xs text-slate-300 font-mono">
                Fault: <strong className="text-amber-300">{fault}</strong>
                {fault === 'latency' && delay && (
                  <span className="text-slate-400"> ({delay}ms)</span>
                )}
              </span>
            </div>

            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span className="flex items-center gap-1 font-mono">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                {isQueued
                  ? 'Waiting for background BullMQ worker pickup...'
                  : `${seconds}s remaining of ${formatDuration(activeExperiment.duration)}`}
              </span>
              {isRunning && (
                <span className="text-[11px] text-emerald-400 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Fault active on container runtime
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Right: Emergency Stop control */}
        <div className="flex items-center gap-2 self-end sm:self-auto flex-shrink-0">
          <Button
            variant="danger"
            size="sm"
            onClick={handleStop}
            loading={stopping}
            icon={StopCircle}
            className="shadow-sm"
          >
            Emergency Abort
          </Button>
        </div>
      </div>
    </div>
  );
}

export default ActiveExperimentBanner;
