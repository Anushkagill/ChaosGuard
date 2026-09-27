const { ApiError } = require('../utils/ApiError');

// ============================================================
// Auth Controller — Phase 6 (Simulated Dependency)
// ============================================================
//
// Simulates an authentication boundary for Order Service.
// Does NOT implement real authentication (no JWT, passwords,
// sessions, databases, or token generation).
//
// Exists purely as a controlled failure boundary for chaos experiments.
//
// Error handling: throws ApiError for validation errors.
// asyncHandler (applied in routes) catches and forwards to errorHandler.
// ============================================================

async function validateToken(req, res) {
  const { token } = req.body;

  if (!token || typeof token !== 'string' || token.trim() === '') {
    throw new ApiError(400, 'token is required');
  }

  // Deterministic mock user identifier derived from the token string
  const userId = `user_${token.trim().slice(0, 8)}`;

  return res.status(200).json({
    valid: true,
    userId,
  });
}

function getHealth(req, res) {
  return res.json({ status: 'ok', service: 'auth-service' });
}

module.exports = { validateToken, getHealth };
