const axios = require('axios');

// The URL of Inventory Service is read from the environment.
// This keeps the service address configurable without changing code.
const INVENTORY_SERVICE_URL = process.env.INVENTORY_SERVICE_URL || 'http://localhost:3004';

// This service module is responsible for one thing:
// making the HTTP call to Inventory Service to check/reserve items.
async function checkInventory(item, quantity = 1) {
  const response = await axios.post(`${INVENTORY_SERVICE_URL}/inventory/check`, {
    item,
    quantity,
  }, {
    timeout: 5000,
    timeoutErrorMessage: 'inventory timeout',
  });

  return response.data;
}

module.exports = { checkInventory };
