const express = require('express');//express is framework for building web applications
//it helps in recieving http request and sending response and creating routes for api

const axios = require('axios');//axios helps in making http requests basically sending them
//here axios will help in sending http to payment-service/payments endpoint

const app = express();
app.use(express.json());//middleware for parsing json and making it available as req.body

const PORT = process.env.PORT || 3001;
const PAYMENT_SERVICE_URL = process.env.PAYMENT_SERVICE_URL || 'http://localhost:3002';

app.post('/orders', async (req, res) => {//async because it may take time as payment will be completed first
  const { item, amount } = req.body;

  if (!item || !amount) {
    return res.status(400).json({ error: 'item and amount are required' });
  }

  const orderId = `ord_${Date.now()}`;

  try {
    const paymentResponse = await axios.post(`${PAYMENT_SERVICE_URL}/payments`, {
      orderId,
      amount,
    }, {
      timeout: 5000,
      timeoutErrorMessage: 'payment timeout'
    });

    return res.status(201).json({
      orderId,
      item,
      amount,
      payment: paymentResponse.data,
    });
  } catch (err) {
    return res.status(502).json({
      error: 'Payment service error',
      details: err.message,
    });//502=bad gateway means payment service is down something like that
  }
});

app.get('/health', (_req, res) => res.json({ status: 'ok', service: 'order-service' }));

app.listen(PORT, () => {
  console.log(`order-service running on port ${PORT}`);
});
