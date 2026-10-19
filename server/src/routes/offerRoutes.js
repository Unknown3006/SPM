const express = require('express');
const {
  getActiveOffers,
  validateOffer,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer
} = require('../controllers/offerController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public routes
router.get('/active', getActiveOffers);
router.post('/validate', validateOffer);

// Admin routes
router.get('/', protect, authorize('admin'), getAllOffers);
router.post('/', protect, authorize('admin'), createOffer);
router.patch('/:id', protect, authorize('admin'), updateOffer);
router.delete('/:id', protect, authorize('admin'), deleteOffer);

module.exports = router;
