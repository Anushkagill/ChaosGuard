const express = require('express');
const experimentRoutes = require('./routes/experiment.routes');
const { router: sseRouter, broadcast, closeAllClients } = require('./routes/sse.routes');
const { initExperimentBridge, closeExperimentBridge } = require('./events/experiment.bridge');
const { errorHandler } = require('./middlewares/error.middleware');

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;

// Mount SSE stream route before parameterized /experiments/:id routes
app.use('/', sseRouter);
app.use('/', experimentRoutes);

// Centralized error handler — must be mounted after all routes.
app.use(errorHandler);

const server = app.listen(PORT, () => {
  console.log(`chaosguard-api running on port ${PORT}`);
  // Initialize BullMQ QueueEvents -> SSE bridge
  initExperimentBridge(broadcast);
});

// Graceful shutdown handling
async function shutdown() {
  console.log('[API] Gracefully shutting down...');
  closeAllClients();
  await closeExperimentBridge();
  server.close(() => {
    console.log('[API] Server closed.');
    process.exit(0);
  });
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
