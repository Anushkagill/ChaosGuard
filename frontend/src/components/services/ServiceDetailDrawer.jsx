import React, { useEffect } from 'react';
import { X, Server, Zap, Globe, Activity, ShieldCheck, ArrowRight, CornerDownRight, Trash2 } from 'lucide-react';
import Button from '../ui/Button';
import StatusDot from '../ui/StatusDot';
import Badge from '../ui/Badge';
import { clearServiceFault } from '../../api/services';

export default function ServiceDetailDrawer({
  service,
  isOpen = false,
  onClose,
  onInjectFault,
  onFaultCleared,
}) {
  // Close drawer on Escape
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !service) return null;

  const {
    id,
    name,
    displayName,
    port,
    role,
    status = 'healthy',
    responseTime,
    fault,
    endpoints = [],
    dependencies = {},
  } = service;

  const hasFault = fault?.active;

  const handleClearFault = async () => {
    try {
      await clearServiceFault(id);
      if (onFaultCleared) onFaultCleared(id);
    } catch (err) {
      console.error('Failed to clear fault:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-950/70 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-slate-900 border-l border-slate-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <StatusDot status={status === 'healthy' && !hasFault ? 'healthy' : hasFault ? 'degraded' : 'failed'} />
              <div>
                <h2 className="text-lg font-bold text-slate-100">{displayName || name}</h2>
                <p className="text-xs text-slate-400 font-mono">Port :{port} &bull; {id}</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Drawer Body */}
          <div className="flex-1 overflow-y-auto p-6 space-y-6">
            {/* Role & Telemetry */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Role &amp; Topology</h4>
              <p className="text-sm text-slate-300 leading-relaxed bg-slate-950/60 p-3 rounded-lg border border-slate-800/80">
                {role}
              </p>
            </div>

            {/* Quick Metrics */}
            <div className="grid grid-cols-2 gap-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">HEALTH LATENCY</span>
                <span className="text-base font-bold text-slate-100">
                  {responseTime != null ? `${responseTime} ms` : 'N/A'}
                </span>
              </div>
              <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
                <span className="text-slate-400 text-[10px] block">HTTP STATUS</span>
                <span className="text-base font-bold text-emerald-400">200 OK</span>
              </div>
            </div>

            {/* Active Fault Status */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Chaos Injection State</h4>
              {hasFault ? (
                <div className={`p-4 rounded-xl border ${
                  fault.type === 'latency'
                    ? 'bg-amber-950/40 border-amber-600/50 text-amber-200'
                    : 'bg-rose-950/40 border-rose-600/50 text-rose-200'
                }`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="flex items-center gap-2 font-bold uppercase text-xs tracking-wider">
                      <Zap className="w-4 h-4 animate-pulse text-amber-400" />
                      Active: {fault.type}
                    </span>
                    <Badge variant={fault.type === 'latency' ? 'warning' : 'danger'}>
                      LIVE
                    </Badge>
                  </div>
                  <div className="text-xs space-y-1 font-mono">
                    <div>Parameter: <span className="font-semibold text-slate-100">
                      {fault.type === 'latency'
                        ? `${fault.latencyMs || fault.config?.delayMs || 3000} ms`
                        : fault.type === 'error'
                        ? `${fault.statusCode || 500} HTTP Error`
                        : 'Simulated Network Sever'}
                    </span></div>
                  </div>
                  <Button
                    size="sm"
                    variant="danger"
                    className="w-full mt-4 flex items-center justify-center gap-1.5 text-xs"
                    onClick={handleClearFault}
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Manually Clear Fault Now
                  </Button>
                </div>
              ) : (
                <div className="p-4 rounded-xl bg-slate-950/50 border border-slate-800 text-slate-300">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                      <ShieldCheck className="w-4 h-4" /> Nominal Operation
                    </span>
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    No chaos faults are injected into this microservice. All inbound requests proceed without artificial latency or errors.
                  </p>
                  {id !== 'order-service' && (
                    <Button
                      size="sm"
                      variant="primary"
                      className="w-full text-xs flex items-center justify-center gap-1.5 shadow-glow-indigo"
                      onClick={() => {
                        onClose();
                        onInjectFault(service);
                      }}
                    >
                      <Zap className="w-3.5 h-3.5" />
                      Inject Chaos Fault
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Endpoints List */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Service Endpoints</h4>
              <div className="space-y-2">
                {endpoints.map((ep, i) => (
                  <div
                    key={i}
                    className="p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs"
                  >
                    <div className="flex items-center gap-2 font-mono">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                        ep.method === 'POST' ? 'bg-amber-950 text-amber-400 border border-amber-800/50' : 'bg-sky-950 text-sky-400 border border-sky-800/50'
                      }`}>
                        {ep.method}
                      </span>
                      <span className="text-slate-200">{ep.path}</span>
                    </div>
                    <span className="text-[11px] text-slate-400">{ep.desc}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Dependencies */}
            <div>
              <h4 className="text-xs font-mono uppercase text-slate-400 mb-2">Cluster Dependencies</h4>
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Upstream Calls:</span>
                  <span className="font-mono text-slate-200">
                    {dependencies.upstream?.join(', ') || 'None (Entrypoint)'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400">Downstream Calls:</span>
                  <span className="font-mono text-slate-200">
                    {dependencies.downstream?.join(', ') || 'None (Leaf Node)'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-slate-800 flex items-center justify-end">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Close Inspector
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
