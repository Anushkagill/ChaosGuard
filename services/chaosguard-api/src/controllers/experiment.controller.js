// ============================================================
// Experiment Controller — Phase 4
// ============================================================
//
// Handles HTTP request/response for experiment endpoints.
// Delegates business logic to experiment.service.js.
//
// Error handling: throws ApiError for validation/lifecycle errors.
// asyncHandler (applied in routes) catches and forwards to errorHandler.
// ============================================================

const { getExperiment, getAllExperiments } = require('../models/experiment.model');
const experimentService = require('../services/experiment.service');
const { ApiError } = require('../utils/ApiError');

// POST /experiments
async function createExperiment(req, res) {
  const { target, fault, parameters, duration } = req.body;

  const result = experimentService.create({ target, fault, parameters, duration });

  if (!result.success) {
    throw new ApiError(400, 'Invalid experiment', result.errors);
  }

  return res.status(201).json(result.experiment);
}

// GET /experiments
async function listExperiments(req, res) {
  const experiments = getAllExperiments();
  return res.status(200).json(experiments);
}

// GET /experiments/:id
async function getExperimentById(req, res) {
  const experiment = getExperiment(req.params.id);
  if (!experiment) {
    throw new ApiError(404, 'Experiment not found');
  }
  return res.status(200).json(experiment);
}

// POST /experiments/:id/start
async function startExperiment(req, res) {
  const result = await experimentService.start(req.params.id);

  if (!result.success) {
    throw new ApiError(result.status, result.error);
  }

  return res.status(200).json(result.experiment);
}

// POST /experiments/:id/stop
async function stopExperiment(req, res) {
  const result = await experimentService.stop(req.params.id);

  if (!result.success) {
    throw new ApiError(result.status, result.error);
  }

  return res.status(200).json(result.experiment);
}

// GET /health
function getHealth(req, res) {
  return res.json({ status: 'ok', service: 'chaosguard-api' });
}

module.exports = {
  createExperiment,
  listExperiments,
  getExperimentById,
  startExperiment,
  stopExperiment,
  getHealth,
};

