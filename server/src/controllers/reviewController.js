const Review = require('../models/Review');
const Booking = require('../models/Booking');
const TourPackage = require('../models/TourPackage');

/**
 * POST /api/v1/reviews
 * Submit a review for a completed tour booking
 */
const createReview = async (req, res, next) => {
  try {
    const { bookingId, packageId, rating, comment } = req.body;

    if (!bookingId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: 'bookingId, rating (1-5), and comment are required'
      });
    }

    const numericRating = Number(rating);
    if (numericRating < 1 || numericRating > 5) {
      return res.status(400).json({ success: false, message: 'Rating must be between 1 and 5' });
    }

    // Verify booking
    const query = bookingId.startsWith('TMS-') ? { bookingId } : { _id: bookingId };
    const booking = await Booking.findOne(query);

    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership check
    if (booking.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You can only review trips that you booked'
      });
    }

    // Enforce business rule: only COMPLETED bookings can be reviewed
    if (booking.status !== 'COMPLETED') {
      return res.status(400).json({
        success: false,
        message: `Reviews are only permitted for completed trips. Current status is ${booking.status}.`
      });
    }

    // Check if review already exists
    const existing = await Review.findOne({ booking: booking._id });
    if (existing) {
      return res.status(400).json({
        success: false,
        message: 'You have already submitted a review for this booking'
      });
    }

    const targetPackageId = packageId || booking.package;
    if (!targetPackageId) {
      return res.status(400).json({
        success: false,
        message: 'Package reference is required to attach the review'
      });
    }

    const review = await Review.create({
      user: req.user._id,
      booking: booking._id,
      package: targetPackageId,
      rating: numericRating,
      comment: comment.trim()
    });

    await review.populate('user', 'name');

    res.status(201).json({
      success: true,
      message: 'Review submitted successfully. Thank you for your feedback!',
      review
    });
  } catch (error) {
    next(error);
  }
};

/**
 * GET /api/v1/packages/:id/reviews
 * Retrieve public reviews for a specific tour package
 */
const getPackageReviews = async (req, res, next) => {
  try {
    const { id } = req.params;

    const reviews = await Review.find({ package: id })
      .populate('user', 'name')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      reviews
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createReview,
  getPackageReviews
};
