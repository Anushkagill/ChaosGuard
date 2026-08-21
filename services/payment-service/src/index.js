const express = require('express');

const app = express();
app.use(express.json());//middleware for parsing json and making it available as req.body

const PORT = process.env.PORT || 3002;

app.post('/payments', (req, res) => {
  const { orderId, amount } = req.body;

  if (!orderId || !amount) {
    return res.status(400).json({ error: 'orderId and amount are required' });
  }//400=bad request

  const paymentId = `pay_${Date.now()}`;

  return res.status(201).json({
    paymentId,
    orderId,
    amount,
    status: 'success',
    processedAt: new Date().toISOString(),
  });
});//201=created successfully

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'payment-service' }));
//_req because  recieved req but it do not need to use it

app.listen(PORT, () => {
  console.log(`payment-service running on port ${PORT}`);
});
