import React from 'react';
import { Server, Activity, Zap, ArrowRight, ShieldCheck, Clock, ExternalLink } from 'lucide-react';
import Card from '../ui/Card';
import StatusDot from '../ui/StatusDot';
import Badge from '../ui/Badge';
import Button from '../ui/Button';

export default function ServiceCard({
  service,
  onSelect,
  onInjectFault,
}) {
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
  const isHealthy = status === 'healthy' && !hasFault;
  const isDegraded = status === 'degraded' || (hasFault && fault.type === 'latency');
  const isFailed = status === 'failed' || (hasFault && fault.type !== 'latency');

  return (
    <Card
      className="p-5 flex flex-col justify-between hover:border-slate-700 transition-all duration-200 cursor-pointer group"
      onClick={() => onSelect && onSelect(service)}
    >
      <div>
        {/* Top Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <div className="flex items-center gap-2.5">
            <StatusDot
              status={isFailed ? 'failed' : isDegraded ? 'degraded' : isHealthy ? 'healthy' : 'neutral'}
              pulse={hasFault}
            />
            <div>
              <h3 className="text-base font-semibold text-slate-100 group-hover:text-indigo-400 transition-colors">
                {displayName || name}
              </h3>
              <p className="text-xs text-slate-400">{role}</p>
            </div>
          </div>
          <span className="px-2 py-0.5 text-xs font-mono font-semibold rounded bg-slate-800 text-slate-300 border border-slate-700/60">
            :{port}
          </span>
        </div>

        {/* Telemetry Stats */}
        <div className="grid grid-cols-2 gap-2 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/60 mb-4 text-xs font-mono">
          <div>
            <span className="text-slate-400 block text-[10px]">HEALTH LATENCY</span>
            <span className="text-slate-200 font-medium">
              {responseTime != null ? `${responseTime} ms` : 'N/A'}
            </span>
          </div>
          <div>
            <span className="text-slate-400 block text-[10px]">CLUSTER ROLE</span>
            <span className="text-indigo-400 font-medium uppercase text-[11px] truncate block">
              {id.replace('-service', '')}
            </span>
          </div>
        </div>

        {/* Fault Status Card */}
        {hasFault ? (
          <div className={`p-3 rounded-lg border mb-4 ${
            fault.type === 'latency'
              ? 'bg-amber-950/40 border-amber-600/40 text-amber-200'
              : 'bg-rose-950/40 border-rose-600/40 text-rose-200'
          }`}>
            <div className="flex items-center justify-between text-xs mb-1">
              <span className="flex items-center gap-1.5 font-bold uppercase tracking-wider text-[11px]">
                <Zap className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
                Active Fault: {fault.type}
              </span>
              <span className="text-[10px] font-mono opacity-80">
                {fault.type === 'latency'
                  ? `${fault.latencyMs || fault.config?.delayMs || 3000}ms delay`
                  : fault.type === 'error'
                  ? `${fault.statusCode || 500} status`
                  : 'Connection drop'}
              </span>
            </div>
            <p className="text-[11px] opacity-80 mt-1">
              Traffic to this node will experience simulated {fault.type} failures.
            </p>
          </div>
        ) : (
          <div className="p-2.5 rounded-lg bg-emerald-950/20 border border-emerald-800/30 text-emerald-300 text-xs mb-4 flex items-center justify-between">
            <span className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>Nominal &amp; Healthy</span>
            </span>
            <span className="text-[10px] font-mono text-emerald-400/80">0 faults</span>
          </div>
        )}

        {/* Dependencies */}
        <div className="text-[11px] text-slate-400 space-y-1.5 mb-4">
          {dependencies.upstream?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px]">Calls to:</span>
              <div className="flex flex-wrap gap-1">
                {dependencies.upstream.map((dep) => (
                  <span
                    key={dep}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
          {dependencies.downstream?.length > 0 && (
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 text-[10px]">Called by:</span>
              <div className="flex flex-wrap gap-1">
                {dependencies.downstream.map((dep) => (
                  <span
                    key={dep}
                    className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px] font-mono"
                  >
                    {dep}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      <div className="flex items-center justify-between pt-3 border-t border-slate-800/80 gap-2">
        <Button
          size="sm"
          variant="secondary"
          className="text-xs"
          onClick={(e) => {
            e.stopPropagation();
            onSelect && onSelect(service);
          }}
        >
          View Endpoints
        </Button>
        {id !== 'order-service' && (
          <Button
            size="sm"
            variant={hasFault ? 'danger' : 'secondary'}
            className="text-xs flex items-center gap-1"
            onClick={(e) => {
              e.stopPropagation();
              onInjectFault && onInjectFault(service);
            }}
          >
            <Zap className="w-3 h-3" />
            {hasFault ? 'Reconfigure' : 'Inject Fault'}
          </Button>
        )}
      </div>
    </Card>
  );
}
