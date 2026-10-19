const express = require('express');
const {
  getTransportServices,
  getTransportById,
  createTransport,
  updateTransport,
  deleteTransport
} = require('../controllers/transportController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

router.get('/', getTransportServices);
router.get('/:id', getTransportById);

// Admin catalog routes
router.post('/', protect, authorize('admin'), createTransport);
router.patch('/:id', protect, authorize('admin'), updateTransport);
router.delete('/:id', protect, authorize('admin'), deleteTransport);

module.exports = router;
