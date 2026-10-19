const express = require('express');
const {
  getPackages,
  getPackageById,
  createPackage,
  updatePackage,
  deletePackage
} = require('../controllers/packageController');
const { protect, authorize } = require('../middleware/auth');

const router = express.Router();

// Public read routes
router.get('/', getPackages);
router.get('/:id', getPackageById);

// Admin catalog routes
router.post('/', protect, authorize('admin'), createPackage);
router.patch('/:id', protect, authorize('admin'), updatePackage);
router.delete('/:id', protect, authorize('admin'), deletePackage);

module.exports = router;
