const { requestPayment } = require('../services/payment.service');
const { ApiError } = require('../utils/ApiError');

// The controller is responsible for:
// 1. Reading request data (item, amount from req.body)
// 2. Performing basic validation
// 3. Calling the payment service
// 4. Returning the HTTP response
//
// Error handling: throws ApiError for validation and upstream errors.
// asyncHandler (applied in routes) catches and forwards to errorHandler.
//
// It does NOT know about Axios, HTTP URLs, or payment service internals.
// That is the job of payment.service.js.

async function createOrder(req, res) {
  const { item, amount } = req.body;

  if (!item || !amount) {
    throw new ApiError(400, 'item and amount are required');
  }

  const orderId = `ord_${Date.now()}`;

  try {
    const payment = await requestPayment(orderId, amount);

    return res.status(201).json({
      orderId,
      item,
      amount,
      payment,
    });
  } catch (err) {
    throw new ApiError(502, 'Payment service error', [err.message]);
    // 502 = Bad Gateway — the upstream dependency (Payment Service) failed
  }
}

function getHealth(req, res) {
  return res.json({ status: 'ok', service: 'order-service' });
}

module.exports = { createOrder, getHealth };

