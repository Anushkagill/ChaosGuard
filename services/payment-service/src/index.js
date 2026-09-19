const express = require('express');
const faultInjection = require('./middlewares/fault.middleware');
const paymentRoutes = require('./routes/payment.routes');
const internalRoutes = require('./routes/internal.routes');
const { errorHandler } = require('./middlewares/error.middleware');

// index.js is responsible for:
// 1. Creating the Express application
// 2. Adding middleware (express.json, fault injection)
// 3. Mounting the routes (payment + internal fault control)
// 4. Mounting the centralized error handler (must be last)
// 5. Starting the server
// 6. Reading PORT from environment
//
// It does NOT contain route definitions, validation, or business logic.
// Those responsibilities live in routes/, controllers/, middleware/, and state/.

const app = express();
app.use(express.json()); // parse incoming JSON bodies so req.body is available
app.use(faultInjection); // Phase 3+4: controlled fault injection (disabled by default)

const PORT = process.env.PORT || 3002;

app.use('/', paymentRoutes);   // public payment API
app.use('/', internalRoutes);  // Phase 4: internal fault control API

// Centralized error handler — must be mounted after all routes.
// Catches any error thrown or passed via next(err) from controllers.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`payment-service running on port ${PORT}`);
});
