const express = require('express');
const orderRoutes = require('./routes/order.routes');
const { errorHandler } = require('./middlewares/error.middleware');

// index.js is responsible for:
// 1. Creating the Express application
// 2. Adding middleware (express.json)
// 3. Mounting the routes
// 4. Mounting the centralized error handler (must be last)
// 5. Starting the server
// 6. Reading PORT from environment
//
// It does NOT contain route definitions, validation, or business logic.
// Those responsibilities live in routes/, controllers/, and services/.

const app = express();
app.use(express.json()); // parse incoming JSON bodies so req.body is available

const PORT = process.env.PORT || 3001;

app.use('/', orderRoutes); // mount all order-service routes

// Centralized error handler — must be mounted after all routes.
// Catches any error thrown or passed via next(err) from controllers.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`order-service running on port ${PORT}`);
});
