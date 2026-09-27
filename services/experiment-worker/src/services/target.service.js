// ============================================================
// Target Service — Phase 5 (Worker)
// ============================================================
//
// Responsible for HTTP communication with target microservices
// to activate and deactivate faults at runtime.
//
// This is a copy of chaosguard-api/src/services/target.service.js.
// The worker needs its own copy because it is a separate process
// with its own environment variables.
//
// In a future phase this could be extracted to a shared package,
// but that abstraction is not justified yet.
// ============================================================

const axios = require('axios');

// Map of supported target services to their base URLs.
// URLs come from environment variables so they work inside Docker.
const TARGET_URLS = {
  'payment-service': process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002',
};

async function activateFault(target, fault, parameters) {
  const baseUrl = TARGET_URLS[target];
  if (!baseUrl) {
    throw new Error(`Unknown target service: ${target}`);
  }

  const response = await axios.post(`${baseUrl}/internal/faults`, {
    fault,
    parameters,
  }, {
    timeout: 5000,
  });

  return response.data;
}

async function clearFault(target) {
  const baseUrl = TARGET_URLS[target];
  if (!baseUrl) {
    throw new Error(`Unknown target service: ${target}`);
  }

  const response = await axios.delete(`${baseUrl}/internal/faults`, {
    timeout: 5000,
  });

  return response.data;
}

module.exports = { activateFault, clearFault };
