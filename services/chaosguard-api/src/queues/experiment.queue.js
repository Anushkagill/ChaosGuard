// ============================================================
// Experiment Queue — Phase 5 (Producer)
// ============================================================
//
// This module is the producer side of the experiment job queue.
// It is used by the ChaosGuard API to add experiment jobs to BullMQ.
//
// The worker (services/experiment-worker) is the consumer side.
//
// Both the API and the worker connect to the same Redis instance,
// using the same queue name ('experiments'), which is how BullMQ
// routes jobs from producer to consumer.
//
// Safety:
// - attempts: 1 — experiments must NOT auto-retry. Retrying could
//   re-inject a fault after the original experiment has partially
//   executed, or inject a fault while a previous one is still active.
// - removeOnComplete: false — keep completed jobs so the API can
//   read their result (faultCleared, timestamps) via syncStatusFromQueue.
// - removeOnFail: false — keep failed jobs so the API can read their
//   failure reason and faultCleared status via syncStatusFromQueue.
// ============================================================

const { Queue } = require('bullmq');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const QUEUE_NAME = 'experiments';

// Parse the Redis URL for ioredis connection options expected by BullMQ.
// BullMQ accepts a connection object: { host, port }.
function parseRedisUrl(url) {
  const parsed = new URL(url);
  return {
    host: parsed.hostname,
    port: parseInt(parsed.port, 10) || 6379,
  };
}

const connection = parseRedisUrl(REDIS_URL);

const experimentQueue = new Queue(QUEUE_NAME, { connection });

// Default job options applied to every experiment job.
const JOB_OPTIONS = {
  attempts: 1,          // No automatic retries — see safety note above.
  removeOnComplete: false,
  removeOnFail: false,
};

/**
 * Adds an experiment job to the BullMQ queue.
 *
 * @param {Object} jobData
 * @param {string} jobData.experimentId - The experiment record ID.
 * @param {string} jobData.target       - The target service name (e.g. 'payment-service').
 * @param {string} jobData.fault        - The fault type (e.g. 'latency').
 * @param {Object} jobData.parameters  - Fault parameters (e.g. { latencyMs: 3000 }).
 * @param {number} jobData.duration    - Experiment duration in seconds.
 * @returns {Promise<Job>} The BullMQ Job object.
 */
async function addExperimentJob(jobData) {
  const job = await experimentQueue.add('experiment', jobData, JOB_OPTIONS);
  console.log(`[QUEUE] Added experiment job ${job.id} for experiment ${jobData.experimentId}`);
  return job;
}

/**
 * Retrieves a BullMQ job by its ID.
 * Used by syncStatusFromQueue to check job state.
 *
 * @param {string} jobId
 * @returns {Promise<Job|null>}
 */
async function getJob(jobId) {
  return experimentQueue.getJob(jobId);
}

module.exports = { addExperimentJob, getJob };
