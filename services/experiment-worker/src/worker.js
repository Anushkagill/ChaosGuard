// ============================================================
// Experiment Worker — Phase 10
// ============================================================
//
// This is the job processor for experiment jobs from the BullMQ queue.
//
// Responsibilities:
// 1. Receive an experiment job from the queue.
// 2. If loadConfig is absent: run legacy execution (activate -> sleep -> clear).
// 3. If loadConfig is present: execute three-phase load test
//    (Baseline load -> Chaos fault + load -> Recovery load) and compute metrics.
// 4. Guarantee fault cleanup on all exit paths using try / finally.
// 5. Explicitly track faultActivated and faultCleared across all lifecycle phases.
// 6. Return a complete result object with timestamps, fault lifecycle status,
//    and metrics summary.
//
// Safety Guarantees:
// - attempts is set to 1 — experiments must NOT auto-retry.
// - try / finally guarantees fault clearance if fault activation succeeded,
//   even when autocannon throws, times out, or comparison calculation fails.
// - Note on limitation: OS-level hard crashes (SIGKILL / container crash)
//   cannot execute in-process finally handlers. In that scenario, manual recovery
//   via GET/DELETE /internal/faults remains the safety procedure.
// ============================================================

const targetService = require('./services/target.service');
const { runLoadPhase } = require('./services/load.service');
const { computeComparison } = require('./utils/comparison');

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

/**
 * Legacy experiment execution without load testing (Phase 5/9 flow).
 */
async function processLegacyJob(job) {
  const { experimentId, target, fault, parameters, duration } = job.data;
  console.log(`[WORKER] Processing legacy experiment ${experimentId} — ${fault} on ${target} for ${duration}s`);
  await job.updateProgress({ phase: 'starting', experimentId });

  let faultActivated = false;
  let faultCleared = null;
  const startedAt = new Date().toISOString();

  try {
    // Step 1: Activate fault
    await targetService.activateFault(target, fault, parameters);
    faultActivated = true;
    await job.updateProgress({ phase: 'fault_activated', faultActivated: true, experimentId });
    console.log(`[WORKER] Experiment ${experimentId} — fault activated on ${target}`);

    // Step 2: Duration delay
    await sleep(duration * 1000);

    // Step 3: Clear fault
    await targetService.clearFault(target);
    faultCleared = true;
    const completedAt = new Date().toISOString();
    await job.updateProgress({ phase: 'fault_cleared', faultActivated: true, faultCleared: true, experimentId });
    console.log(`[WORKER] Experiment ${experimentId} — fault cleared on ${target}`);

    return {
      experimentId,
      startedAt,
      completedAt,
      faultActivated: true,
      faultCleared: true,
      metrics: null,
    };
  } catch (err) {
    console.error(`[WORKER] Legacy experiment ${experimentId} failed: ${err.message}`);
    if (faultActivated && faultCleared !== true) {
      faultCleared = await bestEffortClear(target);
      if (!faultCleared) {
        console.error(`[WORKER] CRITICAL: experiment ${experimentId} — fault may still be active on ${target}`);
      }
    }
    await job.updateProgress({ phase: 'failed', faultActivated, faultCleared: faultCleared ?? false, experimentId });
    throw err;
  }
}

/**
 * Three-phase controlled load testing experiment execution (Phase 10 flow).
 */
