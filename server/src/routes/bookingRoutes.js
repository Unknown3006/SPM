const express = require('express');
const {
  createBooking,
  getMyBookings,
  getBookingById,
  getCancelPreview,
  cancelBooking,
  hideBooking,
  getAllBookings,
  updateBookingStatus,
  assignBookingAgent
} = require('../controllers/bookingController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Customer personal bookings (must be placed before /:id)
router.get('/mine', protect, getMyBookings);

// Admin & Employee view all bookings
router.get('/', protect, authorize('employee', 'admin'), getAllBookings);

// Create booking
router.post('/', protect, createBooking);

// Individual booking operations
router.get('/:id', protect, getBookingById);
router.get('/:id/cancel-preview', protect, getCancelPreview);
router.post('/:id/cancel', protect, cancelBooking);
router.patch('/:id/hide', protect, hideBooking);

// Employee/Admin updates
router.patch('/:id/status', protect, authorize('employee', 'admin'), updateBookingStatus);
router.patch('/:id/assign', protect, authorize('employee', 'admin'), assignBookingAgent);

module.exports = router;
