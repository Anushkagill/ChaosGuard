const { setActiveFault, clearActiveFault, getActiveFault } = require('../state/fault.state');

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
// ============================================================

function activateFault(req, res) {
  const { fault, parameters } = req.body;

  const supportedFaults = ['latency', 'error', 'unavailable'];
  if (!fault || !supportedFaults.includes(fault)) {
    return res.status(400).json({
      error: `Invalid fault. Supported: ${supportedFaults.join(', ')}`,
    });
  }

  if (fault === 'latency') {
    const latencyMs = parameters && parameters.latencyMs;
    if (!latencyMs || typeof latencyMs !== 'number' || latencyMs <= 0) {
      return res.status(400).json({
        error: 'latency fault requires parameters.latencyMs (positive number)',
      });
    }
  }

  const faultConfig = { fault, parameters: parameters || {} };
  setActiveFault(faultConfig);

  console.log(`[INTERNAL] Fault activated: ${JSON.stringify(faultConfig)}`);
  return res.status(200).json({ status: 'activated', fault: faultConfig });
}

function deactivateFault(req, res) {
  clearActiveFault();
  console.log('[INTERNAL] Fault cleared');
  return res.status(200).json({ status: 'cleared' });
}

function getFault(req, res) {
  const current = getActiveFault();
  return res.status(200).json({ fault: current });
}

module.exports = { activateFault, deactivateFault, getFault };
