const express = require('express');
const experimentRoutes = require('./routes/experiment.routes');

// index.js is responsible for:
// 1. Creating the Express application
// 2. Adding middleware (express.json)
// 3. Mounting the routes
// 4. Starting the server
// 5. Reading PORT from environment

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use('/', experimentRoutes);

app.listen(PORT, () => {
  console.log(`chaosguard-api running on port ${PORT}`);
});
