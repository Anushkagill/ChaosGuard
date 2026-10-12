import React, { memo } from 'react';
import { Handle, Position } from '@xyflow/react';
import {
  Shield,
  Zap,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Clock,
  Crosshair,
} from 'lucide-react';
import StatusDot from '../ui/StatusDot';

/**
 * ChaosServiceNode is the custom React Flow node for ChaosGuard services.
 * 
 * It visually represents a microservice with:
 * - Real-time health status and response time
 * - Active chaos fault tags
 * - Live probe execution states (active/success/error/skipped)
 * - Failure propagation cues (target, affected, shielded, nominal)
 * - Custom handles for dependency edges
 */
function ChaosServiceNode({ id, data, selected }) {
  const {
    service = {},
    isExperimentTarget = false,
    probeState = 'none',
    propagationState = 'nominal',
    onSelect,
  } = data || {};

  const {
    name = id,
    displayName = id,
    port = 3000,
    role = 'Microservice',
    status = 'healthy',
    responseTime,
    fault,
  } = service;

  const hasFault = Boolean(fault?.active);
  const isHealthy = status === 'healthy' && !hasFault;
  const isDegraded = status === 'degraded' || (hasFault && fault.type === 'latency');
  const isFailed = status === 'failed' || (hasFault && fault.type !== 'latency');

  // Probe indicator styling
  const probeStyles = {
    none: '',
    active: 'ring-2 ring-sky-400 ring-offset-2 ring-offset-slate-950 shadow-glow-sky animate-pulse',
    success: 'ring-2 ring-emerald-400 ring-offset-2 ring-offset-slate-950 shadow-glow-emerald',
    error: 'ring-2 ring-rose-500 ring-offset-2 ring-offset-slate-950 shadow-glow-rose',
    skipped: 'opacity-40 grayscale',
  };

  // Propagation border and glow styling
  const propagationStyles = {
    target: 'ring-2 ring-rose-500/90 shadow-glow-rose border-rose-500/60 bg-rose-950/20',
    affected: 'ring-2 ring-amber-500/70 shadow-glow-amber border-amber-500/50 bg-amber-950/20',
    shielded: 'border-slate-700/60 bg-slate-900/60 opacity-80',
    nominal: '',
  };

  // Selection styling
  const selectionStyle = selected
    ? 'border-indigo-500/90 shadow-glow-indigo bg-slate-900/95 ring-1 ring-indigo-500/50'
    : 'border-slate-800/80 hover:border-slate-700 hover:shadow-lg';

  const handleClick = (e) => {
    // Avoid double-firing if drag triggered
    if (onSelect) {
      onSelect(service);
    }
  };

  return (
    <div
      onClick={handleClick}
      className={`relative w-64 p-3.5 rounded-xl cursor-pointer transition-all duration-200 select-none
        bg-slate-900/90 backdrop-blur-md border shadow-md
        ${selectionStyle}
        ${probeStyles[probeState] || ''}
        ${propagationStyles[propagationState] || ''}
      `}
    >
      {/* React Flow Handles based on architecture role */}
      {id === 'auth-service' && (
        <Handle
          type="target"
          position={Position.Bottom}
          id="bottom"
          className="!w-2.5 !h-2.5 !rounded-full !bg-indigo-500 !border-2 !border-slate-900"
        />
      )}

      {id === 'order-service' && (
        <>
          <Handle
            type="source"
            position={Position.Top}
            id="top"
            className="!w-2.5 !h-2.5 !rounded-full !bg-indigo-500 !border-2 !border-slate-900"
          />
          <Handle
            type="source"
            position={Position.Bottom}
            id="bottom"
            className="!w-2.5 !h-2.5 !rounded-full !bg-indigo-500 !border-2 !border-slate-900"
          />
        </>
      )}

      {(id === 'payment-service' || id === 'inventory-service') && (
        <Handle
          type="target"
          position={Position.Top}
          id="top"
          className="!w-2.5 !h-2.5 !rounded-full !bg-indigo-500 !border-2 !border-slate-900"
        />
      )}

      {/* Probe badge overlay */}
      {probeState !== 'none' && (
        <div className="absolute -top-2.5 -right-2.5 z-20">
          {probeState === 'active' && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-sky-500 text-slate-950 shadow-md animate-spin">
              <Clock className="w-3.5 h-3.5" />
            </span>
          )}
          {probeState === 'success' && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-slate-950 shadow-md">
              <CheckCircle2 className="w-4 h-4" />
            </span>
          )}
          {probeState === 'error' && (
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-rose-500 text-white shadow-md">
              <XCircle className="w-4 h-4" />
            </span>
          )}
        </div>
      )}

      {/* Header: Status Dot, Name, Port & Propagation Tag */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusDot
            status={isFailed ? 'failed' : isDegraded ? 'degraded' : isHealthy ? 'healthy' : 'neutral'}
            pulse={hasFault || propagationState === 'target'}
          />
          <h4 className="text-sm font-semibold text-slate-100 truncate tracking-tight">
            {displayName || name}
          </h4>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          {/* Propagation Tag if non-nominal */}
          {propagationState === 'target' && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase rounded bg-rose-500/20 text-rose-300 border border-rose-500/50 flex items-center gap-0.5 animate-pulse">
              <Crosshair className="w-2.5 h-2.5" />
              Target
            </span>
          )}
          {propagationState === 'affected' && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase rounded bg-amber-500/20 text-amber-300 border border-amber-500/50 flex items-center gap-0.5">
              <AlertTriangle className="w-2.5 h-2.5" />
              Affected
            </span>
          )}
          {propagationState === 'shielded' && (
            <span className="px-1.5 py-0.5 text-[9px] font-mono font-semibold uppercase rounded bg-slate-800 text-slate-400 border border-slate-700 flex items-center gap-0.5">
              <Shield className="w-2.5 h-2.5 text-indigo-400" />
              Shielded
            </span>
          )}

          <span className="px-1.5 py-0.5 text-[11px] font-mono font-medium rounded bg-slate-800/80 text-slate-400 border border-slate-700/60">
            :{port}
          </span>
        </div>
      </div>

      {/* Role & Response Time */}
      <div className="flex items-center justify-between text-[11px] text-slate-400 mb-2">
        <span className="text-slate-400 truncate max-w-[140px]">{role}</span>
        <span className="font-mono text-[10px] text-slate-400">
          {responseTime != null ? `${responseTime}ms` : '--'}
        </span>
      </div>

      {/* Fault Indicator Banner or Nominal State */}
      {hasFault ? (
        <div
          className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-[10px] font-mono font-medium border ${
            fault.type === 'latency'
              ? 'bg-amber-950/60 border-amber-600/50 text-amber-300'
              : 'bg-rose-950/60 border-rose-600/50 text-rose-300'
          }`}
        >
          <Zap className="w-3 h-3 flex-shrink-0 animate-pulse" />
          <span className="uppercase font-bold">{fault.type}</span>
          <span className="text-slate-300">
            {fault.type === 'latency'
              ? `${fault.latencyMs || fault.config?.delayMs || 3000}ms`
              : fault.type === 'error'
              ? `${fault.statusCode || 500} ERR`
              : 'DOWN'}
          </span>
        </div>
      ) : propagationState === 'shielded' ? (
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
          <span className="text-slate-400">Execution Status</span>
          <span className="text-slate-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span>
            Unreached / Shielded
          </span>
        </div>
      ) : (
        <div className="flex items-center justify-between pt-1 border-t border-slate-800/60 text-[10px]">
          <span className="text-slate-400">Active Faults</span>
          <span className="text-emerald-400 font-mono flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
            None (Nominal)
          </span>
        </div>
      )}
    </div>
  );
}

export default memo(ChaosServiceNode);
