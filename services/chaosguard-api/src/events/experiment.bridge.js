// ============================================================
// BullMQ QueueEvents -> SSE Bridge — Phase 9
// ============================================================
//
// Bridges BullMQ background worker events to real-time SSE broadcasts.
//
// Key Responsibilities & Guarantees:
// 1. Explicit Job-to-Experiment Mapping:
//    QueueEvents provides BullMQ `jobId`. We resolve the corresponding
//    ChaosGuard experiment using `getExperimentByJobId(jobId)`, with a fallback
//    to fetching `job.data.experimentId` from the queue directly.
// 2. Dual Sync (Push + Authoritative Pull):
//    As events fire, we update the in-memory experiment model immediately.
//    The existing GET /experiments/:id endpoint remains authoritative and
//    syncStatusFromQueue() is preserved for snapshot recovery and reconnects.
// 3. Precise Semantic Events:
//    - `experiment_started`: worker picked up the job (status: RUNNING)
//    - `fault_injected`: worker successfully activated the fault on the target
//    - `fault_cleared`: worker cleared the fault from the target
//    - `experiment_completed`: job completed successfully (status: COMPLETED)
//    - `experiment_failed`: job failed (status: FAILED, error details)
//    (Observed service health is not guessed or faked here — it is handled
//     by health checks and probe telemetry.)
// ============================================================

const { QueueEvents } = require('bullmq');
const {
  getExperiment,
  getExperimentByJobId,
  updateExperiment,
} = require('../models/experiment.model');
const { getJob } = require('../queues/experiment.queue');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'experiments';

function parseRedisUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 6379,
  };
}

let queueEventsInstance = null;

/**
 * Resolves an experiment object given a BullMQ jobId.
 *
 * @param {string} jobId
 * @returns {Promise<Object|null>} The experiment record or null
 */
async function resolveExperiment(jobId) {
  if (!jobId) return null;

  // 1. Fast lookup from in-memory model
  let experiment = getExperimentByJobId(jobId);
  if (experiment) return experiment;

  // 2. Fallback: inspect job data from Redis queue
  try {
    const job = await getJob(jobId);
    if (job && job.data && job.data.experimentId) {
      experiment = getExperiment(job.data.experimentId);
      if (experiment) {
        updateExperiment(experiment.id, { jobId: String(jobId) });
        return experiment;
      }
    }
  } catch (err) {
    console.warn(`[BRIDGE] Failed to resolve experiment for job ${jobId}: ${err.message}`);
  }

  return null;
}

/**
 * Initializes the BullMQ QueueEvents listener and wires it to the SSE broadcast function.
 *
 * @param {Function} broadcast - The SSE broadcast function
 * @returns {QueueEvents} The initialized QueueEvents instance
 */
