const express = require('express');
const {
  createComplaint,
  getMyComplaints,
  getComplaintById,
  getAllComplaints,
  updateComplaint,
  addComplaintNote
} = require('../controllers/complaintController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Customer own complaints list (placed before /:id)
router.get('/mine', protect, getMyComplaints);

// Employee & Admin view all complaints
router.get('/', protect, authorize('employee', 'admin'), getAllComplaints);

// Customer submits complaint
router.post('/', protect, createComplaint);

// View single complaint
router.get('/:id', protect, getComplaintById);

// Employee & Admin update status / assign
router.patch('/:id', protect, authorize('employee', 'admin'), updateComplaint);

// Employee & Admin add resolution/internal note
router.post('/:id/notes', protect, authorize('employee', 'admin'), addComplaintNote);

module.exports = router;
