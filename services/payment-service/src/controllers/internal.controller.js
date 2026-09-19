const { setActiveFault, clearActiveFault, getActiveFault } = require('../state/fault.state');
const { ApiError } = require('../utils/ApiError');

// ============================================================
// Internal Fault Control Controller — Phase 4
// ============================================================
//
// These handlers allow ChaosGuard to activate and deactivate
// faults at runtime. They are mounted under /internal/faults.
//
// POST /internal/faults — activate a fault
// DELETE /internal/faults — clear the active fault
// GET /internal/faults — check current fault state
//
// Error handling: throws ApiError for validation errors.
// asyncHandler (applied in routes) catches and forwards to errorHandler.
// ============================================================

async function activateFault(req, res) {
  const { fault, parameters } = req.body;

  const supportedFaults = ['latency', 'error', 'unavailable'];
  if (!fault || !supportedFaults.includes(fault)) {
    throw new ApiError(400, `Invalid fault. Supported: ${supportedFaults.join(', ')}`);
  }

  if (fault === 'latency') {
    const latencyMs = parameters && parameters.latencyMs;
    if (!latencyMs || typeof latencyMs !== 'number' || latencyMs <= 0) {
      throw new ApiError(400, 'latency fault requires parameters.latencyMs (positive number)');
    }
  }

  const faultConfig = { fault, parameters: parameters || {} };
  setActiveFault(faultConfig);

  console.log(`[INTERNAL] Fault activated: ${JSON.stringify(faultConfig)}`);
  return res.status(200).json({ status: 'activated', fault: faultConfig });
}

async function deactivateFault(req, res) {
  clearActiveFault();
  console.log('[INTERNAL] Fault cleared');
  return res.status(200).json({ status: 'cleared' });
}

async function getFault(req, res) {
  const current = getActiveFault();
  return res.status(200).json({ fault: current });
}

module.exports = { activateFault, deactivateFault, getFault };

