const express = require('express');
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
// ============================================================

const router = express.Router();

router.post('/internal/faults', activateFault);
router.delete('/internal/faults', deactivateFault);
router.get('/internal/faults', getFault);

module.exports = router;
