const express = require('express');
const { asyncHandler } = require('../utils/asynchandler');
const {
  createExperiment,
  listExperiments,
  getExperimentById,
  startExperiment,
  stopExperiment,
  getHealth,
} = require('../controllers/experiment.controller');

// Route definitions — maps HTTP method + path to controller functions.
// No business logic here.
// Async controllers are wrapped with asyncHandler to forward errors to errorHandler.
const router = express.Router();

router.post('/experiments', asyncHandler(createExperiment));
router.get('/experiments', asyncHandler(listExperiments));
router.get('/experiments/:id', asyncHandler(getExperimentById));
router.post('/experiments/:id/start', asyncHandler(startExperiment));
router.post('/experiments/:id/stop', asyncHandler(stopExperiment));
router.get('/health', getHealth);

module.exports = router;

