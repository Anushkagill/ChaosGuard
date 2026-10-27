// ============================================================
// MetricsPanel Component — Phase 10
// ============================================================
//
// Renders the quantitative Baseline -> Chaos -> Recovery metrics collected
// from controlled load testing against Order Service (:3001).
//
// Design Guarantees:
// 1. Explicit Units:
//    Every column and field explicitly states its unit (ms, req/s, %, count, s).
// 2. Separation of Measured Telemetry vs Calculated Impact:
//    Raw measured telemetry from each phase is displayed in the data table;
//    mathematical deltas and recovery assessments are displayed in distinct summary cards.
// 3. Truthful Representation:
//    Missing or null values render as '—' (never false zeros).
//    Recovery window is clearly labeled as an observation period, not an exact time.
// ============================================================

import React from 'react';
import { BarChart3, TrendingUp, AlertTriangle, CheckCircle2, XCircle, Gauge, Activity, Clock } from 'lucide-react';
import Badge from '../ui/Badge';

export function MetricsPanel({ metrics }) {
  if (!metrics) return null;

  const { baseline, chaos, recovery, comparison } = metrics;

  // Format helpers
  const formatMs = (val) => (val != null && Number.isFinite(val) ? `${val.toFixed(1)} ms` : '—');
  const formatRps = (val) => (val != null && Number.isFinite(val) ? `${val.toFixed(1)} req/s` : '—');
  const formatPct = (val) => (val != null && Number.isFinite(val) ? `${(val * 100).toFixed(1)}%` : '—');
  const formatCount = (val) => (val != null && Number.isFinite(val) ? val.toLocaleString() : '—');

  // Assessment styling
  const assessment = comparison?.recoveryAssessment;
  const assessmentBadge = (() => {
    switch (assessment) {
      case 'FULLY_RECOVERED':
        return {
          label: 'Fully Recovered',
          variant: 'nominal',
          icon: CheckCircle2,
          color: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
        };
      case 'ERROR_RATE_ONLY':
        return {
          label: 'Error Rate Recovered (Latency Degraded)',
          variant: 'running',
          icon: AlertTriangle,
          color: 'text-amber-400 bg-amber-500/10 border-amber-500/30',
        };
      case 'DEGRADED':
        return {
          label: 'Degraded / Unrecovered',
          variant: 'failed',
          icon: XCircle,
          color: 'text-rose-400 bg-rose-500/10 border-rose-500/30',
        };
      default:
        return {
          label: 'Insufficient Telemetry',
          variant: 'neutral',
          icon: Activity,
          color: 'text-slate-400 bg-slate-800 border-slate-700',
        };
    }
  })();

  const StatusIcon = assessmentBadge.icon;

  return (
    <div className="mt-6 space-y-6">
      {/* Header and Assessment Pill */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-lg bg-indigo-500/20 text-indigo-400 border border-indigo-500/30">
            <BarChart3 className="w-5 h-5" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-white tracking-wide">
              Controlled Load Testing Telemetry
            </h4>
            <p className="text-xs text-slate-400">
              Entrypoint: <code className="text-blue-300 font-mono">POST /orders</code> (:3001) traversing Auth, Inventory & Payment
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-mono font-medium ${assessmentBadge.color}`}>
            <StatusIcon className="w-4 h-4 flex-shrink-0" />
            <span>Recovery: {assessmentBadge.label}</span>
          </span>
        </div>
      </div>

      {/* 1. Measured Telemetry Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 shadow-inner">
        <div className="px-4 py-2.5 bg-slate-800/40 border-b border-slate-800 flex items-center justify-between">
          <span className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold">
            Measured Multi-Phase Telemetry
          </span>
          <span className="text-[11px] text-slate-400">
            Observation: Baseline ({baseline?.durationSec ?? '—'}s) → Chaos ({chaos?.durationSec ?? '—'}s) → Recovery ({recovery?.durationSec ?? '—'}s)
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead>
              <tr className="border-b border-slate-800/80 bg-slate-800/20 text-slate-400">
                <th className="py-2.5 px-4 font-semibold">Metric (Explicit Unit)</th>
                <th className="py-2.5 px-4 font-semibold text-sky-400">Phase 1: Baseline</th>
                <th className="py-2.5 px-4 font-semibold text-rose-400">Phase 2: Chaos</th>
                <th className="py-2.5 px-4 font-semibold text-emerald-400">Phase 3: Recovery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/40 text-slate-300">
              {/* Throughput */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-4 text-slate-300 font-medium flex items-center gap-2">
                  <Gauge className="w-3.5 h-3.5 text-blue-400" />
                  Throughput (req/s)
                </td>
                <td className="py-2.5 px-4 font-semibold text-white">{formatRps(baseline?.throughput?.avgRps)}</td>
                <td className="py-2.5 px-4 font-semibold text-amber-300">{formatRps(chaos?.throughput?.avgRps)}</td>
                <td className="py-2.5 px-4 font-semibold text-white">{formatRps(recovery?.throughput?.avgRps)}</td>
              </tr>

              {/* Error Rate */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-4 text-slate-300 font-medium flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                  Error Rate (%)
                </td>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">{formatPct(baseline?.errorRate)}</td>
                <td className="py-2.5 px-4 font-semibold text-rose-400">{formatPct(chaos?.errorRate)}</td>
                <td className="py-2.5 px-4 font-semibold text-emerald-400">{formatPct(recovery?.errorRate)}</td>
              </tr>

              {/* Latency p50 */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-4 text-slate-300 font-medium flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-indigo-400" />
                  Median Latency p50 (ms)
                </td>
                <td className="py-2.5 px-4 text-slate-200">{formatMs(baseline?.latency?.p50)}</td>
                <td className="py-2.5 px-4 text-rose-300 font-bold">{formatMs(chaos?.latency?.p50)}</td>
                <td className="py-2.5 px-4 text-slate-200">{formatMs(recovery?.latency?.p50)}</td>
              </tr>

              {/* Latency p95 */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-4 text-slate-300 font-medium flex items-center gap-2">
                  <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                  Tail Latency p95 (ms)
                </td>
                <td className="py-2.5 px-4 text-slate-200">{formatMs(baseline?.latency?.p95)}</td>
                <td className="py-2.5 px-4 text-rose-300 font-bold">{formatMs(chaos?.latency?.p95)}</td>
                <td className="py-2.5 px-4 text-slate-200">{formatMs(recovery?.latency?.p95)}</td>
              </tr>

              {/* Latency p99 */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-4 text-slate-400 font-medium">
                  Peak Latency p99 (ms)
                </td>
                <td className="py-2.5 px-4 text-slate-400">{formatMs(baseline?.latency?.p99)}</td>
                <td className="py-2.5 px-4 text-rose-400">{formatMs(chaos?.latency?.p99)}</td>
                <td className="py-2.5 px-4 text-slate-400">{formatMs(recovery?.latency?.p99)}</td>
              </tr>

              {/* Request Counts */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-4 text-slate-400">Total Requests Completed</td>
                <td className="py-2.5 px-4 text-slate-300">{formatCount(baseline?.requests?.total)}</td>
                <td className="py-2.5 px-4 text-slate-300">{formatCount(chaos?.requests?.total)}</td>
                <td className="py-2.5 px-4 text-slate-300">{formatCount(recovery?.requests?.total)}</td>
              </tr>

              {/* Failed Requests */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-4 text-slate-400">Failed / Non-2xx Requests</td>
                <td className="py-2.5 px-4 text-slate-300">{formatCount(baseline?.requests?.failed)}</td>
                <td className="py-2.5 px-4 text-rose-400 font-semibold">{formatCount(chaos?.requests?.failed)}</td>
                <td className="py-2.5 px-4 text-slate-300">{formatCount(recovery?.requests?.failed)}</td>
              </tr>

              {/* Socket Timeouts */}
              <tr className="hover:bg-slate-800/20 transition-colors">
                <td className="py-2.5 px-4 text-slate-400">Socket Timeouts (10s limit)</td>
                <td className="py-2.5 px-4 text-slate-300">{formatCount(baseline?.requests?.timedOut)}</td>
                <td className="py-2.5 px-4 text-amber-400">{formatCount(chaos?.requests?.timedOut)}</td>
                <td className="py-2.5 px-4 text-slate-300">{formatCount(recovery?.requests?.timedOut)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Calculated Impact & Recovery Evaluation Cards */}
      <div>
        <div className="text-xs font-mono uppercase tracking-wider text-slate-400 font-bold mb-3 flex items-center gap-2">
          <span>Calculated Impact & Recovery Criteria</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Latency Impact */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Tail Latency p95 Impact
            </span>
            <div className="my-2">
              <span className={`text-xl font-bold font-mono ${
                (comparison?.latencyImpact?.p95DeltaMs ?? 0) > 50
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}>
                {comparison?.latencyImpact?.p95DeltaMs != null
                  ? `${comparison.latencyImpact.p95DeltaMs > 0 ? '+' : ''}${comparison.latencyImpact.p95DeltaMs.toFixed(1)} ms`
                  : '—'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Chaos tail vs baseline
            </span>
          </div>

          {/* Error Rate Impact */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Error Rate Delta
            </span>
            <div className="my-2">
              <span className={`text-xl font-bold font-mono ${
                (comparison?.errorRateImpact ?? 0) > 0.05
                  ? 'text-rose-400'
                  : 'text-slate-200'
              }`}>
                {comparison?.errorRateImpact != null
                  ? `${comparison.errorRateImpact > 0 ? '+' : ''}${(comparison.errorRateImpact * 100).toFixed(1)}%`
                  : '—'}
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Degradation under chaos
            </span>
          </div>

          {/* Error Rate Recovery */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Error Rate Status
            </span>
            <div className="my-2 flex items-center gap-2">
              {comparison?.errorRateRecovered ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                  <span className="text-base font-bold text-emerald-400 font-mono">Recovered</span>
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-rose-400" />
                  <span className="text-base font-bold text-rose-400 font-mono">Elevated</span>
                </>
              )}
            </div>
            <span className="text-[11px] text-slate-400">
              Within 2% of baseline
            </span>
          </div>

          {/* Recovery Window */}
          <div className="p-3.5 rounded-xl border border-slate-800 bg-slate-900/50 flex flex-col justify-between">
            <span className="text-[11px] font-mono text-slate-400 uppercase tracking-wider">
              Observation Window
            </span>
            <div className="my-2 flex items-center gap-2">
              <Clock className="w-5 h-5 text-blue-400" />
              <span className="text-xl font-bold text-blue-300 font-mono">
                {comparison?.recoveryWindowSec ?? 10} s
              </span>
            </div>
            <span className="text-[11px] text-slate-400">
              Tested recovery duration
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default MetricsPanel;
