// ============================================================
// Experiment Model — Phase 4
// ============================================================
//
// In-memory experiment storage and ID generation.
// No database — persistence is introduced in a later phase.
//
// Experiment shape:
// {
//   id: 'exp_001',
//   target: 'payment-service',
//   fault: 'latency',
//   parameters: { latencyMs: 3000 },
//   duration: 10,
//   status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED',
//   error: null | string,
//   createdAt: ISO string,
//   startedAt: null | ISO string,
//   completedAt: null | ISO string,
// }
// ============================================================

const experiments = new Map();
let counter = 0;

const SUPPORTED_TARGETS = ['payment-service'];
const SUPPORTED_FAULTS = ['latency', 'error', 'unavailable'];
const VALID_STATUSES = ['PENDING', 'RUNNING', 'COMPLETED', 'FAILED'];

function generateId() {
  counter += 1;
  return `exp_${String(counter).padStart(3, '0')}`;
}

function createExperiment({ target, fault, parameters, duration }) {
  const id = generateId();
  const experiment = {
    id,
    target,
    fault,
    parameters: parameters || {},
    duration,
    status: 'PENDING',
    error: null,
    createdAt: new Date().toISOString(),
    startedAt: null,
    completedAt: null,
  };
  experiments.set(id, experiment);
  return experiment;
}

function getExperiment(id) {
  return experiments.get(id) || null;
}

function getAllExperiments() {
  return Array.from(experiments.values());
}

function updateExperiment(id, updates) {
  const experiment = experiments.get(id);
  if (!experiment) return null;
  Object.assign(experiment, updates);
  return experiment;
}

module.exports = {
  SUPPORTED_TARGETS,
  SUPPORTED_FAULTS,
  VALID_STATUSES,
  createExperiment,
  getExperiment,
  getAllExperiments,
  updateExperiment,
};
