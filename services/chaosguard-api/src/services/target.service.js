// ============================================================
// Target Service — Phase 4
// ============================================================
//
// Responsible for HTTP communication with target microservices
// to activate and deactivate faults at runtime.
//
// This module isolates Axios calls from the controller layer,
// following the same pattern as order-service/services/payment.service.js.
// ============================================================

const axios = require('axios');

// Map of supported target services to their base URLs.
// URLs come from environment variables so they work in Docker.
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
