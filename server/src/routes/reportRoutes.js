const express = require('express');
const {
  getStats,
  getRevenueTrend,
  getBookingsReport
} = require('../controllers/reportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// General dashboard stats (accessible by employee & admin)
router.get('/stats', protect, authorize('employee', 'admin'), getStats);

// Revenue trends for charts (accessible by employee & admin)
router.get('/revenue', protect, authorize('employee', 'admin'), getRevenueTrend);

// Bookings table / CSV / PDF export (accessible by employee & admin)
router.get('/bookings', protect, authorize('employee', 'admin'), getBookingsReport);

module.exports = router;
