// ============================================================
// Fault Injection Middleware — Phase 3 + Phase 4
// ============================================================
//
// Purpose:
// This middleware enables controlled, explicit fault behavior
// in Payment Service for chaos engineering experiments.
//
// Fault source priority:
// 1. Runtime state (set by ChaosGuard via POST /internal/faults)
// 2. Environment variables (Phase 3 manual configuration)
//
// Fault types supported:
//
// 1. unavailable
//    Simulates the service being unavailable.
//    The server immediately destroys the connection (no response).
//
// 2. error
//    The service returns an intentional 500 error response.
//
// 3. latency (with latencyMs parameter)
//    Adds an artificial delay before the request proceeds.
//
// All faults are disabled by default.
// /health and /internal paths are always exempt.
// ============================================================

const { getActiveFault } = require('../state/fault.state');

function faultInjection(req, res, next) {
  // Health and internal endpoints are always allowed through.
  if (req.path === '/health' || req.path.startsWith('/internal')) {
    return next();
  }

  // Determine which fault to apply.
  // Priority 1: runtime state (Phase 4 — set by ChaosGuard API)
  const runtimeFault = getActiveFault();
  if (runtimeFault) {
    return applyFault(runtimeFault.fault, runtimeFault.parameters, req, res, next);
  }

  // Priority 2: environment variables (Phase 3 — manual configuration)
  if (process.env.FAULT_UNAVAILABLE === 'true') {
    return applyFault('unavailable', {}, req, res, next);
  }
  if (process.env.FAULT_ERROR === 'true') {
    return applyFault('error', {}, req, res, next);
  }
  const envLatency = parseInt(process.env.FAULT_LATENCY_MS, 10);
  if (envLatency > 0) {
    return applyFault('latency', { latencyMs: envLatency }, req, res, next);
  }

  // No fault configured — proceed normally.
  return next();
}

function applyFault(fault, parameters, req, res, next) {
  if (fault === 'unavailable') {
    console.log(`[FAULT] unavailable — destroying connection for ${req.method} ${req.path}`);
    return req.socket.destroy();
  }

  if (fault === 'error') {
    console.log(`[FAULT] error — returning 500 for ${req.method} ${req.path}`);
    return res.status(500).json({
      error: 'Intentional fault injection error',
      fault: 'error',
    });
  }

  if (fault === 'latency') {
    const ms = parameters.latencyMs || 0;
    if (ms > 0) {
      console.log(`[FAULT] latency — delaying ${ms}ms for ${req.method} ${req.path}`);
      return setTimeout(() => next(), ms);
    }
  }

  return next();
}

module.exports = faultInjection;

