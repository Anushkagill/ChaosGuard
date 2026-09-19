const express = require('express');
const { asyncHandler } = require('../utils/asynchandler');
const { processPayment, getHealth } = require('../controllers/payment.controller');

// The router maps HTTP method + path to the appropriate controller function.
// No business logic lives here.
// Controllers are wrapped with asyncHandler to forward errors to errorHandler.
const router = express.Router();

router.post('/payments', asyncHandler(processPayment));
router.get('/health', getHealth);

module.exports = router;

