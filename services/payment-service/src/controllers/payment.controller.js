// The payment controller is responsible for:
// 1. Reading request data (orderId, amount from req.body)
// 2. Validating the input
// 3. Generating a paymentId
// 4. Returning the payment response
//
// Payment Service has no outgoing HTTP calls, so there is no service layer here.
// The controller handles the full payment logic directly.

function processPayment(req, res) {
  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId and amount are required' });
  } // 400 = Bad Request

  const paymentId = `pay_${Date.now()}`;

  return res.status(201).json({
    paymentId,
    orderId,
    amount,
    status: 'success',
    processedAt: new Date().toISOString(),
  }); // 201 = Created
}

function getHealth(req, res) {
  return res.json({ status: 'ok', service: 'payment-service' });
}

module.exports = { processPayment, getHealth };
