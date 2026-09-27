// ============================================================
// Experiment Service — Phase 5
// ============================================================
//
// Contains the core experiment logic:
// - Validation
// - Lifecycle management (PENDING → QUEUED → RUNNING → COMPLETED/FAILED)
// - Enqueuing experiment jobs to BullMQ (execution moved to worker)
// - Status synchronisation from BullMQ job state
// - Stop handling (remove queued job OR clear fault directly on target)
//
// Phase 5 change from Phase 4:
// - start() no longer executes experiments in-process.
//   Instead it adds a job to BullMQ and returns immediately.
// - The experiment-worker service consumes the job and handles
//   fault activation, duration, and cleanup.
// - The API process learns about worker progress on demand, by
//   checking the BullMQ job state in syncStatusFromQueue().
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
const experimentQueue = require('../queues/experiment.queue');

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
//
// Phase 5: transitions PENDING → QUEUED and adds a BullMQ job.
// Returns immediately after enqueueing — does not wait for the experiment to run.

async function start(id) {
  const experiment = getExperiment(id);
  if (!experiment) {
    return { success: false, status: 404, error: 'Experiment not found' };
  }

  if (experiment.status === 'QUEUED') {
    return { success: false, status: 409, error: 'Experiment is already queued' };
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

  // Transition: PENDING → QUEUED
  updateExperiment(id, {
    status: 'QUEUED',
    queuedAt: new Date().toISOString(),
  });

  try {
    const job = await experimentQueue.addExperimentJob({
      experimentId: id,
      target: experiment.target,
      fault: experiment.fault,
      parameters: experiment.parameters,
      duration: experiment.duration,
    });

    // Store the BullMQ job ID so we can look it up later during status sync.
    updateExperiment(id, { jobId: job.id });

    console.log(`[EXPERIMENT] ${id} queued — BullMQ job ${job.id}`);
    return { success: true, experiment: getExperiment(id) };
  } catch (err) {
    // Failed to enqueue — roll back to PENDING so the experiment can be retried.
    console.error(`[EXPERIMENT] ${id} failed to enqueue: ${err.message}`);
    updateExperiment(id, {
      status: 'PENDING',
      queuedAt: null,
    });
    return {
      success: false,
      status: 502,
      error: `Failed to enqueue experiment: ${err.message}`,
    };
  }
}

// ---- Stop ----
//
// Handles stopping an experiment that is in QUEUED or RUNNING state.
//
// QUEUED: Remove the job from the queue before the worker picks it up.
// RUNNING: Call clearFault directly on the target (the worker will detect
//          the fault is already cleared and finish gracefully).

async function stop(id) {
  let experiment = getExperiment(id);
  if (!experiment) {
    return { success: false, status: 404, error: 'Experiment not found' };
  }

  if (experiment.status === 'COMPLETED') {
    return { success: false, status: 409, error: 'Cannot stop experiment with status: COMPLETED' };
  }
  if (experiment.status === 'FAILED') {
    return { success: false, status: 409, error: 'Cannot stop experiment with status: FAILED' };
  }
  if (experiment.status === 'PENDING') {
    return { success: false, status: 409, error: 'Cannot stop experiment with status: PENDING' };
  }

  // Synchronise latest status from BullMQ if in a transitional state
  if (['QUEUED', 'RUNNING'].includes(experiment.status) && experiment.jobId) {
    experiment = await syncStatusFromQueue(experiment);
  }

  // Re-check status after sync in case it completed or failed in the meantime
  if (experiment.status === 'COMPLETED' || experiment.status === 'FAILED') {
    return { success: false, status: 409, error: `Cannot stop experiment with status: ${experiment.status}` };
  }

  if (experiment.status === 'QUEUED') {
    // Attempt to remove from queue before the worker picks it up.
    let removed = false;
    try {
      const job = await experimentQueue.getJob(experiment.jobId);
      if (job) {
        await job.remove();
        removed = true;
      }
    } catch (err) {
      console.warn(`[EXPERIMENT] ${id} stop: job could not be removed from queue: ${err.message}`);
    }

    if (removed) {
      updateExperiment(id, {
        status: 'COMPLETED',
        faultCleared: true, // no fault was ever activated
        completedAt: new Date().toISOString(),
      });

      console.log(`[EXPERIMENT] ${id} stopped while queued — no fault was activated`);
      return { success: true, experiment: getExperiment(id) };
    }

    // If job could not be removed (e.g. worker has already locked/started it),
    // treat as RUNNING to guarantee the target fault is cleared safely.
    console.log(`[EXPERIMENT] ${id} job was locked by worker, treating as RUNNING for safe stop`);
    experiment = updateExperiment(id, { status: 'RUNNING' });
  }

  if (experiment.status === 'RUNNING') {
    // Clear fault directly on target service (worker will detect and finish gracefully)
    let faultCleared = false;
    try {
      await targetService.clearFault(experiment.target);
      faultCleared = true;
    } catch (err) {
      console.error(`[EXPERIMENT] ${id} stop: failed to clear fault: ${err.message}`);
    }

    updateExperiment(id, {
      status: 'COMPLETED',
      faultCleared,
      completedAt: new Date().toISOString(),
    });

    console.log(`[EXPERIMENT] ${id} stopped early — faultCleared: ${faultCleared}`);
    return { success: true, experiment: getExperiment(id) };
  }

  return { success: false, status: 409, error: `Cannot stop experiment with status: ${experiment.status}` };
}

// ---- Status synchronisation ----
//
// The API process does not receive push notifications from the worker.
// When the experiment is in a transitional state (QUEUED or RUNNING),
// this function checks the BullMQ job state and synchronises the
// in-memory experiment record.
//
// Called by the controller on GET /experiments/:id.

async function syncStatusFromQueue(experiment) {
  if (!experiment.jobId) return experiment;

  let job;
  try {
    job = await experimentQueue.getJob(experiment.jobId);
  } catch (err) {
    console.error(`[EXPERIMENT] ${experiment.id} syncStatus: failed to get job: ${err.message}`);
    return experiment;
  }

  if (!job) return experiment;

  const state = await job.getState();

  if (state === 'completed' && experiment.status !== 'COMPLETED') {
    const result = job.returnvalue;
    updateExperiment(experiment.id, {
      status: 'COMPLETED',
      startedAt: result?.startedAt || experiment.startedAt,
      completedAt: result?.completedAt || new Date().toISOString(),
      faultCleared: result?.faultCleared ?? null,
    });
  } else if (state === 'failed' && experiment.status !== 'FAILED') {
    // For failed jobs, faultCleared is stored in job.progress (not returnvalue)
    // because a thrown error does not allow a BullMQ return value.
    updateExperiment(experiment.id, {
      status: 'FAILED',
      error: job.failedReason || 'Worker execution failed',
      completedAt: new Date().toISOString(),
      faultCleared: job.progress?.faultCleared ?? false,
    });
  } else if (state === 'active' && experiment.status === 'QUEUED') {
    updateExperiment(experiment.id, {
      status: 'RUNNING',
      startedAt: new Date().toISOString(),
    });
  }

  return getExperiment(experiment.id);
}

module.exports = { create, start, stop, syncStatusFromQueue };
