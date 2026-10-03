import React, { useState } from 'react';
import Card from '../ui/Card';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatTimestamp, formatDuration, getStatusBadgeVariant } from '../../utils/formatters';
import { ShieldCheck, Play, Square, Eye, Zap, AlertCircle, RefreshCw, Plus } from 'lucide-react';

export default function ExperimentList({
  experiments = [],
  isLoading = false,
  onRefresh,
  onStartExperiment,
  onStopExperiment,
  onSelectExperiment,
  onCreateExperiment,
}) {
  const [filter, setFilter] = useState('ALL');

  const filteredExperiments = experiments.filter((exp) => {
    if (filter === 'ALL') return true;
    return exp.status === filter;
  });

  return (
    <Card className="overflow-hidden border-slate-800">
      {/* Table Toolbar */}
      <div className="p-4 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4 bg-slate-900/50">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-slate-100">
            Experiment History &amp; Safety Audit
          </span>
          <span className="text-xs font-mono text-slate-400">
            ({filteredExperiments.length} records)
          </span>
        </div>

        {/* Status Filters */}
        <div className="flex items-center gap-2">
          <div className="flex items-center p-1 rounded-lg bg-slate-950 border border-slate-800 text-xs font-mono">
            {['ALL', 'RUNNING', 'COMPLETED', 'FAILED', 'PENDING'].map((statusKey) => (
              <button
                key={statusKey}
                onClick={() => setFilter(statusKey)}
                className={`px-2.5 py-1 rounded-md transition-all ${
                  filter === statusKey
                    ? 'bg-slate-800 text-slate-100 font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {statusKey}
              </button>
            ))}
          </div>

          <Button
            size="sm"
            variant="secondary"
            onClick={onRefresh}
            disabled={isLoading}
            className="flex items-center gap-1 text-xs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>

          <Button
            size="sm"
            variant="primary"
            onClick={onCreateExperiment}
            className="flex items-center gap-1 text-xs shadow-glow-indigo"
          >
            <Plus className="w-3.5 h-3.5" />
            New Experiment
          </Button>
        </div>
      </div>

      {/* Table Content */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs font-mono">
          <thead className="bg-slate-950/70 border-b border-slate-800 text-slate-400 uppercase tracking-wider text-[10px]">
            <tr>
              <th className="py-3 px-4">Experiment ID</th>
              <th className="py-3 px-4">Target Service</th>
              <th className="py-3 px-4">Fault Type</th>
              <th className="py-3 px-4">Duration</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Safety Audit</th>
              <th className="py-3 px-4">Created At</th>
              <th className="py-3 px-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/60 bg-slate-900/30">
            {filteredExperiments.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-slate-400 font-sans">
                  <div className="flex flex-col items-center justify-center space-y-2">
                    <Zap className="w-8 h-8 text-slate-600" />
                    <p className="text-sm font-medium text-slate-400">
                      No experiments found matching current filter.
                    </p>
                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={onCreateExperiment}
                      className="mt-2 text-xs"
                    >
                      Create First Experiment
                    </Button>
                  </div>
                </td>
              </tr>
            ) : (
              filteredExperiments.map((exp) => {
                const isCleared = exp.safetyAudit?.faultCleared ?? exp.progress?.faultCleared ?? (exp.status === 'COMPLETED');
                const isRunning = exp.status === 'RUNNING' || exp.status === 'QUEUED';
                const isPending = exp.status === 'PENDING';

                return (
                  <tr
                    key={exp.id}
                    onClick={() => onSelectExperiment && onSelectExperiment(exp)}
                    className="hover:bg-slate-800/40 cursor-pointer transition-colors"
                  >
                    {/* ID */}
                    <td className="py-3 px-4 text-slate-200 font-bold">
                      {exp.id}
                    </td>

                    {/* Target */}
                    <td className="py-3 px-4">
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700/60">
                        {exp.targetService}
                      </span>
                    </td>

                    {/* Fault Type */}
                    <td className="py-3 px-4">
                      <span className={`px-2 py-0.5 rounded font-bold uppercase ${
                        exp.faultType === 'latency'
                          ? 'bg-amber-950/60 text-amber-300 border border-amber-800/50'
                          : 'bg-rose-950/60 text-rose-300 border border-rose-800/50'
                      }`}>
                        {exp.faultType}
                        {exp.faultType === 'latency' && exp.faultConfig?.delayMs && (
                          <span className="font-normal lowercase ml-1">
                            ({exp.faultConfig.delayMs}ms)
                          </span>
                        )}
                      </span>
                    </td>

                    {/* Duration */}
                    <td className="py-3 px-4 text-slate-300">
                      {exp.duration}s
                    </td>

                    {/* Status */}
                    <td className="py-3 px-4">
                      <Badge variant={getStatusBadgeVariant(exp.status)}>
                        {exp.status}
                      </Badge>
                    </td>

                    {/* Safety Cleanup Audit */}
                    <td className="py-3 px-4">
                      {exp.status === 'COMPLETED' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-400 bg-emerald-950/50 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                          <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                          faultCleared: true
                        </span>
                      ) : exp.status === 'RUNNING' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-400 bg-amber-950/50 border border-amber-800/40 px-2 py-0.5 rounded-full animate-pulse">
                          <Zap className="w-3.5 h-3.5" />
                          active fault
                        </span>
                      ) : exp.status === 'FAILED' ? (
                        <span className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full ${
                          isCleared
                            ? 'text-emerald-400 bg-emerald-950/50 border border-emerald-800/40'
                            : 'text-rose-400 bg-rose-950/50 border border-rose-800/40'
                        }`}>
                          {isCleared ? 'faultCleared: true' : 'faultCleared: false'}
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">&mdash;</span>
                      )}
                    </td>

                    {/* Created At */}
                    <td className="py-3 px-4 text-slate-400 text-[11px]">
                      {formatTimestamp(exp.createdAt)}
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right space-x-2" onClick={(e) => e.stopPropagation()}>
                      {isPending && (
                        <Button
                          size="sm"
                          variant="primary"
                          className="text-[11px] py-1 px-2.5"
                          onClick={() => onStartExperiment(exp.id)}
                        >
                          <Play className="w-3 h-3 fill-current inline mr-1" />
                          Start
                        </Button>
                      )}

                      {isRunning && (
                        <Button
                          size="sm"
                          variant="danger"
                          className="text-[11px] py-1 px-2.5"
                          onClick={() => onStopExperiment(exp.id)}
                        >
                          <Square className="w-3 h-3 fill-current inline mr-1" />
                          Stop
                        </Button>
                      )}

                      <Button
                        size="sm"
                        variant="secondary"
                        className="text-[11px] py-1 px-2 text-slate-400 hover:text-slate-200"
                        onClick={() => onSelectExperiment(exp)}
                      >
                        <Eye className="w-3.5 h-3.5" />
                      </Button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
