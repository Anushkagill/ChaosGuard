const express = require('express');
const { asyncHandler } = require('../utils/asynchandler');
const { activateFault, deactivateFault, getFault } = require('../controllers/internal.controller');

// ============================================================
// Internal Routes — Phase 4
// ============================================================
//
// These routes are used by ChaosGuard to control faults at
// runtime. They are NOT part of the public Payment API.
//
// POST   /internal/faults — activate a fault
// DELETE /internal/faults — clear the active fault
// GET    /internal/faults — check current fault state
//
// Handlers are wrapped with asyncHandler to forward errors to errorHandler.
// ============================================================

const router = express.Router();

router.post('/internal/faults', asyncHandler(activateFault));
router.delete('/internal/faults', asyncHandler(deactivateFault));
router.get('/internal/faults', asyncHandler(getFault));

module.exports = router;

