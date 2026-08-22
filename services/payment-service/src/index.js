const express = require('express');
const paymentRoutes = require('./routes/payment.routes');

// index.js is responsible for:
// 1. Creating the Express application
// 2. Adding middleware (express.json)
// 3. Mounting the routes
// 4. Starting the server
// 5. Reading PORT from environment
//
// It does NOT contain route definitions, validation, or business logic.
// Those responsibilities live in routes/ and controllers/.

const app = express();
app.use(express.json()); // parse incoming JSON bodies so req.body is available

const PORT = process.env.PORT || 3002;

app.use('/', paymentRoutes); // mount all payment-service routes

app.listen(PORT, () => {
  console.log(`payment-service running on port ${PORT}`);
});
