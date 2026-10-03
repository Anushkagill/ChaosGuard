import React from 'react';
import Modal from '../ui/Modal';
import Badge from '../ui/Badge';
import Button from '../ui/Button';
import { formatTimestamp, formatDuration, getStatusBadgeVariant } from '../../utils/formatters';
import { ShieldCheck, AlertCircle, Clock, Zap, Server, CheckCircle2, Square } from 'lucide-react';

export default function ExperimentDetailModal({
  experiment,
  isOpen = false,
  onClose,
  onStop,
}) {
  if (!isOpen || !experiment) return null;

  const {
    id,
    targetService,
    faultType,
    faultConfig = {},
    duration,
    status,
    jobId,
    createdAt,
    queuedAt,
    startedAt,
    completedAt,
    error,
    failedReason,
    progress,
    safetyAudit,
  } = experiment;

  const isCleared = safetyAudit?.faultCleared ?? progress?.faultCleared ?? (status === 'COMPLETED');
  const isRunning = status === 'RUNNING' || status === 'QUEUED';

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Experiment Audit: ${id}`}
      maxWidth="max-w-2xl"
    >
      <div className="space-y-6">
        {/* Top summary row */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-4 rounded-xl bg-slate-950/60 border border-slate-800">
          <div className="flex items-center gap-3">
            <span className="p-2 rounded-lg bg-slate-800 border border-slate-700/60 text-indigo-400">
              <Server className="w-5 h-5" />
            </span>
            <div>
              <div className="text-xs font-mono text-slate-400">TARGET SERVICE</div>
              <div className="text-base font-bold text-slate-100 font-mono">
                {targetService}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Badge variant={getStatusBadgeVariant(status)} className="text-xs px-2.5 py-1">
              {status}
            </Badge>
          </div>
        </div>

        {/* Safety Audit Banner */}
        <div>
          <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Safety Cleanup Audit</h4>
          {status === 'COMPLETED' || isCleared ? (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-800/50 text-emerald-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <ShieldCheck className="w-5 h-5 text-emerald-400" />
                <span>Automated Cleanup Verified (faultCleared: true)</span>
              </div>
              <p className="text-xs text-emerald-400/90 leading-relaxed pl-7">
                The experiment worker verified that the chaos fault was cleanly evicted from the target service's in-memory fault registry. The target returned to 100% nominal operation.
              </p>
            </div>
          ) : isRunning ? (
            <div className="p-4 rounded-xl bg-amber-950/40 border border-amber-800/50 text-amber-300 space-y-1">
              <div className="flex items-center gap-2 font-bold text-sm">
                <Zap className="w-5 h-5 text-amber-400 animate-pulse" />
                <span>Fault Injection Active (Scheduled Cleanup Pending)</span>
              </div>
              <p className="text-xs text-amber-400/90 leading-relaxed pl-7">
                Fault is currently active on {targetService}. The worker will automatically trigger DELETE /internal/faults upon timer expiration ({duration}s).
              </p>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-400 text-xs">
              Cleanup status will be audited once experiment reaches execution phase.
            </div>
          )}
        </div>

        {/* Configuration & Parameters */}
        <div className="grid grid-cols-2 gap-4 text-xs font-mono">
          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px]">FAULT SPECIFICATION</span>
            <div className="text-sm font-bold text-amber-400 uppercase">
              {faultType}
            </div>
            <div className="text-slate-300 text-[11px]">
              {faultType === 'latency'
                ? `Delay: ${faultConfig.delayMs || 3000} ms`
                : faultType === 'error'
                ? `HTTP Status: ${faultConfig.statusCode || 500}`
                : 'Connection Terminated'}
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 space-y-1">
            <span className="text-slate-400 block text-[10px]">BULLMQ WORKER QUEUE</span>
            <div className="text-sm font-bold text-indigo-400">
              Job ID: {jobId || 'N/A'}
            </div>
            <div className="text-slate-300 text-[11px]">
              Queue: experiments-queue
            </div>
          </div>
        </div>

        {/* Lifecycle Timings */}
        <div>
          <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Lifecycle Milestones</h4>
          <div className="space-y-2 p-3.5 rounded-xl bg-slate-950/50 border border-slate-800 font-mono text-xs">
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Created:</span>
              <span className="text-slate-200">{formatTimestamp(createdAt)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Enqueued into BullMQ:</span>
              <span className="text-slate-200">{formatTimestamp(queuedAt)}</span>
            </div>
            <div className="flex justify-between items-center py-1 border-b border-slate-800/60">
              <span className="text-slate-400">Worker Activated Fault:</span>
              <span className="text-slate-200">{formatTimestamp(startedAt)}</span>
            </div>
            <div className="flex justify-between items-center py-1">
              <span className="text-slate-400">Completed &amp; Restored:</span>
              <span className="text-slate-200">{formatTimestamp(completedAt)}</span>
            </div>
          </div>
        </div>

        {/* Failure reason if any */}
        {(failedReason || error) && (
          <div className="p-3.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-rose-300 text-xs font-mono space-y-1">
            <span className="font-bold flex items-center gap-1.5 text-rose-400">
              <AlertCircle className="w-4 h-4" /> Failure Details
            </span>
            <p className="opacity-90">{failedReason || error}</p>
          </div>
        )}

        {/* Modal Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-slate-800">
          <div>
            {isRunning && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => {
                  onStop(id);
                  onClose();
                }}
                className="flex items-center gap-1.5"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
                Emergency Abort
              </Button>
            )}
          </div>
          <Button variant="secondary" size="sm" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </Modal>
  );
}
