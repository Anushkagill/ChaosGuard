// ============================================================
// Experiment Service — Phase 4
// ============================================================
//
// Contains the core experiment logic:
// - Validation
// - Lifecycle management
// - Experiment execution (activate fault → wait duration → clear fault)
// - Recovery on failure
//
// This is separate from the controller so the controller only
// handles HTTP request/response concerns.
// ============================================================

const {
  SUPPORTED_TARGETS,
  SUPPORTED_FAULTS,
  createExperiment,
  getExperiment,
  updateExperiment,
} = require('../models/experiment.model');
const targetService = require('./target.service');

// Track active experiment timers so they can be cancelled by stop.
const activeTimers = new Map();

// ---- Validation ----

function validateExperimentInput({ target, fault, parameters, duration }) {
  const errors = [];

  if (!target) {
    errors.push('target is required');
  } else if (!SUPPORTED_TARGETS.includes(target)) {
    errors.push(`Unsupported target: ${target}. Supported: ${SUPPORTED_TARGETS.join(', ')}`);
  }

  if (!fault) {
    errors.push('fault is required');
  } else if (!SUPPORTED_FAULTS.includes(fault)) {
    errors.push(`Unsupported fault: ${fault}. Supported: ${SUPPORTED_FAULTS.join(', ')}`);
  }

  if (duration === undefined || duration === null) {
    errors.push('duration is required');
  } else if (typeof duration !== 'number' || duration <= 0) {
    errors.push('duration must be a positive number (seconds)');
  }

  if (fault === 'latency') {
    const latencyMs = parameters && parameters.latencyMs;
    if (!latencyMs || typeof latencyMs !== 'number' || latencyMs <= 0) {
      errors.push('latency fault requires parameters.latencyMs (positive number)');
    }
  }

  return errors;
}

// ---- Create ----

function create(input) {
  const errors = validateExperimentInput(input);
  if (errors.length > 0) {
    return { success: false, errors };
  }

  const experiment = createExperiment(input);
  return { success: true, experiment };
}

// ---- Start ----

async function start(id) {
  const experiment = getExperiment(id);
  if (!experiment) {
    return { success: false, status: 404, error: 'Experiment not found' };
  }

  if (experiment.status === 'RUNNING') {
    return { success: false, status: 409, error: 'Experiment is already running' };
  }
  if (experiment.status === 'COMPLETED') {
    return { success: false, status: 409, error: 'Experiment is already completed' };
  }
  if (experiment.status === 'FAILED') {
    return { success: false, status: 409, error: 'Experiment has failed and cannot be restarted' };
  }

  // Transition: PENDING → RUNNING
  updateExperiment(id, {
    status: 'RUNNING',
    startedAt: new Date().toISOString(),
  });

  try {
    // Activate the fault on the target service
    await targetService.activateFault(
      experiment.target,
      experiment.fault,
      experiment.parameters
    );

    console.log(`[EXPERIMENT] ${id} started — ${experiment.fault} on ${experiment.target} for ${experiment.duration}s`);

    // Schedule fault removal after duration
    const timer = setTimeout(async () => {
      activeTimers.delete(id);
      await completeExperiment(id);
    }, experiment.duration * 1000);

    activeTimers.set(id, timer);

    return { success: true, experiment: getExperiment(id) };
  } catch (err) {
    // Fault activation failed — try to recover
    console.error(`[EXPERIMENT] ${id} failed to activate fault: ${err.message}`);
    await bestEffortClear(experiment.target);

    updateExperiment(id, {
      status: 'FAILED',
      error: `Failed to activate fault: ${err.message}`,
      completedAt: new Date().toISOString(),
    });

    return {
      success: false,
      status: 502,
      error: `Failed to activate fault on ${experiment.target}: ${err.message}`,
    };
  }
}

// ---- Stop ----

async function stop(id) {
  const experiment = getExperiment(id);
  if (!experiment) {
    return { success: false, status: 404, error: 'Experiment not found' };
  }

  if (experiment.status !== 'RUNNING') {
    return { success: false, status: 409, error: `Cannot stop experiment with status: ${experiment.status}` };
  }

  // Cancel the duration timer
  const timer = activeTimers.get(id);
  if (timer) {
    clearTimeout(timer);
    activeTimers.delete(id);
  }

  // Clear the fault
  try {
    await targetService.clearFault(experiment.target);
  } catch (err) {
    console.error(`[EXPERIMENT] ${id} failed to clear fault on stop: ${err.message}`);
  }

  updateExperiment(id, {
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
  });

  console.log(`[EXPERIMENT] ${id} stopped early`);
  return { success: true, experiment: getExperiment(id) };
}

// ---- Internal helpers ----

async function completeExperiment(id) {
  const experiment = getExperiment(id);
  if (!experiment || experiment.status !== 'RUNNING') return;

  try {
    await targetService.clearFault(experiment.target);
    console.log(`[EXPERIMENT] ${id} completed — fault cleared`);
  } catch (err) {
    console.error(`[EXPERIMENT] ${id} failed to clear fault on completion: ${err.message}`);
    updateExperiment(id, {
      status: 'FAILED',
      error: `Failed to clear fault: ${err.message}`,
      completedAt: new Date().toISOString(),
    });
    return;
  }

  updateExperiment(id, {
    status: 'COMPLETED',
    completedAt: new Date().toISOString(),
  });
}

async function bestEffortClear(target) {
  try {
    await targetService.clearFault(target);
  } catch (err) {
    console.error(`[EXPERIMENT] best-effort fault clear failed: ${err.message}`);
  }
}

module.exports = { create, start, stop };
