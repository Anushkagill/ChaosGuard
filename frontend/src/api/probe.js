// ============================================================
// System Order Probe API — Phase 7
// ============================================================

import { request } from './client';

export async function runOrderProbe({
  item = 'probe-item',
  amount = 100,
  token = 'valid-token',
  quantity = 1,
} = {}) {
  const start = performance.now();
  try {
    const res = await request('/api/order/orders', {
      method: 'POST',
      body: { item, amount, token, quantity },
      timeout: 10000,
    });

    const duration = Math.round(performance.now() - start);

    return {
      success: true,
      status: res.status,
      duration,
      elapsedMs: duration,
      orderId: res.data?.orderId || res.data?.data?.orderId || `ord_${Date.now()}`,
      raw: res.data,
      data: res.data,
      steps: {
        auth: { success: true },
        inventory: { success: true },
        payment: { success: true },
      },
      stepBreakdown: {
        auth: { status: 'pass', data: res.data?.auth },
        inventory: { status: 'pass', data: res.data?.inventory },
        payment: { status: 'pass', data: res.data?.payment },
      },
    };
  } catch (err) {
    const duration = Math.round(performance.now() - start);
    const msg = (err.data && err.data.message) || err.message || '';

    let failedStep = 'unknown';
    const steps = {
      auth: { success: false, skipped: false },
      inventory: { success: false, skipped: true },
      payment: { success: false, skipped: true },
    };

    if (msg.includes('Auth service error')) {
      failedStep = 'auth';
      steps.auth = { success: false, error: msg };
      steps.inventory = { skipped: true };
      steps.payment = { skipped: true };
    } else if (msg.includes('Inventory service error')) {
      failedStep = 'inventory';
      steps.auth = { success: true };
      steps.inventory = { success: false, error: msg };
      steps.payment = { skipped: true };
    } else if (msg.includes('Payment service error')) {
      failedStep = 'payment';
      steps.auth = { success: true };
      steps.inventory = { success: true };
      steps.payment = { success: false, error: msg };
    } else {
      failedStep = 'auth';
      steps.auth = { success: false, error: msg };
    }

    return {
      success: false,
      status: err.status || 502,
      duration,
      elapsedMs: duration,
      error: msg,
      failedStep,
      raw: err.data || { error: msg },
      data: err.data,
      steps,
      stepBreakdown: {
        auth: { status: steps.auth.success ? 'pass' : steps.auth.skipped ? 'unreached' : 'fail' },
        inventory: { status: steps.inventory.success ? 'pass' : steps.inventory.skipped ? 'unreached' : 'fail' },
        payment: { status: steps.payment.success ? 'pass' : steps.payment.skipped ? 'unreached' : 'fail' },
      },
    };
  }
}

export default runOrderProbe;
