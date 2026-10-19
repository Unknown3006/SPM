const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    bookingId: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      index: true
    },
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true
    },
    itemType: {
      type: String,
      enum: ['package', 'hotel', 'transport'],
      required: true
    },
    package: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TourPackage',
      default: null
    },
    hotel: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Hotel',
      default: null
    },
    transport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'TransportService',
      default: null
    },
    travelDate: {
      type: Date,
      default: null
    },
    checkInDate: {
      type: Date,
      default: null
    },
    checkOutDate: {
      type: Date,
      default: null
    },
    roomType: {
      type: String,
      default: null
    },
    travellers: [
      {
        name: { type: String, required: true, trim: true },
        age: { type: Number, required: true, min: 1, max: 120 },
        gender: { type: String, enum: ['male', 'female', 'other'], default: 'male' }
      }
    ],
    numberOfTravellers: {
      type: Number,
      required: true,
      min: 1
    },
    priceBreakdown: {
      unitPrice: { type: Number, required: true },
      basePrice: { type: Number, required: true },
      discount: { type: Number, default: 0 },
      discountDetails: {
        code: { type: String, default: null },
        discountType: { type: String, default: null },
        discountValue: { type: Number, default: 0 }
      },
      taxes: { type: Number, required: true },
      total: { type: Number, required: true }
    },
    appliedOfferCode: {
      type: String,
      uppercase: true,
      trim: true,
      default: null
    },
    status: {
      type: String,
      enum: ['PENDING_PAYMENT', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
      default: 'PENDING_PAYMENT',
      index: true
    },
    paymentExpiresAt: {
      type: Date,
      default: function () {
        return new Date(Date.now() + 15 * 60 * 1000); // 15 mins expiry
      },
      index: true
    },
    assignedAgent: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null
    },
    statusHistory: [
      {
        status: { type: String, required: true },
        changedAt: { type: Date, default: Date.now },
        changedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        note: { type: String, default: '' }
      }
    ],
    cancellation: {
      reason: { type: String, default: '' },
      cancelledAt: { type: Date, default: null },
      refundPercentage: { type: Number, default: 0 },
      refundAmount: { type: Number, default: 0 },
      refundStatus: {
        type: String,
        enum: ['NONE', 'PENDING', 'PROCESSED', 'FAILED'],
        default: 'NONE'
      },
      refundPaymentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Payment',
        default: null
      }
    },
    hiddenByCustomer: {
      type: Boolean,
      default: false,
      index: true
    }
  },
  {
    timestamps: true
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
