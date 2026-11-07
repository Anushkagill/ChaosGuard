// ============================================================
// Comparison Utility — Phase 10
// ============================================================
//
// Computes quantitative impact deltas and evaluates explicit recovery
// criteria across the three experiment phases: Baseline -> Chaos -> Recovery.
//
// Design Guarantees:
// 1. Separation of Concerns:
//    Quantitative measured values (deltas) are reported separately from
//    qualitative assessments.
// 2. Truthful Recovery Reporting:
//    Does NOT report an arbitrary upper bound as "recoveryTime".
//    Reports `recoveryWindowSec` (the observation duration) and whether
//    the service nominal thresholds were satisfied within that window.
// 3. Multi-dimensional Recovery:
//    Evaluates error rate, p95 latency, and throughput separately.
// ============================================================

/**
 * Computes the comparison summary from baseline, chaos, and recovery snapshots.
 *
 * @param {Object} baseline - MetricsSnapshot from baseline phase
 * @param {Object} chaos - MetricsSnapshot from chaos phase
 * @param {Object} recovery - MetricsSnapshot from recovery phase
 * @param {number} recoveryWindowSec - Configured duration of recovery phase
 * @returns {Object} ComparisonSummary
 */
function computeComparison(baseline, chaos, recovery, recoveryWindowSec) {
  // If baseline or chaos had no valid requests, mark as insufficient data
  if (!baseline || !chaos || !recovery ||
      baseline.requests.total === 0 || chaos.requests.total === 0) {
    return {
      latencyImpact: { p50DeltaMs: null, p95DeltaMs: null, p99DeltaMs: null },
      errorRateImpact: null,
      throughputImpactRps: null,
      recoveryWindowSec: recoveryWindowSec || 10,
      errorRateRecovered: null,
      latencyRecovered: null,
      throughputRecovered: null,
      recoveryAssessment: 'INSUFFICIENT_DATA',
    };
  }

  // 1. Calculate Deltas (Chaos - Baseline)
  const p50DeltaMs = (chaos.latency.p50 != null && baseline.latency.p50 != null)
    ? Number((chaos.latency.p50 - baseline.latency.p50).toFixed(2))
    : null;

  const p95DeltaMs = (chaos.latency.p95 != null && baseline.latency.p95 != null)
    ? Number((chaos.latency.p95 - baseline.latency.p95).toFixed(2))
    : null;

  const p99DeltaMs = (chaos.latency.p99 != null && baseline.latency.p99 != null)
    ? Number((chaos.latency.p99 - baseline.latency.p99).toFixed(2))
    : null;

  const errorRateImpact = (chaos.errorRate != null && baseline.errorRate != null)
    ? Number((chaos.errorRate - baseline.errorRate).toFixed(4))
    : null;

  const throughputImpactRps = (chaos.throughput.avgRps != null && baseline.throughput.avgRps != null)
    ? Number((chaos.throughput.avgRps - baseline.throughput.avgRps).toFixed(2))
    : null;

  // 2. Evaluate Specific Recovery Criteria
  const baseErr = baseline.errorRate || 0;
  const recErr = recovery.errorRate || 0;
  // Error rate recovered: within 10% of baseline error rate or absolute delta <= 2%
  const errorRateRecovered = recErr <= (baseErr * 1.10 + 0.02);

  // Latency recovered: p95 within 25% of baseline or within 25ms
  const baseP95 = baseline.latency.p95 || 0;
  const recP95 = recovery.latency.p95 || 0;
  const latencyRecovered = recP95 <= Math.max(baseP95 * 1.25, baseP95 + 25);

  // Throughput recovered: at least 85% of baseline throughput
  const baseRps = baseline.throughput.avgRps || 0;
  const recRps = recovery.throughput.avgRps || 0;
  const throughputRecovered = baseRps > 0 ? (recRps >= baseRps * 0.85) : true;

  // 3. Composite Assessment
  let recoveryAssessment = 'DEGRADED';
  if (errorRateRecovered && latencyRecovered && throughputRecovered) {
    recoveryAssessment = 'FULLY_RECOVERED';
  } else if (errorRateRecovered) {
    recoveryAssessment = 'ERROR_RATE_ONLY';
  }

  return {
    latencyImpact: {
      p50DeltaMs,
      p95DeltaMs,
      p99DeltaMs,
    },
    errorRateImpact,
    throughputImpactRps,
    recoveryWindowSec: recoveryWindowSec || (recovery.durationSec || 10),
    errorRateRecovered,
    latencyRecovered,
    throughputRecovered,
    recoveryAssessment,
  };
}

module.exports = {
  computeComparison,
};
