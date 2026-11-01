// ============================================================
// Experiment Model — Phase 5
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
//   status: 'PENDING' | 'QUEUED' | 'RUNNING' | 'COMPLETED' | 'FAILED',
//   error: null | string,
//   jobId: null | string,       // BullMQ job ID (set when queued)
//   faultCleared: null | boolean, // was the fault actually cleared?
//   createdAt: ISO string,
//   queuedAt: null | ISO string, // timestamp when added to BullMQ queue
//   startedAt: null | ISO string,
//   completedAt: null | ISO string,
// }
//
// faultCleared semantics:
//   null    — not yet applicable (experiment not started or not reached fault stage)
//   true    — fault was successfully cleared
//   false   — fault was NOT cleared (target may still be in broken state — operator must intervene)
// ============================================================

const experiments = new Map();
let counter = 0;

const SUPPORTED_TARGETS = ['payment-service', 'auth-service', 'inventory-service'];
const SUPPORTED_FAULTS = ['latency', 'error', 'unavailable'];
const VALID_STATUSES = ['PENDING', 'QUEUED', 'RUNNING', 'COMPLETED', 'FAILED'];

function generateId() {
  counter += 1;
  return `exp_${String(counter).padStart(3, '0')}`;
}

function createExperiment({ target, fault, parameters, duration, loadConfig }) {
  const id = generateId();
  const experiment = {
    id,
    target,
    fault,
    parameters: parameters || {},
    duration,
    status: 'PENDING',
    error: null,
    jobId: null,          // Phase 5: BullMQ job ID, set when experiment is queued.
    faultCleared: null,   // Phase 5: tracks whether fault was actually cleared.
    loadConfig: loadConfig || null, // Phase 10: optional controlled load testing configuration
    metrics: null,        // Phase 10: collected Baseline -> Chaos -> Recovery metrics
    createdAt: new Date().toISOString(),
    queuedAt: null,       // Phase 5: timestamp when job was added to BullMQ.
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

function getExperimentByJobId(jobId) {
  if (!jobId) return null;
  const targetId = String(jobId);
  for (const experiment of experiments.values()) {
    if (experiment.jobId && String(experiment.jobId) === targetId) {
      return experiment;
    }
  }
  return null;
}

module.exports = {
  SUPPORTED_TARGETS,
  SUPPORTED_FAULTS,
  VALID_STATUSES,
  createExperiment,
  getExperiment,
  getAllExperiments,
  updateExperiment,
  getExperimentByJobId,
};
