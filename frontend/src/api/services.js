// ============================================================
// Services Health & Fault API — Phase 7
// ============================================================

import { request } from './client';
import { SERVICES } from '../utils/constants';

export async function checkServiceHealth(serviceId) {
  const service = SERVICES[serviceId];
  if (!service) throw new Error(`Unknown service ${serviceId}`);

  const start = performance.now();
  try {
    const res = await request(`${service.basePath}/health`, { timeout: 4000 });
    const latency = Math.round(performance.now() - start);
    return {
      serviceId,
      healthy: res.status === 200,
      latency,
      data: res.data,
      error: null,
    };
  } catch (err) {
    const latency = Math.round(performance.now() - start);
    return {
      serviceId,
      healthy: false,
      latency,
      data: null,
      error: err.message,
    };
  }
}

export async function checkServiceFault(serviceId) {
  const service = SERVICES[serviceId];
  if (!service || !service.canTarget) {
    return { fault: null };
  }

  try {
    const res = await request(`${service.basePath}/internal/faults`, { timeout: 3000 });
    return res.data || { fault: null };
  } catch (err) {
    return { fault: null, error: err.message };
  }
}

export async function fetchClusterOverview() {
  const serviceIds = Object.keys(SERVICES);

  const results = await Promise.all(
    serviceIds.map(async (id) => {
      const [healthRes, faultRes] = await Promise.all([
        checkServiceHealth(id),
        checkServiceFault(id),
      ]);

      const activeFault = faultRes.fault;
      let state = 'healthy';

      if (!healthRes.healthy) {
        state = 'failed';
      } else if (activeFault) {
        if (activeFault.fault === 'latency') {
          state = 'degraded';
        } else if (['error', 'unavailable'].includes(activeFault.fault)) {
          state = 'failed';
        }
      }

      return {
        id,
        ...SERVICES[id],
        healthy: healthRes.healthy,
        latency: healthRes.latency,
        activeFault,
        state,
        error: healthRes.error,
      };
    })
  );

  return results.reduce((acc, curr) => {
    acc[curr.id] = curr;
    return acc;
  }, {});
}

export async function clearServiceFault(serviceId) {
  const service = SERVICES[serviceId];
  if (!service) throw new Error(`Unknown service ${serviceId}`);

  const res = await request(`${service.basePath}/internal/faults`, {
    method: 'DELETE',
    timeout: 4000,
  });
  return res.data;
}

export async function injectServiceFault(serviceId, faultPayload) {
  const service = SERVICES[serviceId];
  if (!service) throw new Error(`Unknown service ${serviceId}`);

  const res = await request(`${service.basePath}/internal/faults`, {
    method: 'POST',
    body: faultPayload,
    timeout: 4000,
  });
  return res.data;
}