async function processLoadTestJob(job) {
  const { experimentId, target, fault, parameters, duration, loadConfig } = job.data;
  const ORDER_URL = process.env.ORDER_SERVICE_URL || 'http://order-service:3001';
  const orderTargetUrl = `${ORDER_URL}/orders`;

  const connections = Math.min(50, Math.max(1, parseInt(loadConfig.connections, 10) || 10));
  const baselineDuration = Math.min(60, Math.max(2, parseInt(loadConfig.baselineDuration, 10) || 10));
  const recoveryDuration = Math.min(60, Math.max(2, parseInt(loadConfig.recoveryDuration, 10) || 10));

  console.log(`[WORKER] Processing Phase 10 load experiment ${experimentId}:`);
  console.log(`         Target: ${fault} on ${target} (chaos: ${duration}s, connections: ${connections})`);
  console.log(`         Load destination: ${orderTargetUrl} (baseline: ${baselineDuration}s, recovery: ${recoveryDuration}s)`);

  let faultActivated = false;
  let faultCleared = null;
  const startedAt = new Date().toISOString();

  let baseline = null;
  let chaos = null;
  let recovery = null;

  try {
    // ── Phase 1: Baseline Load (Pre-Chaos) ──
    console.log(`[WORKER] Experiment ${experimentId} — Phase 1: Running baseline load (${baselineDuration}s)...`);
    await job.updateProgress({ phase: 'baseline', experimentId });
    baseline = await runLoadPhase({
      phase: 'baseline',
      url: orderTargetUrl,
      durationSec: baselineDuration,
      connections,
    });
    console.log(`[WORKER] Experiment ${experimentId} — Baseline completed: ${baseline.requests.total} reqs, errorRate: ${baseline.errorRate}`);

    // ── Phase 2: Fault Activation + Chaos Load ──
    try {
      console.log(`[WORKER] Experiment ${experimentId} — Phase 2: Activating ${fault} on ${target}...`);
      await targetService.activateFault(target, fault, parameters);
      faultActivated = true;
      await job.updateProgress({ phase: 'fault_activated', faultActivated: true, experimentId });
      await job.updateProgress({ phase: 'chaos', faultActivated: true, experimentId });

      console.log(`[WORKER] Experiment ${experimentId} — Phase 2: Running chaos load (${duration}s)...`);
      chaos = await runLoadPhase({
        phase: 'chaos',
        url: orderTargetUrl,
        durationSec: duration,
        connections,
      });
      console.log(`[WORKER] Experiment ${experimentId} — Chaos completed: ${chaos.requests.total} reqs, errorRate: ${chaos.errorRate}`);
    } finally {
      // CRITICAL GUARANTEE: The finally block ALWAYS executes if fault was activated,
      // even if runLoadPhase threw, timed out, or unhandled rejection occurred.
      if (faultActivated && faultCleared !== true) {
        try {
          await targetService.clearFault(target);
          faultCleared = true;
          await job.updateProgress({ phase: 'fault_cleared', faultActivated: true, faultCleared: true, experimentId });
          console.log(`[WORKER] Experiment ${experimentId} — fault successfully cleared from ${target}`);
        } catch (clearErr) {
          faultCleared = false;
          console.error(`[WORKER] CRITICAL: Failed to clear fault on ${target}: ${clearErr.message}`);
        }
      }
    }

    // ── Phase 3: Recovery Load (Post-Chaos) ──
    if (faultCleared === true) {
      console.log(`[WORKER] Experiment ${experimentId} — Phase 3: Running recovery load (${recoveryDuration}s)...`);
      await job.updateProgress({ phase: 'recovery', faultActivated: true, faultCleared: true, experimentId });
      recovery = await runLoadPhase({
        phase: 'recovery',
        url: orderTargetUrl,
        durationSec: recoveryDuration,
        connections,
      });
      console.log(`[WORKER] Experiment ${experimentId} — Recovery completed: ${recovery.requests.total} reqs, errorRate: ${recovery.errorRate}`);
    } else {
      console.warn(`[WORKER] Experiment ${experimentId} — Skipping recovery load because fault cleanup was not confirmed`);
    }

    // ── Phase 4: Comparison Analysis ──
    const comparison = (baseline && chaos && recovery)
      ? computeComparison(baseline, chaos, recovery, recoveryDuration)
      : null;

    const completedAt = new Date().toISOString();

    return {
      experimentId,
      startedAt,
      completedAt,
      faultActivated,
      faultCleared,
      metrics: {
        baseline,
        chaos,
        recovery,
        comparison,
      },
    };
  } catch (err) {
    console.error(`[WORKER] Load experiment ${experimentId} failed: ${err.message}`);

    if (faultActivated && faultCleared !== true) {
      faultCleared = await bestEffortClear(target);
    }

    await job.updateProgress({
      phase: 'failed',
      faultActivated,
      faultCleared: faultCleared ?? false,
      experimentId,
    });

    throw err;
  }
}

// The job processor function passed to the BullMQ Worker constructor.
async function processExperimentJob(job) {
  const { loadConfig } = job.data;
  if (!loadConfig) {
    return processLegacyJob(job);
  }
  return processLoadTestJob(job);
}

module.exports = {
  processExperimentJob,
  processLegacyJob,
  processLoadTestJob,
};
