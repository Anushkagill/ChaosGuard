const { validateToken } = require('../services/auth.service');
const { checkInventory } = require('../services/inventory.service');
const { requestPayment } = require('../services/payment.service');
const { ApiError } = require('../utils/ApiError');

// ============================================================
// Order Controller — Phase 6
// ============================================================
//
// The order controller coordinates the order fulfillment flow:
// 1. Validates incoming input (item, amount, optional token).
// 2. Calls Auth Service to validate the token (sequential Step 1).
// 3. Calls Inventory Service to check/reserve stock (sequential Step 2).
// 4. Calls Payment Service to process payment (sequential Step 3).
// 5. Returns the composite order response.
//
// Failure propagation & dependency boundaries:
// - Sequential execution makes failure propagation clear and observable.
// - Auth failure halts the pipeline before Inventory or Payment are invoked.
// - Inventory failure halts the pipeline before Payment is invoked.
// - Each upstream failure throws a distinct 502 Bad Gateway error.
// ============================================================

async function createOrder(req, res) {
  const { item, amount } = req.body;

  if (!item || !amount) {
    throw new ApiError(400, 'item and amount are required');
  }

  // Preserve backward compatibility while ensuring every order passes
  // through Auth Service. If no token is provided in the body or Authorization header,
  // default to a simulated token so the Auth boundary is always executed.
  const token = (req.body.token && typeof req.body.token === 'string' && req.body.token.trim())
    ? req.body.token.trim()
    : (req.headers['authorization'] || 'simulated-guest-token');

  const orderId = `ord_${Date.now()}`;
  const quantity = req.body.quantity || 1;

  // Step 1: Sequential dependency call — Auth Service
  let auth;
  try {
    auth = await validateToken(token);
    if (!auth || !auth.valid) {
      throw new ApiError(401, 'Authentication failed');
    }
  } catch (err) {
    if (err instanceof ApiError) throw err;
    throw new ApiError(502, 'Auth service error', [err.message]);
  }

  // Step 2: Sequential dependency call — Inventory Service
  let inventory;
  try {
    inventory = await checkInventory(item, quantity);
  } catch (err) {
    throw new ApiError(502, 'Inventory service error', [err.message]);
  }

  // Step 3: Sequential dependency call — Payment Service
  let payment;
  try {
    payment = await requestPayment(orderId, amount);
  } catch (err) {
    throw new ApiError(502, 'Payment service error', [err.message]);
  }

  return res.status(201).json({
    orderId,
    item,
    amount,
    auth,
    inventory,
    payment,
  });
}

function getHealth(req, res) {
  return res.json({ status: 'ok', service: 'order-service' });
}

module.exports = { createOrder, getHealth };
