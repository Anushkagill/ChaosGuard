const express = require('express');
const { createOrder, getHealth } = require('../controllers/order.controller');

// The router is responsible for only one thing:
// defining which HTTP method + path maps to which controller function.
// It does not contain business logic.
const router = express.Router();

router.post('/orders', createOrder);
router.get('/health', getHealth);

module.exports = router;
