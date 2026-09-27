const express = require('express');
const { asyncHandler } = require('../utils/asynchandler');
const { validateToken, getHealth } = require('../controllers/auth.controller');

const router = express.Router();

router.post('/auth/validate', asyncHandler(validateToken));
router.get('/health', getHealth);

module.exports = router;
