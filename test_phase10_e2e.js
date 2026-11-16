// ============================================================
// Phase 10 End-to-End Comprehensive Verification Suite
// (Uses native fetch — no external npm dependencies required)
// ============================================================

const API_BASE = 'http://localhost:3000';
const ORDER_BASE = 'http://localhost:3001';
const PAYMENT_BASE = 'http://localhost:3002';
const AUTH_BASE = 'http://localhost:3003';
const INVENTORY_BASE = 'http://localhost:3004';

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function request(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  let data = null;
  const text = await res.text();
  try {
    data = JSON.parse(text);
  } catch (_) {
    data = text;
  }
  return { status: res.status, ok: res.ok, data };
}

async function waitForStatus(id, targetStatuses, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const res = await request(`${API_BASE}/experiments/${id}`);
    const exp = res.data?.data || res.data;
    if (exp && targetStatuses.includes(exp.status)) {
      return exp;
    }
    await sleep(1000);
  }
  throw new Error(`Timeout waiting for experiment ${id} to reach ${targetStatuses.join('/')}`);
}

async function runTests() {
  console.log('====================================================');
  console.log('   ChaosGuard Phase 10 — End-to-End Verification    ');
  console.log('====================================================\n');

  // ── Stage 1: Health Checks ──
  console.log('[STAGE 1] Health Checks on all 5 microservices:');
  const endpoints = [
    { name: 'ChaosGuard API', url: `${API_BASE}/health` },
    { name: 'Order Service', url: `${ORDER_BASE}/health` },
    { name: 'Payment Service', url: `${PAYMENT_BASE}/health` },
    { name: 'Auth Service', url: `${AUTH_BASE}/health` },
    { name: 'Inventory Service', url: `${INVENTORY_BASE}/health` },
  ];

  for (const ep of endpoints) {
    const res = await request(ep.url);
    if (res.status === 200) {
      console.log(`  ✓ ${ep.name} healthy (200 OK)`);
    } else {
      throw new Error(`${ep.name} returned status ${res.status}`);
    }
  }

  // ── Stage 2: Baseline Order Flow & Validation Schema ──
  console.log('\n[STAGE 2] Verifying Baseline Order Flow & Schema Validation:');
  const orderPayload = {
    item: 'chaos-load-probe',
    amount: 100,
    quantity: 1,
    token: 'simulated-guest-token',
  };
  const orderRes = await request(`${ORDER_BASE}/orders`, {
    method: 'POST',
    body: JSON.stringify(orderPayload),
  });
  if (orderRes.status === 201 && orderRes.data.orderId && orderRes.data.auth?.valid) {
    console.log(`  ✓ Baseline Order processed: ID ${orderRes.data.orderId}, Auth valid, Payment processed`);
  } else {
    throw new Error(`Baseline order failed: ${JSON.stringify(orderRes.data)}`);
  }

  // ── Stage 3: Backend Input Validation Guardrails ──
  console.log('\n[STAGE 3] Testing Backend Input Validation & Security Bounds:');
  const badRes = await request(`${API_BASE}/experiments`, {
    method: 'POST',
    body: JSON.stringify({
      target: 'payment-service',
      fault: 'latency',
      parameters: { latencyMs: 2000 },
      duration: 5,
      loadConfig: {
        connections: 100, // Exceeds max 50
        baselineDuration: 1, // Below min 2
        url: 'http://malicious-external-site.com', // Unauthorized destination override
      },
    }),
  });

  if (badRes.status === 400 && badRes.data.errors) {
    console.log('  ✓ Correctly rejected invalid loadConfig with 400 Bad Request');
    console.log('    Validation errors:', badRes.data.errors);
  } else {
    throw new Error(`Expected 400 rejection, got status: ${badRes.status}`);
  }

  // ── Stage 4: Legacy Experiment Verification (Backward Compatibility) ──
  console.log('\n[STAGE 4] Testing Legacy Experiment (No loadConfig):');
  const legCreate = await request(`${API_BASE}/experiments`, {
    method: 'POST',
    body: JSON.stringify({
      target: 'payment-service',
      fault: 'latency',
      parameters: { latencyMs: 1500 },
      duration: 3,
    }),
  });
  const legExp = legCreate.data?.data || legCreate.data;
  console.log(`  Created legacy experiment: ${legExp.id}`);

  await request(`${API_BASE}/experiments/${legExp.id}/start`, { method: 'POST' });
  console.log(`  Started ${legExp.id}, waiting for completion...`);
  const legResult = await waitForStatus(legExp.id, ['COMPLETED', 'FAILED']);

  if (legResult.status === 'COMPLETED' && legResult.faultCleared === true && legResult.metrics === null) {
    console.log(`  ✓ Legacy experiment completed successfully: faultCleared=${legResult.faultCleared}, metrics=${legResult.metrics}`);
  } else {
    throw new Error(`Legacy experiment failed verification: ${JSON.stringify(legResult)}`);
  }

  // ── Stage 5: Phase 10 Controlled Load Testing (Latency Fault) ──
  console.log('\n[STAGE 5] Testing Phase 10 Load Testing with Latency Fault on Payment Service:');
  const loadCreate = await request(`${API_BASE}/experiments`, {
    method: 'POST',
    body: JSON.stringify({
      target: 'payment-service',
      fault: 'latency',
      parameters: { latencyMs: 2000 },
      duration: 4,
      loadConfig: {
        connections: 5,
        baselineDuration: 3,
        recoveryDuration: 3,
      },
    }),
  });
  const loadExp = loadCreate.data?.data || loadCreate.data;
  console.log(`  Created Phase 10 experiment: ${loadExp.id} (baseline: 3s, chaos: 4s, recovery: 3s)`);

  await request(`${API_BASE}/experiments/${loadExp.id}/start`, { method: 'POST' });
  console.log(`  Started ${loadExp.id}, awaiting 3-phase execution (~11s)...`);
  const loadResult = await waitForStatus(loadExp.id, ['COMPLETED', 'FAILED'], 40000);

  if (loadResult.status !== 'COMPLETED') {
    throw new Error(`Load experiment failed: ${loadResult.error}`);
  }

  console.log(`  ✓ Experiment ${loadResult.id} completed. faultCleared: ${loadResult.faultCleared}`);
  const m = loadResult.metrics;
  if (!m || !m.baseline || !m.chaos || !m.recovery || !m.comparison) {
    throw new Error(`Missing metrics data in result: ${JSON.stringify(loadResult)}`);
  }

  console.log('\n  Measured Telemetry:');
  console.log(`    Phase 1 (Baseline): total=${m.baseline.requests.total}, rps=${m.baseline.throughput.avgRps}, p95=${m.baseline.latency.p95}ms, errRate=${m.baseline.errorRate}`);
  console.log(`    Phase 2 (Chaos):    total=${m.chaos.requests.total}, rps=${m.chaos.throughput.avgRps}, p95=${m.chaos.latency.p95}ms, errRate=${m.chaos.errorRate}`);
  console.log(`    Phase 3 (Recovery): total=${m.recovery.requests.total}, rps=${m.recovery.throughput.avgRps}, p95=${m.recovery.latency.p95}ms, errRate=${m.recovery.errorRate}`);

  console.log('\n  Calculated Comparison & Recovery:');
  console.log(`    Tail Latency p95 Impact: +${m.comparison.latencyImpact.p95DeltaMs}ms`);
  console.log(`    Error Rate Impact:       ${m.comparison.errorRateImpact}`);
  console.log(`    Throughput Delta:        ${m.comparison.throughputImpactRps} req/s`);
  console.log(`    Latency Recovered:       ${m.comparison.latencyRecovered}`);
  console.log(`    Error Rate Recovered:    ${m.comparison.errorRateRecovered}`);
  console.log(`    Recovery Assessment:     ${m.comparison.recoveryAssessment}`);
  console.log(`    Observation Window:      ${m.comparison.recoveryWindowSec}s`);

  // Assertions
  if (m.chaos.latency.p95 < 1500) {
    throw new Error(`Expected chaos p95 to reflect 2000ms injected latency, got: ${m.chaos.latency.p95}ms`);
  }
  if (m.recovery.latency.p95 > 500) {
    throw new Error(`Expected recovery p95 to return to nominal bounds, got: ${m.recovery.latency.p95}ms`);
  }
  if (m.comparison.latencyRecovered !== true) {
    throw new Error(`Expected latencyRecovered to be true, got: ${m.comparison.latencyRecovered}`);
  }
  console.log('  ✓ Multi-phase latency degradation and recovery asserted successfully!');

  // ── Stage 6: Phase 10 Controlled Load Testing (Error Fault) ──
  console.log('\n[STAGE 6] Testing Phase 10 Load Testing with Error Fault on Auth Service:');
  const errCreate = await request(`${API_BASE}/experiments`, {
    method: 'POST',
    body: JSON.stringify({
      target: 'auth-service',
      fault: 'error',
      duration: 3,
      loadConfig: {
        connections: 5,
        baselineDuration: 2,
        recoveryDuration: 2,
      },
    }),
  });
  const errExp = errCreate.data?.data || errCreate.data;
  console.log(`  Created Phase 10 error experiment: ${errExp.id}`);

  await request(`${API_BASE}/experiments/${errExp.id}/start`, { method: 'POST' });
  console.log(`  Started ${errExp.id}, awaiting 3-phase execution (~8s)...`);
  const errResult = await waitForStatus(errExp.id, ['COMPLETED', 'FAILED'], 30000);

  if (errResult.status !== 'COMPLETED') {
    throw new Error(`Error experiment failed: ${errResult.error}`);
  }

  const em = errResult.metrics;
  console.log('\n  Measured Telemetry:');
  console.log(`    Baseline Error Rate: ${em.baseline.errorRate * 100}%`);
  console.log(`    Chaos Error Rate:    ${(em.chaos.errorRate * 100).toFixed(1)}%`);
  console.log(`    Recovery Error Rate: ${(em.recovery.errorRate * 100).toFixed(1)}%`);
  console.log(`    Error Rate Recovered: ${em.comparison.errorRateRecovered}`);
  console.log(`    Recovery Assessment:  ${em.comparison.recoveryAssessment}`);

  if (em.chaos.errorRate < 0.8) {
    throw new Error(`Expected chaos error rate >= 80% due to Auth failure cascade, got: ${em.chaos.errorRate}`);
  }
  if (em.recovery.errorRate > 0.1) {
    throw new Error(`Expected recovery error rate <= 10%, got: ${em.recovery.errorRate}`);
  }
  if (em.comparison.errorRateRecovered !== true) {
    throw new Error(`Expected errorRateRecovered to be true, got: ${em.comparison.errorRateRecovered}`);
  }
  console.log('  ✓ Multi-phase error cascade and recovery asserted successfully!');

  // ── Stage 7: Safety & Fault Cleanup Check on Target ──
  console.log('\n[STAGE 7] Verifying Safety & Target Clean State:');
  const authFault = await request(`${AUTH_BASE}/internal/faults`);
  const payFault = await request(`${PAYMENT_BASE}/internal/faults`);
  if (!authFault.data.data && !payFault.data.data) {
    console.log('  ✓ Confirmed all targets have activeFault = null in runtime memory');
  } else {
    throw new Error('Target still has active fault in memory');
  }

  console.log('\n====================================================');
  console.log('  ✓ ALL 7 VERIFICATION STAGES PASSED SUCCESSFULLY!  ');
  console.log('====================================================\n');
}

runTests().catch((err) => {
  console.error('\n❌ Verification Failed:', err.message);
  process.exit(1);
});
