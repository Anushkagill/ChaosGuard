// ============================================================
// Experiment Worker Entry Point — Phase 5
// ============================================================
//
// This is the entry point for the experiment-worker process.
// It is NOT an HTTP server — it does not listen on any port.
//
// Responsibilities:
// - Connect to Redis.
// - Create a BullMQ Worker that listens on the 'experiments' queue.
// - Process experiment jobs using the processor defined in worker.js.
//
// The worker runs as a separate Docker container from chaosguard-api.
// It communicates with target services via HTTP over the Docker network.
// It never shares in-process state with the API.
// ============================================================

const { Worker } = require('bullmq');
const { processExperimentJob } = require('./worker');

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

console.log(`[WORKER] Starting — connecting to Redis at ${REDIS_URL}`);
console.log(`[WORKER] Listening on queue: ${QUEUE_NAME}`);

const worker = new Worker(QUEUE_NAME, processExperimentJob, {
  connection,
  // attempts is enforced at the job level when the API adds the job.
  // The worker itself does not configure retry behavior.
  concurrency: 1,
});

worker.on('completed', (job, result) => {
  console.log(`[WORKER] Job ${job.id} completed — experiment ${result.experimentId}, faultCleared: ${result.faultCleared}`);
});

worker.on('failed', (job, err) => {
  console.error(`[WORKER] Job ${job.id} failed — ${err.message}`);
});

worker.on('error', (err) => {
  console.error(`[WORKER] Worker error: ${err.message}`);
});

// Graceful shutdown: allow the current job to finish before exiting.
async function shutdown() {
  console.log('[WORKER] Shutting down gracefully...');
  await worker.close();
  console.log('[WORKER] Shutdown complete.');
  process.exit(0);
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
