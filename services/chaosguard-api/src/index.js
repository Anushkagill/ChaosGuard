const express = require('express');
const experimentRoutes = require('./routes/experiment.routes');
const { errorHandler } = require('./middlewares/error.middleware');

// index.js is responsible for:
// 1. Creating the Express application
// 2. Adding middleware (express.json)
// 3. Mounting the routes
// 4. Mounting the centralized error handler (must be last)
// 5. Starting the server
// 6. Reading PORT from environment

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/', experimentRoutes);

// Centralized error handler — must be mounted after all routes.
// Catches any error thrown or passed via next(err) from controllers.
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`chaosguard-api running on port ${PORT}`);
});
