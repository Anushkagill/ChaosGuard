// ============================================================
// Phase 10 Unit Tests — Load Normalization & Comparison Math
// ============================================================

const assert = require('assert');
const { normalizeAutocannonResult } = require('./src/services/load.service');
const { computeComparison } = require('./src/utils/comparison');

console.log('--- Testing Phase 10 Normalization & Comparison ---');

// Test 1: Normalization of standard nominal result
{
  const mockNominal = {
    requests: { total: 1000, average: 100 },
    '2xx': 1000,
    non2xx: 0,
    errors: 0,
    timeouts: 0,
    latency: {
      min: 10.2,
      max: 55.4,
      average: 15.6,
      p50: 14.1,
      p95: 25.3,
      p99: 42.0,
    },
  };

  const norm = normalizeAutocannonResult('baseline', 10, mockNominal);
  assert.strictEqual(norm.phase, 'baseline');
  assert.strictEqual(norm.requests.total, 1000);
  assert.strictEqual(norm.requests.successful, 1000);
  assert.strictEqual(norm.requests.failed, 0);
  assert.strictEqual(norm.requests.timedOut, 0);
  assert.strictEqual(norm.errorRate, 0);
  assert.strictEqual(norm.throughput.avgRps, 100);
  assert.strictEqual(norm.latency.p50, 14.1);
  assert.strictEqual(norm.latency.p95, 25.3);
  console.log('✓ Test 1 Passed: Standard nominal result normalization');
}

// Test 2: Normalization with zero requests (missing / failed run)
{
  const mockZero = {
    requests: { total: 0, average: 0 },
    '2xx': 0,
    non2xx: 0,
    errors: 0,
    timeouts: 0,
    latency: null,
  };

  const norm = normalizeAutocannonResult('chaos', 10, mockZero);
  assert.strictEqual(norm.requests.total, 0);
  assert.strictEqual(norm.requests.successful, 0);
  assert.strictEqual(norm.requests.failed, 0);
  assert.strictEqual(norm.errorRate, null, 'Error rate must be null when total is 0');
  assert.strictEqual(norm.throughput.avgRps, null, 'avgRps must be null when total is 0');
  assert.strictEqual(norm.latency.p50, null, 'p50 must be null when total is 0');
  assert.strictEqual(norm.latency.min, null, 'min must be null when total is 0');
  console.log('✓ Test 2 Passed: Zero-request result safely returns null (no fake zeros)');
}

// Test 3: Normalization with errors & timeouts
{
  const mockErrors = {
    requests: { total: 500, average: 50 },
    '2xx': 300,
    non2xx: 200,
    errors: 10,
    timeouts: 10,
    latency: {
      min: 15.0,
      max: 3050.0,
      average: 1500.0,
      p50: 3000.0,
      p95: 3040.0,
      p99: 3050.0,
    },
  };

  const norm = normalizeAutocannonResult('chaos', 10, mockErrors);
  assert.strictEqual(norm.requests.total, 500);
  assert.strictEqual(norm.requests.successful, 300);
  assert.strictEqual(norm.requests.failed, 210); // 200 non2xx + 10 errors
  assert.strictEqual(norm.requests.timedOut, 10);
  // total valid responses = max(500, 300+210) = 510 -> errorRate = 210/510 = 0.4118
  assert.ok(norm.errorRate > 0.40 && norm.errorRate < 0.42);
  console.log('✓ Test 3 Passed: Non-2xx and timeout categorization without double-counting');
}

// Test 4: Comparison calculation — FULLY_RECOVERED scenario
{
  const baseline = {
    durationSec: 10,
    requests: { total: 1000, successful: 1000, failed: 0, timedOut: 0 },
    errorRate: 0.0,
    throughput: { avgRps: 100.0 },
    latency: { min: 10, max: 50, avg: 15, p50: 14.0, p95: 25.0, p99: 40.0 },
  };

  const chaos = {
    durationSec: 10,
    requests: { total: 400, successful: 250, failed: 150, timedOut: 10 },
    errorRate: 0.375,
    throughput: { avgRps: 40.0 },
    latency: { min: 15, max: 3100, avg: 1800, p50: 3010.0, p95: 3050.0, p99: 3090.0 },
  };

  const recovery = {
    durationSec: 10,
    requests: { total: 980, successful: 980, failed: 0, timedOut: 0 },
    errorRate: 0.0,
    throughput: { avgRps: 98.0 },
    latency: { min: 11, max: 52, avg: 16, p50: 14.5, p95: 26.0, p99: 41.0 },
  };

  const comp = computeComparison(baseline, chaos, recovery, 10);
  assert.strictEqual(comp.recoveryAssessment, 'FULLY_RECOVERED');
  assert.strictEqual(comp.errorRateRecovered, true);
  assert.strictEqual(comp.latencyRecovered, true);
  assert.strictEqual(comp.throughputRecovered, true);
  assert.strictEqual(comp.recoveryWindowSec, 10);
  assert.strictEqual(comp.latencyImpact.p95DeltaMs, 3025.0); // 3050 - 25
  assert.strictEqual(comp.errorRateImpact, 0.375); // 0.375 - 0.0
  console.log('✓ Test 4 Passed: Comparison correctly evaluates FULLY_RECOVERED');
}

// Test 5: Comparison calculation — ERROR_RATE_ONLY scenario (errors cleared, but latency degraded)
{
  const baseline = {
    durationSec: 10,
    requests: { total: 1000, successful: 1000, failed: 0, timedOut: 0 },
    errorRate: 0.0,
    throughput: { avgRps: 100.0 },
    latency: { min: 10, max: 50, avg: 15, p50: 14.0, p95: 25.0, p99: 40.0 },
  };

  const chaos = {
    durationSec: 10,
    requests: { total: 500, successful: 300, failed: 200, timedOut: 0 },
    errorRate: 0.4,
    throughput: { avgRps: 50.0 },
    latency: { min: 15, max: 2000, avg: 1000, p50: 1000.0, p95: 1500.0, p99: 1800.0 },
  };

  const recovery = {
    durationSec: 10,
    requests: { total: 600, successful: 600, failed: 0, timedOut: 0 },
    errorRate: 0.0, // Error rate nominal
    throughput: { avgRps: 60.0 },
    latency: { min: 100, max: 500, avg: 250, p50: 200.0, p95: 350.0, p99: 450.0 }, // Latency remains elevated (350 vs 25)
  };

  const comp = computeComparison(baseline, chaos, recovery, 10);
  assert.strictEqual(comp.recoveryAssessment, 'ERROR_RATE_ONLY');
  assert.strictEqual(comp.errorRateRecovered, true);
  assert.strictEqual(comp.latencyRecovered, false);
  console.log('✓ Test 5 Passed: Comparison distinguishes ERROR_RATE_ONLY from full recovery');
}

console.log('--- ALL UNIT TESTS PASSED SUCCESSFULLY! ---');
