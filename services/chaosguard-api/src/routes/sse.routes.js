// ============================================================
// Server-Sent Events (SSE) Route & Broadcaster — Phase 9
// ============================================================
//
// Provides a real-time event stream at GET /experiments/stream.
//
// Architectural guarantees:
// 1. Single API instance: Active SSE clients are tracked in an
//    in-memory Set. Suitable for single-instance chaosguard-api.
// 2. Safe lifecycle: Heartbeat intervals are cleared immediately on
//    client disconnect or error, preventing memory/timer leaks.
// 3. Write-error resilience: Any client write failure automatically
//    removes the response object from the active clients Set.
// 4. Standard SSE formatting:
//      event: <eventName>\n
//      data: <JSON>\n\n
// ============================================================

const express = require('express');
const router = express.Router();

const clients = new Set();
const HEARTBEAT_INTERVAL_MS = 15000;

/**
 * GET /experiments/stream
 * Client endpoint for subscribing to real-time experiment updates.
 */
router.get('/experiments/stream', (req, res) => {
  // Set required headers for Server-Sent Events
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    'Connection': 'keep-alive',
    'X-Accel-Buffering': 'no',
  });

  if (typeof res.flushHeaders === 'function') {
    res.flushHeaders();
  }

  // Send initial connection comment to immediately confirm stream establishment
  res.write(':connected\n\n');

  clients.add(res);
  console.log(`[SSE] Client connected. Active clients: ${clients.size}`);

  let isCleanedUp = false;
  let heartbeatTimer = null;

  function cleanup() {
    if (isCleanedUp) return;
    isCleanedUp = true;

    if (heartbeatTimer) {
      clearInterval(heartbeatTimer);
      heartbeatTimer = null;
    }

    clients.delete(res);
    console.log(`[SSE] Client disconnected. Active clients: ${clients.size}`);

    try {
      res.end();
    } catch (_) {
      // Ignore errors when ending already closed response
    }
  }

  // Periodic heartbeat comment to keep the connection alive through proxies
  heartbeatTimer = setInterval(() => {
    try {
      res.write(':heartbeat\n\n');
    } catch (err) {
      console.warn(`[SSE] Heartbeat failed for a client: ${err.message}`);
      cleanup();
    }
  }, HEARTBEAT_INTERVAL_MS);

  // Safely clean up on client disconnect or connection errors
  req.on('close', cleanup);
  req.on('end', cleanup);
  res.on('error', cleanup);
  res.on('finish', cleanup);
});

/**
 * Broadcast an event to all connected SSE clients.
 *
 * @param {string} event - The SSE event name (e.g. 'fault_injected', 'experiment_completed')
 * @param {Object} data  - JSON-serializable event payload
 */
function broadcast(event, data) {
  if (clients.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const client of Array.from(clients)) {
    try {
      client.write(payload);
    } catch (err) {
      console.warn(`[SSE] Broadcast write error: ${err.message}. Removing client.`);
      clients.delete(client);
      try {
        client.end();
      } catch (_) {}
    }
  }
}

/**
 * Returns current number of active SSE client connections.
 */
function getConnectedClientsCount() {
  return clients.size;
}

/**
 * Closes all active SSE connections (used during graceful shutdown).
 */
function closeAllClients() {
  for (const client of Array.from(clients)) {
    try {
      client.end();
    } catch (_) {}
  }
  clients.clear();
}

module.exports = {
  router,
  broadcast,
  getConnectedClientsCount,
  closeAllClients,
};
