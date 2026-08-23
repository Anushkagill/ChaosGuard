// ============================================================
// Runtime Fault State — Phase 4
// ============================================================
//
// Holds the currently active fault configuration in memory.
// This allows ChaosGuard to activate/deactivate faults at
// runtime via the internal API, without restarting the container.
//
// The fault middleware checks this state on every request.
// When no runtime fault is set, it falls back to environment
// variables (Phase 3 behavior preserved).
// ============================================================

let activeFault = null;

// activeFault shape when set:
// {
//   fault: 'latency' | 'error' | 'unavailable',
//   parameters: { latencyMs: 3000 }  // only for latency
// }

function getActiveFault() {
  return activeFault;
}

function setActiveFault(fault) {
  activeFault = fault;
}

function clearActiveFault() {
  activeFault = null;
}

module.exports = { getActiveFault, setActiveFault, clearActiveFault };
