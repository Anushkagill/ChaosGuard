// ============================================================
// Experiment Worker — Phase 5
// ============================================================
//
// This is the job processor for experiment jobs from the BullMQ queue.
//
// Responsibilities:
// 1. Receive an experiment job from the queue.
// 2. Activate the requested fault on the target service.
// 3. Wait for the configured duration.
// 4. Clear the fault from the target service.
// 5. Return a result object with timestamps and fault lifecycle status.
//
// Safety:
// - attempts is set to 1 — experiments must NOT auto-retry.
//   Retrying could re-inject a fault after the original experiment
//   has partially executed, or inject a fault while a previous one
//   is still active.
// - faultActivated and faultCleared are tracked explicitly and stored
//   in job.progress before throwing, because a thrown error does not
//   provide a return value to BullMQ.
// ============================================================

const targetService = require('./services/target.service');

// Simple Promise-based delay.
function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

// Best-effort fault cleanup — does not throw on failure.
async function bestEffortClear(target) {
  try {
    await targetService.clearFault(target);
    return true;
  } catch (err) {
    console.error(`[WORKER] best-effort fault clear failed on ${target}: ${err.message}`);
    return false;
  }
}

// The job processor function passed to the BullMQ Worker constructor.
async function processExperimentJob(job) {
  const { experimentId, target, fault, parameters, duration } = job.data;

  console.log(`[WORKER] Processing experiment ${experimentId} — ${fault} on ${target} for ${duration}s`);
  await job.updateProgress({ phase: 'starting' });

  let faultActivated = false;
  const startedAt = new Date().toISOString();

  try {
    // Step 1: Activate the fault on the target service.
    await targetService.activateFault(target, fault, parameters);
    faultActivated = true;
    await job.updateProgress({ phase: 'fault_activated', faultActivated: true });
    console.log(`[WORKER] Experiment ${experimentId} — fault activated on ${target}`);

    // Step 2: Wait for the experiment duration.
    await sleep(duration * 1000);

    // Step 3: Clear the fault.
    await targetService.clearFault(target);
    const completedAt = new Date().toISOString();
    await job.updateProgress({ phase: 'fault_cleared', faultActivated: true, faultCleared: true });
    console.log(`[WORKER] Experiment ${experimentId} — fault cleared on ${target}`);

    return {
      experimentId,
      startedAt,
      completedAt,
      faultActivated: true,
      faultCleared: true,
    };
  } catch (err) {
    console.error(`[WORKER] Experiment ${experimentId} failed: ${err.message}`);

    // Best-effort cleanup — only attempt if fault was actually activated.
    let faultCleared = !faultActivated; // if fault was never activated, there is nothing to clear
    if (faultActivated) {
      faultCleared = await bestEffortClear(target);
      if (!faultCleared) {
        console.error(`[WORKER] CRITICAL: experiment ${experimentId} — fault may still be active on ${target}`);
      }
    }

    // Store cleanup status in progress before throwing, because thrown errors
    // do not allow a return value — the API reads job.progress for failed jobs.
    await job.updateProgress({ phase: 'failed', faultActivated, faultCleared });

    throw err; // BullMQ marks the job as 'failed'
  }
}

module.exports = { processExperimentJob };
