// ============================================================
// Load Service — Phase 10
// ============================================================
//
// Programmatic load generation wrapper using autocannon (v7).
//
// Responsibilities:
// 1. Generate controlled load against the Order Service entrypoint.
// 2. Use the exact required request schema for Order Service so that
//    requests validate, authenticate, and traverse downstream services
//    (Auth -> Inventory -> Payment) without artificial 400 errors.
// 3. Normalize raw autocannon telemetry into a clean, safe MetricsSnapshot
//    guaranteeing that missing or non-finite measurements are represented
//    as null (never misleading 0 values).
// ============================================================

const autocannon = require('autocannon');

const DEFAULT_PAYLOAD = {
  item: 'chaos-load-probe',
  amount: 100,
  quantity: 1,
  token: 'simulated-guest-token',
};

const DEFAULT_HEADERS = {
  'Content-Type': 'application/json',
  'Authorization': 'Bearer simulated-guest-token',
  'X-ChaosGuard-Probe': 'load-test',
};

/**
 * Normalizes raw autocannon v7 results into the ChaosGuard MetricsSnapshot shape.
 *
 * @param {string} phase - 'baseline' | 'chaos' | 'recovery'
 * @param {number} durationSec - Configured duration in seconds
 * @param {Object} result - Raw autocannon result object
 * @returns {Object} MetricsSnapshot
 */
function normalizeAutocannonResult(phase, durationSec, result) {
  const total = (result && result.requests && typeof result.requests.total === 'number')
    ? result.requests.total
    : 0;

  const successful = (result && typeof result['2xx'] === 'number')
    ? result['2xx']
    : 0;

  const non2xx = (result && typeof result.non2xx === 'number')
    ? result.non2xx
    : 0;

  const errors = (result && typeof result.errors === 'number')
    ? result.errors
    : 0;

  const timedOut = (result && typeof result.timeouts === 'number')
    ? result.timeouts
    : 0;

  const failed = Math.max(0, non2xx + errors);
  const totalValidResponses = Math.max(total, successful + failed);

  // Error rate calculation
  const errorRate = totalValidResponses > 0
    ? Number((failed / totalValidResponses).toFixed(4))
    : null;

  // Throughput calculation
  let avgRps = null;
  if (totalValidResponses > 0) {
    if (result && result.requests && Number.isFinite(result.requests.average)) {
      avgRps = Number(result.requests.average.toFixed(2));
    } else if (durationSec > 0) {
      avgRps = Number((total / durationSec).toFixed(2));
    }
  }

  // Latency calculation
  const lat = result && result.latency;
  const hasLatency = totalValidResponses > 0 && lat && typeof lat === 'object';
  const p95Val = hasLatency ? (lat.p95 ?? lat.p97_5 ?? lat.p90) : null;

  const latency = {
    min: hasLatency && Number.isFinite(lat.min) ? Number(lat.min.toFixed(2)) : null,
    max: hasLatency && Number.isFinite(lat.max) ? Number(lat.max.toFixed(2)) : null,
    avg: hasLatency && Number.isFinite(lat.average) ? Number(lat.average.toFixed(2)) : null,
    p50: hasLatency && Number.isFinite(lat.p50) ? Number(lat.p50.toFixed(2)) : null,
    p95: hasLatency && Number.isFinite(p95Val) ? Number(p95Val.toFixed(2)) : null,
    p99: hasLatency && Number.isFinite(lat.p99) ? Number(lat.p99.toFixed(2)) : null,
  };

  return {
    phase,
    durationSec,
    requests: {
      total,
      successful,
      failed,
      timedOut,
    },
    errorRate,
    throughput: {
      avgRps,
    },
    latency,
  };
}

/**
 * Runs a single load testing phase using autocannon.
 *
 * @param {Object} options
 * @param {string} options.phase - 'baseline' | 'chaos' | 'recovery'
 * @param {string} options.url - Full destination URL (e.g. http://order-service:3001/orders)
 * @param {number} options.durationSec - Duration in seconds
 * @param {number} [options.connections=10] - Number of concurrent connections
 * @param {Object} [options.payload=DEFAULT_PAYLOAD] - Request body object
 * @param {Object} [options.headers=DEFAULT_HEADERS] - HTTP request headers
 * @returns {Promise<Object>} Resolved MetricsSnapshot
 */
function runLoadPhase({
  phase = 'baseline',
  url,
  durationSec = 10,
  connections = 10,
  payload = DEFAULT_PAYLOAD,
  headers = DEFAULT_HEADERS,
}) {
  return new Promise((resolve, reject) => {
    if (!url) {
      return reject(new Error('runLoadPhase requires a destination url'));
    }

    const opts = {
      url,
      method: 'POST',
      body: JSON.stringify(payload),
      headers,
      duration: Math.max(1, durationSec),
      connections: Math.max(1, connections),
      pipelining: 1,
      timeout: 10, // 10 second socket timeout per request
    };

    autocannon(opts, (err, result) => {
      if (err) {
        return reject(err);
      }
      try {
        const snapshot = normalizeAutocannonResult(phase, durationSec, result);
        resolve(snapshot);
      } catch (normErr) {
        reject(normErr);
      }
    });
  });
}

module.exports = {
  runLoadPhase,
  normalizeAutocannonResult,
  DEFAULT_PAYLOAD,
  DEFAULT_HEADERS,
};
