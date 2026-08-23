const express = require('express');
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
const router = express.Router();

router.post('/experiments', createExperiment);
router.get('/experiments', listExperiments);
router.get('/experiments/:id', getExperimentById);
router.post('/experiments/:id/start', startExperiment);
router.post('/experiments/:id/stop', stopExperiment);
router.get('/health', getHealth);

module.exports = router;
