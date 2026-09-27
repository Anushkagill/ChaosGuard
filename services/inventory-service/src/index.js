const express = require('express');
const faultInjection = require('./middlewares/fault.middleware');
const inventoryRoutes = require('./routes/inventory.routes');
const internalRoutes = require('./routes/internal.routes');
const { errorHandler } = require('./middlewares/error.middleware');

// index.js is responsible for:
// 1. Creating the Express application
// 2. Adding middleware (express.json, fault injection)
// 3. Mounting the routes (inventory + internal fault control)
// 4. Mounting the centralized error handler (must be last)
// 5. Starting the server
// 6. Reading PORT from environment (default: 3004)

const app = express();
app.use(express.json());
app.use(faultInjection);

const PORT = process.env.PORT || 3004;

app.use('/', inventoryRoutes);
app.use('/', internalRoutes);

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`inventory-service running on port ${PORT}`);
});
