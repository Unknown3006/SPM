const express = require('express');
const mongoose = require('mongoose');

const router = express.Router();

router.get('/health', (req, res) => {
  const dbState = mongoose.connection.readyState;
  const statusMap = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting'
  };

  res.status(200).json({
    success: true,
    message: 'TMS API is active',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    database: statusMap[dbState] || 'unknown'
  });
});

module.exports = router;
