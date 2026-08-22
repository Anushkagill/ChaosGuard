const express = require('express');
const { processPayment, getHealth } = require('../controllers/payment.controller');

// The router maps HTTP method + path to the appropriate controller function.
// No business logic lives here.
const router = express.Router();

router.post('/payments', processPayment);
router.get('/health', getHealth);

module.exports = router;
