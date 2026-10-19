const express = require('express');
const NotificationLog = require('../models/NotificationLog');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

/**
 * GET /api/v1/admin/notifications
 * List notification logs (Admin only)
 */
router.get('/', protect, authorize('admin'), async (req, res, next) => {
  try {
    const { channel, status, page = 1, limit = 50 } = req.query;
    const query = {};

    if (channel) query.channel = channel.toUpperCase();
    if (status) query.status = status.toUpperCase();

    const skip = (Number(page) - 1) * Number(limit);
    const [notifications, total] = await Promise.all([
      NotificationLog.find(query)
        .populate('user', 'name email role')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(Number(limit)),
      NotificationLog.countDocuments(query)
    ]);

    res.status(200).json({
      success: true,
      count: notifications.length,
      total,
      page: Number(page),
      pages: Math.ceil(total / Number(limit)),
      notifications
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
