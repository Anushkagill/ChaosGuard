const express = require('express');
const { asyncHandler } = require('../utils/asynchandler');
const { createOrder, getHealth } = require('../controllers/order.controller');

// The router is responsible for only one thing:
// defining which HTTP method + path maps to which controller function.
// It does not contain business logic.
// Async controllers are wrapped with asyncHandler to forward errors to errorHandler.
const router = express.Router();

router.post('/orders', asyncHandler(createOrder));
router.get('/health', getHealth);

module.exports = router;

