const mongoose = require('mongoose');

const itineraryDaySchema = new mongoose.Schema(
  {
    day: { type: Number, required: true },
    title: { type: String, required: true },
    description: { type: String, required: true }
  },
  { _id: false }
);

const availableDateSchema = new mongoose.Schema(
  {
    date: { type: Date, required: true },
    seatsLeft: { type: Number, required: true, min: 0 }
  },
  { _id: true }
);

const tourPackageSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please provide package title'],
      trim: true,
      maxlength: 150
    },
    destination: {
      type: String,
      required: [true, 'Please provide destination'],
      trim: true,
      index: true
    },
    description: {
      type: String,
      required: [true, 'Please provide description']
    },
    durationDays: {
      type: Number,
      required: [true, 'Please provide duration in days'],
      min: 1
    },
    price: {
      type: Number,
      required: [true, 'Please provide price per person in INR'],
      min: 0,
      index: true
    },
    category: {
      type: String,
      required: [true, 'Please provide category'],
      enum: ['adventure', 'beach', 'cultural', 'family', 'luxury', 'honeymoon'],
      index: true
    },
    images: {
      type: [String],
      default: []
    },
    itinerary: {
      type: [itineraryDaySchema],
      default: []
    },
    inclusions: {
      type: [String],
      default: []
    },
    maxGroupSize: {
      type: Number,
      default: 20
    },
    availableDates: {
      type: [availableDateSchema],
      default: []
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true
    },
    ratingAverage: {
      type: Number,
      default: 4.5,
      min: 1,
      max: 5,
      set: (val) => Math.round(val * 10) / 10
    },
    ratingCount: {
      type: Number,
      default: 0
    }
  },
  {
    timestamps: true
  }
);

// Text index for destination & title search
tourPackageSchema.index({ destination: 'text', title: 'text', description: 'text' });

module.exports = mongoose.model('TourPackage', tourPackageSchema);
