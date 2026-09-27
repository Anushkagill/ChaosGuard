const express = require('express');
const { asyncHandler } = require('../utils/asynchandler');
const { checkInventory, getHealth } = require('../controllers/inventory.controller');

const router = express.Router();

router.post('/inventory/check', asyncHandler(checkInventory));
router.get('/health', getHealth);

module.exports = router;
