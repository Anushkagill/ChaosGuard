const { ApiError } = require('../utils/ApiError');

// ============================================================
// Inventory Controller — Phase 6 (Simulated Dependency)
// ============================================================
//
// Simulates an inventory reservation check for Order Service.
// Does NOT implement persistent inventory state, databases,
// stock calculations, or real reservation logic.
//
// Exists purely as a controlled failure boundary for chaos experiments.
//
// Error handling: throws ApiError for validation errors.
// asyncHandler (applied in routes) catches and forwards to errorHandler.
// ============================================================

async function checkInventory(req, res) {
  const { item, quantity } = req.body;

  if (!item || typeof item !== 'string' || item.trim() === '') {
    throw new ApiError(400, 'item is required');
  }

  const qty = Number(quantity) > 0 ? Number(quantity) : 1;
  const reservationId = `res_${Date.now()}`;

  return res.status(200).json({
    available: true,
    item: item.trim(),
    quantity: qty,
    reservationId,
  });
}

function getHealth(req, res) {
  return res.json({ status: 'ok', service: 'inventory-service' });
}

module.exports = { checkInventory, getHealth };
