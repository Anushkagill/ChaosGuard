// ============================================================
// Experiments API — Phase 7
// ============================================================

import { request } from './client';

function normalizeExperiment(exp) {
  if (!exp) return exp;
  return {
    ...exp,
    target: exp.target || exp.targetService,
    targetService: exp.targetService || exp.target,
    fault: exp.fault || exp.faultType,
    faultType: exp.faultType || exp.fault,
    parameters: exp.parameters || exp.faultConfig || {},
    faultConfig: exp.faultConfig || exp.parameters || {},
  };
}

export async function listExperiments() {
  const res = await request('/api/chaosguard/experiments');
  const list = res.data || [];
  return list.map(normalizeExperiment);
}

export async function getExperiment(id) {
  const res = await request(`/api/chaosguard/experiments/${id}`);
  return normalizeExperiment(res.data);
}

export async function createExperiment(payload) {
  const target = payload.target || payload.targetService;
  const fault = payload.fault || payload.faultType;
  const parameters = payload.parameters || payload.faultConfig || {};
  const duration = Number(payload.duration) || 10;

  const res = await request('/api/chaosguard/experiments', {
    method: 'POST',
    body: {
      target,
      fault,
      parameters,
      duration,
    },
  });
  return normalizeExperiment(res.data);
}

export async function startExperiment(id) {
  const res = await request(`/api/chaosguard/experiments/${id}/start`, {
    method: 'POST',
  });
  return normalizeExperiment(res.data);
}

export async function stopExperiment(id) {
  const res = await request(`/api/chaosguard/experiments/${id}/stop`, {
    method: 'POST',
  });
  return normalizeExperiment(res.data);
}
