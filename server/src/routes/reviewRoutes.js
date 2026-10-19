const express = require('express');
const { createReview, getPackageReviews } = require('../controllers/reviewController');
const { protect } = require('../middleware/auth');

const router = express.Router();

// Customer creates review for COMPLETED booking
router.post('/', protect, createReview);

// Public view package reviews
router.get('/package/:id', getPackageReviews);

module.exports = router;