function initExperimentBridge(broadcast) {
  if (queueEventsInstance) {
    return queueEventsInstance;
  }

  const connection = parseRedisUrl(REDIS_URL);
  const queueEvents = new QueueEvents(QUEUE_NAME, { connection });
  queueEventsInstance = queueEvents;

  console.log(`[BRIDGE] Connected to BullMQ QueueEvents on queue: ${QUEUE_NAME}`);

  // Event 1: Worker picked up job -> RUNNING
  queueEvents.on('active', async ({ jobId }) => {
    try {
      const experiment = await resolveExperiment(jobId);
      if (!experiment) {
        console.warn(`[BRIDGE] active event: experiment not found for job ${jobId}`);
        return;
      }

      const startedAt = experiment.startedAt || new Date().toISOString();
      updateExperiment(experiment.id, {
        status: 'RUNNING',
        startedAt,
      });

      console.log(`[BRIDGE] Experiment ${experiment.id} started (RUNNING)`);

      broadcast('experiment_started', {
        experimentId: experiment.id,
        target: experiment.target,
        fault: experiment.fault,
        parameters: experiment.parameters,
        duration: experiment.duration,
        status: 'RUNNING',
        startedAt,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[BRIDGE] Error handling active event for job ${jobId}:`, err);
    }
  });

  // Event 2: Worker progress updates (fault_activated, fault_cleared, baseline, chaos, recovery)
  queueEvents.on('progress', async ({ jobId, data }) => {
    try {
      const experiment = await resolveExperiment(jobId);
      if (!experiment) return;

      let progressData = data;
      if (typeof progressData === 'string') {
        try {
          progressData = JSON.parse(progressData);
        } catch (_) {
          progressData = { phase: data };
        }
      }

      if (!progressData || !progressData.phase) return;

      if (progressData.phase === 'baseline') {
        console.log(`[BRIDGE] Experiment ${experiment.id} — load baseline phase started`);
        broadcast('load_baseline_started', {
          experimentId: experiment.id,
          target: experiment.target,
          timestamp: new Date().toISOString(),
        });
      } else if (progressData.phase === 'chaos') {
        console.log(`[BRIDGE] Experiment ${experiment.id} — load chaos phase started`);
        broadcast('load_chaos_started', {
          experimentId: experiment.id,
          target: experiment.target,
          fault: experiment.fault,
          timestamp: new Date().toISOString(),
        });
      } else if (progressData.phase === 'recovery') {
        console.log(`[BRIDGE] Experiment ${experiment.id} — load recovery phase started`);
        broadcast('load_recovery_started', {
          experimentId: experiment.id,
          target: experiment.target,
          timestamp: new Date().toISOString(),
        });
      } else if (progressData.phase === 'fault_activated') {
        console.log(`[BRIDGE] Experiment ${experiment.id} — fault activated on ${experiment.target}`);
        broadcast('fault_injected', {
          experimentId: experiment.id,
          target: experiment.target,
          fault: experiment.fault,
          parameters: experiment.parameters,
          faultActivated: true,
          timestamp: new Date().toISOString(),
        });
      } else if (progressData.phase === 'fault_cleared') {
        console.log(`[BRIDGE] Experiment ${experiment.id} — fault cleared on ${experiment.target}`);
        broadcast('fault_cleared', {
          experimentId: experiment.id,
          target: experiment.target,
          faultCleared: true,
          timestamp: new Date().toISOString(),
        });
      }
    } catch (err) {
      console.error(`[BRIDGE] Error handling progress event for job ${jobId}:`, err);
    }
  });

  // Event 3: Job completed
  queueEvents.on('completed', async ({ jobId, returnvalue }) => {
    try {
      const experiment = await resolveExperiment(jobId);
      if (!experiment) return;

      let result = returnvalue;
      if (typeof result === 'string') {
        try {
          result = JSON.parse(result);
        } catch (_) {}
      }

      const completedAt = result?.completedAt || new Date().toISOString();
      const faultCleared = result?.faultCleared ?? true;
      const metrics = result?.metrics || null;

      updateExperiment(experiment.id, {
        status: 'COMPLETED',
        completedAt,
        faultCleared,
        metrics,
      });

      console.log(`[BRIDGE] Experiment ${experiment.id} completed. faultCleared: ${faultCleared}, hasMetrics: ${!!metrics}`);

      broadcast('experiment_completed', {
        experimentId: experiment.id,
        target: experiment.target,
        status: 'COMPLETED',
        faultCleared,
        completedAt,
        metrics,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[BRIDGE] Error handling completed event for job ${jobId}:`, err);
    }
  });

  // Event 4: Job failed
  queueEvents.on('failed', async ({ jobId, failedReason }) => {
    try {
      const experiment = await resolveExperiment(jobId);
      if (!experiment) return;

      let faultCleared = false;
      try {
        const job = await getJob(jobId);
        if (job && job.progress && job.progress.faultCleared !== undefined) {
          faultCleared = job.progress.faultCleared;
        }
      } catch (_) {}

      const completedAt = new Date().toISOString();
      const errorMsg = failedReason || 'Worker execution failed';

      updateExperiment(experiment.id, {
        status: 'FAILED',
        error: errorMsg,
        completedAt,
        faultCleared,
      });

      console.error(`[BRIDGE] Experiment ${experiment.id} failed: ${errorMsg}`);

      broadcast('experiment_failed', {
        experimentId: experiment.id,
        target: experiment.target,
        status: 'FAILED',
        error: errorMsg,
        faultCleared,
        completedAt,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error(`[BRIDGE] Error handling failed event for job ${jobId}:`, err);
    }
  });

  queueEvents.on('error', (err) => {
    console.error('[BRIDGE] QueueEvents error:', err.message);
  });

  return queueEvents;
}

/**
 * Closes the QueueEvents connection (used during graceful shutdown).
 */
async function closeExperimentBridge() {
  if (queueEventsInstance) {
    try {
      await queueEventsInstance.close();
      queueEventsInstance = null;
      console.log('[BRIDGE] QueueEvents connection closed.');
    } catch (err) {
      console.warn('[BRIDGE] Error closing QueueEvents:', err.message);
    }
  }
}

module.exports = {
  initExperimentBridge,
  closeExperimentBridge,
  resolveExperiment,
};
