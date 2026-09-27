const axios = require('axios');

// The URL of Auth Service is read from the environment.
// This keeps the service address configurable without changing code.
const AUTH_SERVICE_URL = process.env.AUTH_SERVICE_URL || 'http://localhost:3003';

// This service module is responsible for one thing:
// making the HTTP call to Auth Service to validate tokens.
async function validateToken(token) {
  const response = await axios.post(`${AUTH_SERVICE_URL}/auth/validate`, {
    token,
  }, {
    timeout: 5000,
    timeoutErrorMessage: 'auth timeout',
  });

  return response.data;
}

module.exports = { validateToken };
