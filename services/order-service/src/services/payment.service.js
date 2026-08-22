const axios = require('axios');

// The URL of Payment Service is read from the environment.
// This keeps the service address configurable without changing code.
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002';

// This service module is responsible for one thing:
// making the HTTP call to Payment Service.
// The controller does not need to know that Axios is being used,
// or what URL Payment Service lives at.
async function requestPayment(orderId, amount) {
  const response = await axios.post(`${PAYMENT_SERVICE_URL}/payments`, {
    orderId,
    amount,
  }, {
    timeout: 5000,
    timeoutErrorMessage: 'payment timeout',
  });

  return response.data;
}

module.exports = { requestPayment };
