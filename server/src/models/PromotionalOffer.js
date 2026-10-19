const mongoose = require('mongoose');

const promotionalOfferSchema = new mongoose.Schema(
  {
    code: {
      type: String,
      required: [true, 'Please provide coupon offer code'],
      unique: true,
      uppercase: true,
      trim: true,
      index: true
    },
    title: {
      type: String,
      required: [true, 'Please provide offer title'],
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Please provide offer description']
    },
    discountType: {
      type: String,
      enum: ['PERCENT', 'FLAT'],
      required: [true, 'Please specify discount type (PERCENT or FLAT)']
    },
    discountValue: {
      type: Number,
      required: [true, 'Please specify discount value'],
      min: 0
    },
    maxDiscount: {
      type: Number,
      default: null // Cap for PERCENT discounts
    },
    minAmount: {
      type: Number,
      default: 0 // Minimum transaction amount to qualify
    },
    validFrom: {
      type: Date,
      required: [true, 'Please specify validity start date']
    },
    validTo: {
      type: Date,
      required: [true, 'Please specify validity end date']
    },
    usageLimit: {
      type: Number,
      default: 1000
    },
    usedCount: {
      type: Number,
      default: 0
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    }
  },
  {
    timestamps: true
  }
);

// Helper method to validate offer eligibility and calculate discount
promotionalOfferSchema.methods.calculateDiscount = function (amount) {
  const now = new Date();

  if (!this.isActive) {
    return { valid: false, message: 'This offer code is currently inactive', discount: 0 };
  }

  if (now < this.validFrom) {
    return { valid: false, message: 'This offer is not yet active', discount: 0 };
  }

  if (now > this.validTo) {
    return { valid: false, message: 'This offer code has expired', discount: 0 };
  }

  if (this.usageLimit && this.usedCount >= this.usageLimit) {
    return { valid: false, message: 'This offer code has reached its usage limit', discount: 0 };
  }

  if (amount < this.minAmount) {
    return {
      valid: false,
      message: `Minimum order amount of ₹${this.minAmount.toLocaleString()} required for this offer`,
      discount: 0
    };
  }

  let discount = 0;
  if (this.discountType === 'PERCENT') {
    discount = Math.round((amount * this.discountValue) / 100);
    if (this.maxDiscount && discount > this.maxDiscount) {
      discount = this.maxDiscount;
    }
  } else if (this.discountType === 'FLAT') {
    discount = Math.min(this.discountValue, amount);
  }

  return {
    valid: true,
    discount,
    code: this.code,
    title: this.title,
    discountType: this.discountType,
    discountValue: this.discountValue
  };
};

module.exports = mongoose.model('PromotionalOffer', promotionalOfferSchema);
