const express = require('express');
const travelService = require('../services/providers/travelService');

const router = express.Router();

// Get provider simulation status
router.get('/status', (req, res) => {
  res.status(200).json({
    success: true,
    ...travelService.getSimulationStatus()
  });
});

// Toggle simulated failure (for testing provider fallback)
router.post('/simulate-failure', (req, res) => {
  const { enabled } = req.body;
  const status = travelService.setSimulateFailure(Boolean(enabled));

  res.status(200).json({
    success: true,
    message: `External provider failure simulation is now ${status.simulateFailure ? 'ENABLED' : 'DISABLED'}`,
    ...status
  });
});

module.exports = router;
