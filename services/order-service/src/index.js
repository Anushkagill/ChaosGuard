const express = require('express');
const orderRoutes = require('./routes/order.routes');

// index.js is responsible for:
// 1. Creating the Express application
// 2. Adding middleware (express.json)
// 3. Mounting the routes
// 4. Starting the server
// 5. Reading PORT from environment
//
// It does NOT contain route definitions, validation, or business logic.
// Those responsibilities live in routes/, controllers/, and services/.

const app = express();
app.use(express.json()); // parse incoming JSON bodies so req.body is available

const PORT = process.env.PORT || 3001;

app.use('/', orderRoutes); // mount all order-service routes

app.listen(PORT, () => {
  console.log(`order-service running on port ${PORT}`);
});
