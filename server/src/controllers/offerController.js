const PromotionalOffer = require('../models/PromotionalOffer');

/**
 * @desc    Get all currently active promotional offers
 * @route   GET /api/v1/offers/active
 * @access  Public
 */
const getActiveOffers = async (req, res, next) => {
  try {
    const now = new Date();
    const offers = await PromotionalOffer.find({
      isActive: true,
      validFrom: { $lte: now },
      validTo: { $gte: now }
    }).select('-__v');

    res.status(200).json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Validate offer code and preview price breakdown
 * @route   POST /api/v1/offers/validate
 * @access  Public
 */
const validateOffer = async (req, res, next) => {
  try {
    const { code, amount } = req.body;

    if (!code) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a coupon code',
        errors: ['Missing offer code']
      });
    }

    const orderAmount = Number(amount) || 0;
    const offer = await PromotionalOffer.findOne({ code: code.toUpperCase() });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: `Coupon code '${code.toUpperCase()}' not found`,
        errors: ['Invalid code']
      });
    }

    const check = offer.calculateDiscount(orderAmount);
    if (!check.valid) {
      return res.status(400).json({
        success: false,
        message: check.message,
        errors: [check.message]
      });
    }

    // Calculate server-side tax (5%) on discounted amount
    const discountedAmount = Math.max(0, orderAmount - check.discount);
    const tax = Math.round(discountedAmount * 0.05);
    const total = discountedAmount + tax;

    res.status(200).json({
      success: true,
      valid: true,
      message: `Coupon '${offer.code}' applied successfully!`,
      offer: {
        code: offer.code,
        title: offer.title,
        description: offer.description,
        discountType: offer.discountType,
        discountValue: offer.discountValue
      },
      breakdown: {
        basePrice: orderAmount,
        discount: check.discount,
        discountedAmount,
        tax,
        total
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Get all offers (Admin)
 * @route   GET /api/v1/offers
 * @access  Private (Admin)
 */
const getAllOffers = async (req, res, next) => {
  try {
    const offers = await PromotionalOffer.find().sort({ createdAt: -1 });
    res.status(200).json({
      success: true,
      count: offers.length,
      offers
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Create promotional offer (Admin)
 * @route   POST /api/v1/offers
 * @access  Private (Admin)
 */
const createOffer = async (req, res, next) => {
  try {
    const offer = await PromotionalOffer.create(req.body);
    res.status(201).json({
      success: true,
      message: 'Promotional offer created successfully',
      offer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Update promotional offer (Admin)
 * @route   PATCH /api/v1/offers/:id
 * @access  Private (Admin)
 */
const updateOffer = async (req, res, next) => {
  try {
    const offer = await PromotionalOffer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer updated successfully',
      offer
    });
  } catch (error) {
    next(error);
  }
};

/**
 * @desc    Delete/Deactivate offer (Admin)
 * @route   DELETE /api/v1/offers/:id
 * @access  Private (Admin)
 */
const deleteOffer = async (req, res, next) => {
  try {
    const offer = await PromotionalOffer.findByIdAndUpdate(
      req.params.id,
      { isActive: false },
      { new: true }
    );

    if (!offer) {
      return res.status(404).json({
        success: false,
        message: 'Offer not found'
      });
    }

    res.status(200).json({
      success: true,
      message: 'Offer deactivated successfully',
      offer
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveOffers,
  validateOffer,
  getAllOffers,
  createOffer,
  updateOffer,
  deleteOffer
};
